export { auth as proxy } from '@/auth'

export const config = {
  // Run on every route except the login page, NextAuth's own routes,
  // Next.js internals/static assets, and the cron endpoint (which Vercel
  // invokes with no session — it authenticates itself via CRON_SECRET
  // instead). Everything else requires a session.
  matcher: ['/((?!login|api/auth|api/cron|_next/static|_next/image|favicon.ico).*)'],
}
