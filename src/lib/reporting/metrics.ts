import { prisma } from '@/lib/prisma'
import type { AssignedRole, Channel, OutcomeType } from '@/generated/prisma/client'

export type ReportFilters = {
  sprintId?: string
  templateId?: string
  personRole?: AssignedRole
}

export type ReportSummary = {
  prospectsInScope: number
  prospectsContacted: number
  stepsCompleted: number
  replyRate: number | null
  connectionAcceptanceRate: number | null
  meetingBookedRate: number | null
  opportunityCreatedRate: number | null
  optOutRate: number | null
}

export type ChannelBreakdownRow = {
  channel: Channel
  done: number
  open: number
  skipped: number
  // Only meaningful for the two LinkedIn-connection channels — null elsewhere.
  acceptanceRate: number | null
}

const CONNECTION_CHANNELS: Channel[] = ['LINKEDIN_CONNECTION_MINE', 'LINKEDIN_CONNECTION_GTMM']

function rate(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null
  return numerator / denominator
}

// All rates are computed at the prospect level (e.g. "of everyone we've
// actually contacted, what % replied") rather than per-touch, since a single
// reply/meeting/opt-out isn't tied to one specific message — it's a
// prospect-level outcome, matching how Outcome is modelled in the schema.
// The one exception is connection-acceptance rate, which is inherently a
// per-step-send stat (a prospect could have both a "mine" and a "GTMM"
// connection step, each independently accepted or not).
//
// personRole filtering: when scoping to one person's steps, prospect-level
// outcomes with no activityLogId (e.g. a meeting booked without being
// attached to a specific step) can't be attributed to either person, so
// they're excluded from that person's numbers rather than guessed at.
export async function getReportSummary(
  filters: ReportFilters
): Promise<{ summary: ReportSummary; channelBreakdown: ChannelBreakdownRow[] }> {
  const { sprintId, templateId, personRole } = filters

  const logs = await prisma.activityLog.findMany({
    where: {
      instance: {
        ...(sprintId ? { prospect: { sprintId } } : {}),
        ...(templateId ? { templateId } : {}),
      },
      ...(personRole ? { step: { assignedRole: personRole } } : {}),
    },
    include: {
      step: true,
      outcomes: true,
      instance: { include: { prospect: true } },
    },
  })

  const prospectsInScope = new Set(logs.map((l) => l.instance.prospect.id))
  const doneLogs = logs.filter((l) => l.status === 'DONE')
  const contactedProspectIds = new Set(doneLogs.map((l) => l.instance.prospect.id))

  const outcomesByProspect = new Map<string, Set<OutcomeType>>()
  function recordOutcome(prospectId: string, type: OutcomeType) {
    if (!outcomesByProspect.has(prospectId)) outcomesByProspect.set(prospectId, new Set())
    outcomesByProspect.get(prospectId)!.add(type)
  }

  for (const log of logs) {
    for (const outcome of log.outcomes) {
      recordOutcome(log.instance.prospect.id, outcome.type)
    }
  }

  if (!personRole) {
    const prospectLevelOutcomes = await prisma.outcome.findMany({
      where: { prospectId: { in: [...prospectsInScope] } },
    })
    for (const outcome of prospectLevelOutcomes) {
      if (outcome.prospectId) recordOutcome(outcome.prospectId, outcome.type)
    }
  }

  function countProspectsWithOutcome(type: OutcomeType): number {
    let count = 0
    for (const types of outcomesByProspect.values()) {
      if (types.has(type)) count++
    }
    return count
  }

  const connectionLogs = doneLogs.filter((l) => CONNECTION_CHANNELS.includes(l.step.channel))
  const connectionAccepted = connectionLogs.filter((l) =>
    l.outcomes.some((o) => o.type === 'LINKEDIN_CONNECTION_ACCEPTED')
  )

  const summary: ReportSummary = {
    prospectsInScope: prospectsInScope.size,
    prospectsContacted: contactedProspectIds.size,
    stepsCompleted: doneLogs.length,
    replyRate: rate(countProspectsWithOutcome('REPLY_RECEIVED'), contactedProspectIds.size),
    connectionAcceptanceRate: rate(connectionAccepted.length, connectionLogs.length),
    meetingBookedRate: rate(countProspectsWithOutcome('MEETING_BOOKED'), contactedProspectIds.size),
    opportunityCreatedRate: rate(countProspectsWithOutcome('OPPORTUNITY_CREATED'), contactedProspectIds.size),
    optOutRate: rate(countProspectsWithOutcome('OPTED_OUT'), contactedProspectIds.size),
  }

  const byChannel = new Map<
    Channel,
    { done: number; open: number; skipped: number; connSent: number; connAccepted: number }
  >()
  function channelEntry(channel: Channel) {
    if (!byChannel.has(channel)) byChannel.set(channel, { done: 0, open: 0, skipped: 0, connSent: 0, connAccepted: 0 })
    return byChannel.get(channel)!
  }

  for (const log of logs) {
    const entry = channelEntry(log.step.channel)
    if (log.status === 'DONE') entry.done++
    else if (log.status === 'SKIPPED') entry.skipped++
    else entry.open++
  }
  for (const log of connectionLogs) channelEntry(log.step.channel).connSent++
  for (const log of connectionAccepted) channelEntry(log.step.channel).connAccepted++

  const channelBreakdown: ChannelBreakdownRow[] = [...byChannel.entries()]
    .map(([channel, v]) => ({
      channel,
      done: v.done,
      open: v.open,
      skipped: v.skipped,
      acceptanceRate: CONNECTION_CHANNELS.includes(channel) ? rate(v.connAccepted, v.connSent) : null,
    }))
    .sort((a, b) => a.channel.localeCompare(b.channel))

  return { summary, channelBreakdown }
}
