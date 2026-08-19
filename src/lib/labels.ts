import type { ActivityStatus, Channel, OutcomeType, ProspectStatus } from '@/generated/prisma/client'

export const CHANNEL_LABELS: Record<Channel, string> = {
  EMAIL_MINE: 'Email (mine)',
  EMAIL_GTMM: 'Email (GTMM)',
  LINKEDIN_CONNECTION_MINE: 'LinkedIn connection (mine)',
  LINKEDIN_CONNECTION_GTMM: 'LinkedIn connection (GTMM)',
  LINKEDIN_MESSAGE: 'LinkedIn message',
  LINKEDIN_INMAIL: 'LinkedIn InMail',
  COLD_CALL: 'Cold call',
}

export const OUTCOME_LABELS: Record<OutcomeType, string> = {
  LINKEDIN_CONNECTION_ACCEPTED: 'Connection accepted',
  REPLY_RECEIVED: 'Reply received',
  MEETING_BOOKED: 'Meeting booked',
  OPPORTUNITY_CREATED: 'Opportunity created',
  OPTED_OUT: 'Opted out',
}

// Tone drives badge colour everywhere a status is shown: green is reserved
// for positive/completed states, red for attention/negative states, neutral
// (black/beige) for everything in between.
export type Tone = 'neutral' | 'positive' | 'negative'

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Meeting booked',
  OPTED_OUT: 'Opted out',
}

export const PROSPECT_STATUS_TONE: Record<ProspectStatus, Tone> = {
  ACTIVE: 'neutral',
  PAUSED: 'neutral',
  COMPLETED: 'positive',
  OPTED_OUT: 'negative',
}

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  PENDING: 'Pending',
  DUE: 'Due',
  OVERDUE: 'Overdue',
  DONE: 'Done',
  SKIPPED: 'Skipped',
}

export const ACTIVITY_STATUS_TONE: Record<ActivityStatus, Tone> = {
  PENDING: 'neutral',
  DUE: 'neutral',
  OVERDUE: 'negative',
  DONE: 'positive',
  SKIPPED: 'neutral',
}
