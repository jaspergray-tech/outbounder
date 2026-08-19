import { prisma } from '@/lib/prisma'
import type {
  ActivityStatus,
  AssignedRole,
  Channel,
  InstanceStatus,
  OutcomeType,
  ProspectStatus,
} from '@/generated/prisma/client'

export type ProspectStepRow = {
  activityLogId: string
  stepId: string
  dayOffset: number
  orderIndex: number
  channel: Channel
  assignedRole: AssignedRole
  status: ActivityStatus
  plannedDate: Date
  actualDate: Date | null
  snoozedUntil: Date | null
  completedByName: string | null
}

export type ProspectDetail = {
  id: string
  name: string
  jobTitle: string | null
  company: string | null
  location: string | null
  linkedinUrl: string | null
  email: string | null
  notes: string | null
  status: ProspectStatus
  sprint: { id: string; name: string }
  instance: { id: string; templateName: string; status: InstanceStatus } | null
  steps: ProspectStepRow[]
  outcomes: { id: string; type: OutcomeType; date: Date; notes: string | null }[]
}

// Shows the prospect's most recent sequence instance (the normal case is
// exactly one). Steps are returned in full — including DONE/SKIPPED history
// — unlike the queue views, which only ever surface the single active step.
export async function getProspectDetail(prospectId: string): Promise<ProspectDetail | null> {
  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    include: {
      sprint: true,
      outcomes: { orderBy: { date: 'desc' } },
      instances: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          template: true,
          activityLogs: {
            orderBy: [{ step: { dayOffset: 'asc' } }, { step: { orderIndex: 'asc' } }],
            include: { step: true, completedBy: true },
          },
        },
      },
    },
  })
  if (!prospect) return null

  const instance = prospect.instances[0] ?? null

  return {
    id: prospect.id,
    name: prospect.name,
    jobTitle: prospect.jobTitle,
    company: prospect.company,
    location: prospect.location,
    linkedinUrl: prospect.linkedinUrl,
    email: prospect.email,
    notes: prospect.notes,
    status: prospect.status,
    sprint: { id: prospect.sprint.id, name: prospect.sprint.name },
    instance: instance ? { id: instance.id, templateName: instance.template.name, status: instance.status } : null,
    steps: instance
      ? instance.activityLogs.map((log) => ({
          activityLogId: log.id,
          stepId: log.stepId,
          dayOffset: log.step.dayOffset,
          orderIndex: log.step.orderIndex,
          channel: log.step.channel,
          assignedRole: log.step.assignedRole,
          status: log.status,
          plannedDate: log.plannedDate,
          actualDate: log.actualDate,
          snoozedUntil: log.snoozedUntil,
          completedByName: log.completedBy?.name ?? null,
        }))
      : [],
    outcomes: prospect.outcomes.map((o) => ({ id: o.id, type: o.type, date: o.date, notes: o.notes })),
  }
}
