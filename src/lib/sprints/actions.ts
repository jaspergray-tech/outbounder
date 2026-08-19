'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { recordOutcome } from '@/lib/scheduling/actions'
import { requireUserId, requireOwner } from '@/lib/scheduling/access'
import type { OutcomeType } from '@/generated/prisma/client'

export async function logProspectOutcomeAction(prospectId: string, type: OutcomeType) {
  await requireUserId()
  await recordOutcome({ type, prospectId })
  revalidatePath('/sprints')
}

// Destructive — deletes the sprint and every prospect, sequence instance,
// activity log, and outcome tied to it. Owner-only, confirmed client-side
// before this is ever called.
export async function deleteSprintAction(sprintId: string) {
  await requireOwner()

  const prospects = await prisma.prospect.findMany({ where: { sprintId }, select: { id: true } })
  const prospectIds = prospects.map((p) => p.id)

  await prisma.$transaction([
    prisma.outcome.deleteMany({
      where: {
        OR: [
          { prospectId: { in: prospectIds } },
          { activityLog: { instance: { prospectId: { in: prospectIds } } } },
        ],
      },
    }),
    // ActivityLog rows cascade-delete with their instance.
    prisma.prospectSequenceInstance.deleteMany({ where: { prospectId: { in: prospectIds } } }),
    prisma.prospect.deleteMany({ where: { sprintId } }),
    prisma.sprint.delete({ where: { id: sprintId } }),
  ])

  redirect('/sprints')
}
