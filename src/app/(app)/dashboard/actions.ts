'use server'

import { revalidatePath } from 'next/cache'
import {
  completeActivityLog,
  skipActivityLog,
  snoozeActivityLog,
  recordOutcome,
} from '@/lib/scheduling/actions'
import { assertCanActOnActivityLog } from '@/lib/scheduling/access'
import type { OutcomeType } from '@/generated/prisma/client'

export async function markDoneAction(activityLogId: string) {
  const userId = await assertCanActOnActivityLog(activityLogId)
  await completeActivityLog(activityLogId, userId)
  revalidatePath('/dashboard')
}

export async function skipAction(activityLogId: string) {
  const userId = await assertCanActOnActivityLog(activityLogId)
  await skipActivityLog(activityLogId, userId)
  revalidatePath('/dashboard')
}

export async function snoozeAction(activityLogId: string, days: number = 1) {
  await assertCanActOnActivityLog(activityLogId)
  await snoozeActivityLog(activityLogId, days)
  revalidatePath('/dashboard')
}

export async function logOutcomeAction(activityLogId: string, type: OutcomeType) {
  await assertCanActOnActivityLog(activityLogId)
  await recordOutcome({ type, activityLogId })
  revalidatePath('/dashboard')
}
