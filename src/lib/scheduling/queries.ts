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

// Shared by the dashboard (per signed-in user) and the daily digest email
// (per user, looped over all users) — same role-scoping and DUE/OVERDUE/
// upcoming bucketing logic in both places.
export async function getDueBuckets(
  role?: Role,
  today: Date = startOfDay(new Date())
): Promise<DueBuckets> {
  const upcomingWindowEnd = addDays(today, 7)

  const logs = await prisma.activityLog.findMany({
    where: {
      status: 'PENDING',
      instance: { status: 'ACTIVE', prospect: { status: 'ACTIVE' } },
      ...(role === 'MANAGER' ? { step: { assignedRole: 'MANAGER' } } : {}),
    },
    include: { step: true, instance: { include: { prospect: true } } },
    orderBy: { plannedDate: 'asc' },
  })

  const overdue: DueBucketRow[] = []
  const dueToday: DueBucketRow[] = []
  const upcoming: DueBucketRow[] = []

  for (const log of logs) {
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
