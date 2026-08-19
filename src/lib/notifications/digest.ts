import { prisma } from '@/lib/prisma'
import { CHANNEL_LABELS } from '@/lib/labels'
import { getDueBuckets, type DueBucketRow } from '@/lib/scheduling/queries'
import { getNotificationService } from './resend'
import type { NotificationService } from './service'

// VERCEL_URL is set automatically on every Vercel deployment — no extra
// config needed to get a working dashboard link in the email.
const APP_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'

function rowText(row: DueBucketRow): string {
  const meta = [row.prospect.jobTitle, row.prospect.company].filter(Boolean).join(' · ')
  return `${row.prospect.name}${meta ? ` (${meta})` : ''} — ${CHANNEL_LABELS[row.channel]}, day ${row.dayOffset}`
}

function listHtml(title: string, rows: DueBucketRow[]): string {
  if (rows.length === 0) return ''
  const items = rows
    .map((row) => {
      const meta = [row.prospect.jobTitle, row.prospect.company].filter(Boolean).join(' · ')
      return `<li><strong>${row.prospect.name}</strong>${meta ? ` (${meta})` : ''} — ${CHANNEL_LABELS[row.channel]}, day ${row.dayOffset}</li>`
    })
    .join('')
  return `<h2 style="font-size:14px;margin:16px 0 4px;">${title} (${rows.length})</h2><ul style="margin:0;padding-left:20px;">${items}</ul>`
}

function buildEmail(overdue: DueBucketRow[], dueToday: DueBucketRow[]) {
  const subject = `Outbound cadence: ${overdue.length} overdue, ${dueToday.length} due today`

  const html = `
    <div style="font-family:sans-serif;color:#18181b;">
      ${listHtml('Overdue', overdue)}
      ${listHtml('Due today', dueToday)}
      <p style="margin-top:20px;"><a href="${APP_URL}/dashboard">Open the dashboard</a></p>
    </div>
  `.trim()

  const text = [
    overdue.length > 0 ? `Overdue (${overdue.length}):\n${overdue.map(rowText).join('\n')}` : '',
    dueToday.length > 0 ? `Due today (${dueToday.length}):\n${dueToday.map(rowText).join('\n')}` : '',
    `${APP_URL}/dashboard`,
  ]
    .filter(Boolean)
    .join('\n\n')

  return { subject, html, text }
}

// Sends one digest email per user, scoped to what that user's role can act
// on (same role-scoping as the dashboard). Skips users with nothing due —
// no point emailing an empty digest every day.
// `service` defaults to the real Resend adapter but can be swapped for a
// stub in tests so digest logic can be verified without a live API key.
export async function sendDailyDigests(service: NotificationService = getNotificationService()) {
  const users = await prisma.user.findMany()
  const results: { user: string; overdue: number; dueToday: number }[] = []

  for (const user of users) {
    const { overdue, dueToday } = await getDueBuckets(user.role)
    if (overdue.length === 0 && dueToday.length === 0) continue

    const { subject, html, text } = buildEmail(overdue, dueToday)
    await service.sendEmail({ to: user.email, subject, html, text })
    results.push({ user: user.email, overdue: overdue.length, dueToday: dueToday.length })
  }

  return results
}
