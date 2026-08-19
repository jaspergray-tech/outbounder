import { Resend } from 'resend'
import type { EmailMessage, NotificationService } from './service'

// Until a custom domain is verified in Resend, this must stay
// "onboarding@resend.dev" — Resend's sandbox sender, which can only deliver
// to the email address the Resend account itself was signed up with. Once a
// verified domain exists, set NOTIFICATIONS_FROM_EMAIL to an address on it
// and it'll be able to send to every user (Owner + Manager), not just one.
const FROM_EMAIL = process.env.NOTIFICATIONS_FROM_EMAIL ?? 'onboarding@resend.dev'

class ResendNotificationService implements NotificationService {
  constructor(private client: Resend) {}

  async sendEmail(message: EmailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: FROM_EMAIL,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    })
    if (error) throw new Error(`Resend send failed: ${error.message}`)
  }
}

let instance: NotificationService | undefined

export function getNotificationService(): NotificationService {
  if (!instance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY is not set')
    instance = new ResendNotificationService(new Resend(apiKey))
  }
  return instance
}
