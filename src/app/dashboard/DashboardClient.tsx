'use client'

import { useState, useTransition } from 'react'
import type { Channel, OutcomeType } from '@/generated/prisma/client'
import { CHANNEL_LABELS, OUTCOME_LABELS } from '@/lib/labels'
import { markDoneAction, skipAction, snoozeAction, logOutcomeAction } from './actions'

export type ActivityRow = {
  id: string
  plannedDate: Date
  dayOffset: number
  channel: Channel
  prospect: { id: string; name: string; company: string | null; jobTitle: string | null }
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Row({ row }: { row: ActivityRow }) {
  const [pending, startTransition] = useTransition()
  const [hidden, setHidden] = useState(false)

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action()
      setHidden(true)
    })
  }

  if (hidden) return null

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 py-3 ${pending ? 'opacity-50' : ''}`}
    >
      <div>
        <p className="text-sm font-medium text-zinc-900">{row.prospect.name}</p>
        <p className="text-xs text-zinc-500">
          {[row.prospect.jobTitle, row.prospect.company].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">
          Day {row.dayOffset} · {CHANNEL_LABELS[row.channel]} · {formatDate(row.plannedDate)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select
          className="rounded border border-zinc-300 p-1 text-xs text-zinc-600"
          disabled={pending}
          defaultValue=""
          onChange={(e) => {
            const type = e.target.value as OutcomeType
            if (type) run(() => logOutcomeAction(row.id, type))
          }}
        >
          <option value="">Log outcome…</option>
          {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          disabled={pending}
          onClick={() => run(() => snoozeAction(row.id, 1))}
          className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
        >
          Snooze
        </button>
        <button
          disabled={pending}
          onClick={() => run(() => skipAction(row.id))}
          className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
        >
          Skip
        </button>
        <button
          disabled={pending}
          onClick={() => run(() => markDoneAction(row.id))}
          className="rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white"
        >
          Done
        </button>
      </div>
    </div>
  )
}

function Section({ title, rows }: { title: string; rows: ActivityRow[] }) {
  if (rows.length === 0) return null
  return (
    <div className="mb-8">
      <h2 className="mb-1 text-sm font-semibold text-zinc-900">
        {title} ({rows.length})
      </h2>
      {rows.map((row) => (
        <Row key={row.id} row={row} />
      ))}
    </div>
  )
}

export function DashboardClient({
  overdue,
  dueToday,
  upcoming,
}: {
  overdue: ActivityRow[]
  dueToday: ActivityRow[]
  upcoming: ActivityRow[]
}) {
  if (overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0) {
    return <p className="text-sm text-zinc-400">Nothing due right now.</p>
  }
  return (
    <div>
      <Section title="Overdue" rows={overdue} />
      <Section title="Due today" rows={dueToday} />
      <Section title="Upcoming (next 7 days)" rows={upcoming} />
    </div>
  )
}
