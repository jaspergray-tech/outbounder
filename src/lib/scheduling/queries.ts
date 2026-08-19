import { addDays, startOfDay } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { getDisplayStatus } from './schedule'
import type { Role, Channel } from '@/generated/prisma/client'

export type DueBucketRow = {
  id: string
  plannedDate: Date
  dayOffset: number
  channel: Channel
  prospect: { id: string; name: string; company: string | null; jobTitle: string | null }
}

export type DueBuckets = {
  overdue: DueBucketRow[]
  dueToday: DueBucketRow[]
  upcoming: DueBucketRow[]
}

// Shared by the dashboard (per signed-in user), the sprint detail view, and
// the daily digest email — same "active step only" + role-scoping +
// DUE/OVERDUE/upcoming bucketing logic everywhere the queue is shown.
//
// "Active step" = the single earliest not-yet-resolved (PENDING) step in a
// prospect's sequence, in (dayOffset, orderIndex) order. Every step after it
// is invisible here even if it's technically PENDING — it isn't this
// prospect's turn yet. This is purely a display-layer concept: the full
// per-step schedule/condition recalculation in schedule.ts is untouched and
// still runs against every step, exactly as before.
export async function getDueBuckets(
  role?: Role,
  today: Date = startOfDay(new Date()),
  sprintId?: string
): Promise<DueBuckets> {
  const upcomingWindowEnd = addDays(today, 7)

  const logs = await prisma.activityLog.findMany({
    where: {
      instance: {
        status: 'ACTIVE',
        prospect: { status: 'ACTIVE', ...(sprintId ? { sprintId } : {}) },
      },
    },
    include: { step: true, instance: { include: { prospect: true } } },
    orderBy: [{ instanceId: 'asc' }, { step: { dayOffset: 'asc' } }, { step: { orderIndex: 'asc' } }],
  })

  const overdue: DueBucketRow[] = [];
  const dueToday: DueBucketRow[] = [];
  const upcoming: DueBucketRow[] = [];

  const resolvedInstances = new Set<string>()

  for (const log of logs) {
    if (resolvedInstances.has(log.instanceId)) continue
    if (log.status !== 'PENDING') continue
    // First PENDING log encountered, in sequence order, for this instance —
    // this is its active step. Stop considering any later log for it,
    // whether or not it ends up passing the role filter below.
    resolvedInstances.add(log.instanceId)

    if (role && log.step.assignedRole !== role) continue

    const row: DueBucketRow = {
      id: log.id,
      plannedDate: log.plannedDate,
      dayOffset: log.step.dayOffset,
      channel: log.step.channel,
      prospect: {
        id: log.instance.prospect.id,
        name: log.instance.prospect.name,
        company: log.instance.prospect.company,
        jobTitle: log.instance.prospect.jobTitle,
      },
    }

    const display = getDisplayStatus(log, today)
    const effectiveDate =
      log.snoozedUntil && log.snoozedUntil > log.plannedDate ? log.snoozedUntil : log.plannedDate

    if (display === 'OVERDUE') overdue.push(row)
    else if (display === 'DUE') dueToday.push(row)
    else if (effectiveDate <= upcomingWindowEnd) upcoming.push(row)
  }

  return { overdue, dueToday, upcoming }
}
