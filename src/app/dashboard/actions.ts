'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  completeActivityLog,
  skipActivityLog,
  snoozeActivityLog,
  recordOutcome,
} from '@/lib/scheduling/actions'
import type { OutcomeType } from '@/generated/prisma/client'

// Owner can act on any step; a Manager can only act on steps assigned to
// their own role.
async function assertCanActOn(activityLogId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authorized')

  const log = await prisma.activityLog.findUniqueOrThrow({
    where: { id: activityLogId },
    include: { step: true },
  })
  if (session.user.role !== 'OWNER' && log.step.assignedRole !== session.user.role) {
    throw new Error('Not authorized for this step')
  }
  return session.user.id
}

export async function markDoneAction(activityLogId: string) {
  const userId = await assertCanActOn(activityLogId)
  await completeActivityLog(activityLogId, userId)
  revalidatePath('/dashboard')
}

export async function skipAction(activityLogId: string) {
  const userId = await assertCanActOn(activityLogId)
  await skipActivityLog(activityLogId, userId)
  revalidatePath('/dashboard')
}

export async function snoozeAction(activityLogId: string, days: number = 1) {
  await assertCanActOn(activityLogId)
  await snoozeActivityLog(activityLogId, days)
  revalidatePath('/dashboard')
}

export async function logOutcomeAction(activityLogId: string, type: OutcomeType) {
  await assertCanActOn(activityLogId)
  await recordOutcome({ type, activityLogId })
  revalidatePath('/dashboard')
}
