import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { Nav } from './Nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  async function handleSignOut() {
    'use server'
    await signOut({ redirectTo: '/login' })
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <Nav role={session.user.role} name={session.user.name} onSignOut={handleSignOut} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
