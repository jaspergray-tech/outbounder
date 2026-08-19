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
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-semibold text-zinc-900">
            Outbound Cadence Tracker
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${
                    active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{name}</span>
          <form action={onSignOut}>
            <button
              type="submit"
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
