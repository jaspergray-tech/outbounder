import type { Channel, OutcomeType } from '@/generated/prisma/client'

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
