export { auth as proxy } from '@/auth'

export const config = {
  // Run on every route except the login page, NextAuth's own routes, and
  // Next.js internals/static assets. Everything else requires a session.
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
}
