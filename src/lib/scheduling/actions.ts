import { addDays } from 'date-fns'
import { prisma } from '@/lib/prisma'
import type { OutcomeType } from '@/generated/prisma/client'
import { syncActivityLogsForInstance } from './schedule'

// Enrolls a prospect into a sequence template and generates their initial
// ActivityLog rows.
export async function enrollProspectInSequence(
  prospectId: string,
  templateId: string,
  startDate: Date = new Date()
) {
  const instance = await prisma.prospectSequenceInstance.create({
    data: { prospectId, templateId, startDate },
  })
  await syncActivityLogsForInstance(instance.id)
  return instance
}

// Marks a step done and recalculates every later step in that instance from
// the actual completion date.
export async function completeActivityLog(activityLogId: string, completedById: string, actualDate: Date = new Date()) {
  const log = await prisma.activityLog.update({
    where: { id: activityLogId },
    data: { actualDate, status: 'DONE', completedById },
  })
  await syncActivityLogsForInstance(log.instanceId)
  return log
}

// Manually skips a step (as opposed to the condition engine auto-skipping
// it). Marked sticky via completedById so future recalculations don't
// resurrect it as PENDING.
export async function skipActivityLog(activityLogId: string, skippedById: string) {
  const log = await prisma.activityLog.update({
    where: { id: activityLogId },
    data: { status: 'SKIPPED', actualDate: null, completedById: skippedById },
  })
  await syncActivityLogsForInstance(log.instanceId)
  return log
}

// Pushes a step's *effective* due date forward without touching its actual
// plannedDate or the downstream schedule chain — it reappears as due once
// the snooze passes.
export async function snoozeActivityLog(activityLogId: string, days: number = 1) {
  return prisma.activityLog.update({
    where: { id: activityLogId },
    data: { snoozedUntil: addDays(new Date(), days) },
  })
}

// Reverts a completed step back to an open state (e.g. marked done by
// mistake) and recalculates downstream dates back off the original chain.
export async function reopenActivityLog(activityLogId: string) {
  const log = await prisma.activityLog.update({
    where: { id: activityLogId },
    data: { actualDate: null, status: 'PENDING', completedById: null },
  })
  await syncActivityLogsForInstance(log.instanceId)
  return log
}

// Logs an outcome (step-level or prospect-level) and re-syncs every active
// sequence instance for that prospect, since outcomes can flip a downstream
// step's condition (e.g. a reply skipping a later InMail step).
export async function recordOutcome(input: {
  type: OutcomeType
  date?: Date
  notes?: string
  activityLogId?: string
  prospectId?: string
}) {
  const outcome = await prisma.outcome.create({ data: input })

  let prospectId = input.prospectId
  if (!prospectId && input.activityLogId) {
    const log = await prisma.activityLog.findUniqueOrThrow({
      where: { id: input.activityLogId },
      include: { instance: true },
    })
    prospectId = log.instance.prospectId
  }

  if (prospectId) {
    const instances = await prisma.prospectSequenceInstance.findMany({
      where: { prospectId, status: 'ACTIVE' },
      select: { id: true },
    })
    for (const instance of instances) {
      await syncActivityLogsForInstance(instance.id)
    }
  }

  return outcome
}
