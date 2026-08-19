import { addDays, startOfDay } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { evaluateCondition } from './condition'
import { buildFacts } from './facts'
import type { ActivityStatus } from '@/generated/prisma/client'

// Recomputes plannedDate + status for every step in a prospect's sequence
// instance. Steps are walked in (dayOffset, orderIndex) order, carrying a
// "reference point" forward: it starts at the instance's startDate (offset 0)
// and jumps to a step's actualDate (at that step's dayOffset) whenever that
// step has actually been completed. Every later step's plannedDate is the
// reference date plus the gap (in days) between its dayOffset and the
// reference's dayOffset — so completing a step late (or early) shifts every
// later step by the same amount, instead of the sequence sticking to fixed
// offsets from the original start date.
//
// Steps whose condition no longer evaluates true against the prospect's
// current Outcomes are marked SKIPPED. DONE steps are never rewritten (their
// actualDate is history) — same for a *manually* skipped step (status
// SKIPPED with completedById set, meaning a person chose to skip it, as
// opposed to the condition engine skipping it automatically, which leaves
// completedById null and stays open to being recomputed as outcomes change).
export async function syncActivityLogsForInstance(instanceId: string) {
  const instance = await prisma.prospectSequenceInstance.findUniqueOrThrow({
    where: { id: instanceId },
    include: {
      prospect: { include: { outcomes: true } },
      template: { include: { steps: { orderBy: [{ dayOffset: 'asc' }, { orderIndex: 'asc' }] } } },
      activityLogs: true,
    },
  })

  const facts = buildFacts(instance.prospect.outcomes)
  const logsByStepId = new Map(instance.activityLogs.map((log) => [log.stepId, log]))

  let referenceDate = startOfDay(instance.startDate)
  let referenceOffset = 0

  for (const step of instance.template.steps) {
    const existing = logsByStepId.get(step.id)

    if (existing?.status === 'DONE' && existing.actualDate) {
      referenceDate = startOfDay(existing.actualDate)
      referenceOffset = step.dayOffset
      continue
    }

    if (existing?.status === 'SKIPPED' && existing.completedById) {
      continue // manually skipped — leave as-is, don't let condition re-evaluation resurrect it
    }

    const plannedDate = addDays(referenceDate, step.dayOffset - referenceOffset)
    const applicable = evaluateCondition(step.condition, facts)
    const status: ActivityStatus = applicable ? 'PENDING' : 'SKIPPED'

    if (existing) {
      if (existing.plannedDate.getTime() !== plannedDate.getTime() || existing.status !== status) {
        await prisma.activityLog.update({
          where: { id: existing.id },
          data: { plannedDate, status },
        })
      }
    } else {
      await prisma.activityLog.create({
        data: { instanceId, stepId: step.id, plannedDate, status },
      })
    }
  }
}

// Display-only bucket for the dashboard/reporting: DUE/OVERDUE are never
// persisted, they're derived from plannedDate vs. today at read time so they
// never go stale between recalculations. A snooze pushes the *effective*
// date used for this comparison forward without touching the underlying
// plannedDate/schedule chain — once snoozedUntil passes, it's ignored again.
export type DisplayStatus = 'PENDING' | 'DUE' | 'OVERDUE' | 'DONE' | 'SKIPPED'

export function getDisplayStatus(
  log: { status: ActivityStatus; plannedDate: Date; snoozedUntil?: Date | null },
  today: Date = startOfDay(new Date())
): DisplayStatus {
  if (log.status === 'DONE' || log.status === 'SKIPPED') return log.status

  const todayStart = startOfDay(today)
  const planned = startOfDay(log.plannedDate)
  // A snooze only ever pushes the effective date later — if it's earlier
  // than (or equal to) the naturally planned date, it has no effect.
  const effectiveDate =
    log.snoozedUntil && startOfDay(log.snoozedUntil).getTime() > planned.getTime()
      ? startOfDay(log.snoozedUntil)
      : planned

  if (effectiveDate.getTime() < todayStart.getTime()) return 'OVERDUE'
  if (effectiveDate.getTime() === todayStart.getTime()) return 'DUE'
  return 'PENDING'
}
