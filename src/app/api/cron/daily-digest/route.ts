import { NextRequest, NextResponse } from 'next/server'
import { sendDailyDigests } from '@/lib/notifications/digest'

// Vercel's Cron Jobs feature invokes this on a schedule (see vercel.json) and
// automatically sends `Authorization: Bearer <CRON_SECRET>` — checking it
// here stops anyone else who finds this URL from triggering emails on demand.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await sendDailyDigests()
  return NextResponse.json({ ok: true, sent: results })
}
