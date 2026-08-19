// Swappable notification transport — Resend (email) is the first adapter;
// a Slack webhook adapter can implement the same interface later once IT
// confirms it's permitted, without touching any of the digest-building logic.
export type EmailMessage = {
  to: string
  subject: string
  html: string
  text: string
}

export interface NotificationService {
  sendEmail(message: EmailMessage): Promise<void>
}
