'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/generated/prisma/client'

type NavLink = { href: string; label: string }

function buildLinks(role: Role): NavLink[] {
  const links: NavLink[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/sprints', label: 'Sprints' },
  ]
  if (role === 'OWNER') {
    links.push({ href: '/reporting', label: 'Reporting' })
  }
  links.push({ href: '/templates', label: 'Templates' })
  return links
}

export function Nav({
  role,
  name,
  onSignOut,
}: {
  role: Role
  name: string | null | undefined
  onSignOut: () => Promise<void>
}) {
  const pathname = usePathname()
  const links = buildLinks(role)

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/dashboard" className="hidden text-sm font-semibold text-foreground sm:inline">
            Outbound Cadence Tracker
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${
                    active ? 'bg-foreground text-white' : 'text-muted hover:bg-background'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">{name}</span>
          <form action={onSignOut}>
            <button
              type="submit"
              className="rounded border border-border px-3 py-1.5 text-sm text-foreground hover:bg-background"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
