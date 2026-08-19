import type { OutcomeType } from '@/generated/prisma/client'

// The set of boolean "facts" a SequenceStep.condition rule can test against.
// Derived from a prospect's logged Outcomes (present = true).
export type Facts = Record<string, boolean>

const FACT_BY_OUTCOME_TYPE: Record<OutcomeType, string> = {
  LINKEDIN_CONNECTION_ACCEPTED: 'connection_accepted',
  REPLY_RECEIVED: 'reply_received',
  MEETING_BOOKED: 'meeting_booked',
  OPPORTUNITY_CREATED: 'opportunity_created',
  OPTED_OUT: 'opted_out',
}

export function buildFacts(outcomes: { type: OutcomeType }[]): Facts {
  const present = new Set(outcomes.map((o) => o.type))
  const facts: Facts = {}
  for (const [outcomeType, factName] of Object.entries(FACT_BY_OUTCOME_TYPE) as [OutcomeType, string][]) {
    facts[factName] = present.has(outcomeType)
  }
  return facts
}
