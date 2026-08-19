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
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 ${pending ? 'opacity-50' : ''}`}
    >
      <div>
        <p className="text-sm font-medium text-foreground">{row.prospect.name}</p>
        <p className="text-xs text-muted">
          {[row.prospect.jobTitle, row.prospect.company].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Day {row.dayOffset} · {CHANNEL_LABELS[row.channel]} · {formatDate(row.plannedDate)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded border border-border p-1 text-xs text-foreground"
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
          className="rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-background"
        >
          Snooze
        </button>
        <button
          disabled={pending}
          onClick={() => run(() => skipAction(row.id))}
          className="rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-background"
        >
          Skip
        </button>
        <button
          disabled={pending}
          onClick={() => run(() => markDoneAction(row.id))}
          className="rounded bg-positive px-2 py-1 text-xs font-medium text-white hover:opacity-90"
        >
          Done
        </button>
      </div>
    </div>
  )
}

function Section({ title, rows, tone }: { title: string; rows: ActivityRow[]; tone?: 'negative' }) {
  if (rows.length === 0) return null
  return (
    <div className="mb-8">
      <h2 className={`mb-2 text-sm font-semibold ${tone === 'negative' ? 'text-negative' : 'text-foreground'}`}>
        {title} ({rows.length})
      </h2>
      <div className="space-y-2">
        {rows.map((row) => (
          <Row key={row.id} row={row} />
        ))}
      </div>
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
    return <p className="text-sm text-muted">Nothing due right now.</p>
  }
  return (
    <div>
      <Section title="Overdue" rows={overdue} tone="negative" />
      <Section title="Due today" rows={dueToday} />
      <Section title="Upcoming (next 7 days)" rows={upcoming} />
    </div>
  )
}
