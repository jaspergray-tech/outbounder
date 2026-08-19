import { prisma } from '@/lib/prisma'
import type { Channel, ProspectStatus, SprintStatus } from '@/generated/prisma/client'

export type SprintSummary = {
  id: string
  name: string
  description: string | null
  status: SprintStatus
  createdAt: Date
  totalProspects: number
  activeProspects: number
  meetingsBooked: number
  optedOut: number
}

// COMPLETED/OPTED_OUT prospect status is only ever set by the exit-cadence
// outcome logic in recordOutcome() (meeting booked / opted out respectively)
// — so these counts are derivable straight from Prospect.status, no need to
// look at the Outcome table.
export async function getSprintSummaries(): Promise<SprintSummary[]> {
  const sprints = await prisma.sprint.findMany({
    orderBy: { createdAt: 'desc' },
    include: { prospects: { select: { status: true } } },
  })

  return sprints.map((sprint) => {
    const counts: Record<ProspectStatus, number> = { ACTIVE: 0, PAUSED: 0, COMPLETED: 0, OPTED_OUT: 0 }
    for (const p of sprint.prospects) counts[p.status]++
    return {
      id: sprint.id,
      name: sprint.name,
      description: sprint.description,
      status: sprint.status,
      createdAt: sprint.createdAt,
      totalProspects: sprint.prospects.length,
      activeProspects: counts.ACTIVE + counts.PAUSED,
      meetingsBooked: counts.COMPLETED,
      optedOut: counts.OPTED_OUT,
    }
  })
}

export type SprintProspectRow = {
  id: string
  name: string
  company: string | null
  jobTitle: string | null
  status: ProspectStatus
  activeStep: { dayOffset: number; channel: Channel; plannedDate: Date } | null
}

export type SprintDetail = {
  id: string
  name: string
  description: string | null
  status: SprintStatus
  prospects: SprintProspectRow[]
}

export async function getSprintDetail(sprintId: string): Promise<SprintDetail | null> {
  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } })
  if (!sprint) return null

  const prospects = await prisma.prospect.findMany({
    where: { sprintId },
    orderBy: { name: 'asc' },
    include: {
      instances: {
        where: { status: 'ACTIVE' },
        include: {
          activityLogs: {
            where: { status: 'PENDING' },
            orderBy: [{ step: { dayOffset: 'asc' } }, { step: { orderIndex: 'asc' } }],
            take: 1,
            include: { step: true },
          },
        },
      },
    },
  })

  return {
    id: sprint.id,
    name: sprint.name,
    description: sprint.description,
    status: sprint.status,
    prospects: prospects.map((p) => {
      const activeLog = p.instances.flatMap((i) => i.activityLogs)[0]
      return {
        id: p.id,
        name: p.name,
        company: p.company,
        jobTitle: p.jobTitle,
        status: p.status,
        activeStep: activeLog
          ? { dayOffset: activeLog.step.dayOffset, channel: activeLog.step.channel, plannedDate: activeLog.plannedDate }
          : null,
      }
    }),
  }
}
