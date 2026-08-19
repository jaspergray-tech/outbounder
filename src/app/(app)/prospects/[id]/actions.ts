'use server'

import { revalidatePath } from 'next/cache'
import {
  completeActivityLog,
  skipActivityLog,
  snoozeActivityLog,
  reopenActivityLog,
  recordOutcome,
  rewindInstanceToStep,
} from '@/lib/scheduling/actions'
import { assertCanActOnActivityLog, requireUserId } from '@/lib/scheduling/access'
import type { OutcomeType } from '@/generated/prisma/client'

export async function markDoneAction(activityLogId: string, prospectId: string) {
  const userId = await assertCanActOnActivityLog(activityLogId)
  await completeActivityLog(activityLogId, userId)
  revalidatePath(`/prospects/${prospectId}`)
}

export async function skipAction(activityLogId: string, prospectId: string) {
  const userId = await assertCanActOnActivityLog(activityLogId)
  await skipActivityLog(activityLogId, userId)
  revalidatePath(`/prospects/${prospectId}`)
}

export async function snoozeAction(activityLogId: string, prospectId: string, days: number = 1) {
  await assertCanActOnActivityLog(activityLogId)
  await snoozeActivityLog(activityLogId, days)
  revalidatePath(`/prospects/${prospectId}`)
}

export async function reopenAction(activityLogId: string, prospectId: string) {
  await assertCanActOnActivityLog(activityLogId)
  await reopenActivityLog(activityLogId)
  revalidatePath(`/prospects/${prospectId}`)
}

export async function logStepOutcomeAction(activityLogId: string, prospectId: string, type: OutcomeType) {
  await assertCanActOnActivityLog(activityLogId)
  await recordOutcome({ type, activityLogId })
  revalidatePath(`/prospects/${prospectId}`)
}

export async function logProspectOutcomeAction(prospectId: string, type: OutcomeType) {
  await requireUserId()
  await recordOutcome({ type, prospectId })
  revalidatePath(`/prospects/${prospectId}`)
}

export async function rewindStepAction(instanceId: string, stepId: string, prospectId: string) {
  await requireUserId()
  await rewindInstanceToStep(instanceId, stepId)
  revalidatePath(`/prospects/${prospectId}`)
}
