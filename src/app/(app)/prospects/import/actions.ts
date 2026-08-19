'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { enrollProspectInSequence } from '@/lib/scheduling/actions'
import type { ImportRow } from '@/lib/import/parseTable'

export async function importProspects(input: {
  rows: ImportRow[]
  sprintId?: string
  newSprintName?: string
  templateId: string
  startDate: string // yyyy-mm-dd
}) {
  const session = await auth()
  if (session?.user?.role !== 'OWNER' || !session.user.id) {
    throw new Error('Not authorized')
  }
  if (input.rows.length === 0) {
    throw new Error('No rows to import')
  }
  if (!input.templateId) {
    throw new Error('Choose a sequence template')
  }

  let sprintId = input.sprintId
  if (!sprintId) {
    if (!input.newSprintName?.trim()) {
      throw new Error('Provide a sprint name or select an existing sprint')
    }
    const sprint = await prisma.sprint.create({
      data: {
        name: input.newSprintName.trim(),
        createdById: session.user.id,
        defaultTemplateId: input.templateId,
      },
    })
    sprintId = sprint.id
  }

  const startDate = new Date(input.startDate)
  let created = 0

  for (const row of input.rows) {
    if (!row.name.trim()) continue

    const prospect = await prisma.prospect.create({
      data: {
        name: row.name.trim(),
        jobTitle: row.jobTitle.trim() || null,
        company: row.company.trim() || null,
        location: row.location.trim() || null,
        email: row.email.trim() || null,
        linkedinUrl: row.linkedinUrl.trim() || null,
        notes: row.notes.trim() || null,
        sprintId,
      },
    })
    await enrollProspectInSequence(prospect.id, input.templateId, startDate)
    created += 1
  }

  return { created, sprintId }
}
