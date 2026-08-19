import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Owner can act on any step; a Manager can only act on steps assigned to
// their own role. Shared by every server action entry point that mutates an
// ActivityLog (dashboard queue, prospect edit view, etc.).
export async function assertCanActOnActivityLog(activityLogId: string) {
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

// Prospect-level actions (logging a prospect-wide outcome, rewinding a step)
// aren't tied to one role-assigned step — any signed-in user (Owner or
// Manager) can act on them.
export async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authorized')
  return session.user.id
}

export async function requireOwner() {
  const session = await auth()
  if (session?.user?.role !== 'OWNER') throw new Error('Not authorized')
  return session.user.id
}
