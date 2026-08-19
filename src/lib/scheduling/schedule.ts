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
// actualDate is history), everything else (PENDING/SKIPPED) is safe to
// recompute freely since outcomes/completions can change at any time.
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
// never go stale between recalculations.
export type DisplayStatus = 'PENDING' | 'DUE' | 'OVERDUE' | 'DONE' | 'SKIPPED'

export function getDisplayStatus(
  log: { status: ActivityStatus; plannedDate: Date },
  today: Date = startOfDay(new Date())
): DisplayStatus {
  if (log.status === 'DONE' || log.status === 'SKIPPED') return log.status

  const planned = startOfDay(log.plannedDate)
  const todayStart = startOfDay(today)
  if (planned.getTime() < todayStart.getTime()) return 'OVERDUE'
  if (planned.getTime() === todayStart.getTime()) return 'DUE'
  return 'PENDING'
}
