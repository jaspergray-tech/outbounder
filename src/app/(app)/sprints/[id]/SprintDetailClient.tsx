'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import type { ProspectStatus, Channel } from '@/generated/prisma/client'
import { CHANNEL_LABELS } from '@/lib/labels'
import { logProspectOutcomeAction, deleteSprintAction } from '@/lib/sprints/actions'

type ProspectRow = {
  id: string
  name: string
  company: string | null
  jobTitle: string | null
  status: ProspectStatus
  activeStep: { dayOffset: number; channel: Channel; plannedDate: Date } | null
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function StatusPill({ status }: { status: ProspectStatus }) {
  const styles: Record<ProspectStatus, string> = {
    ACTIVE: 'bg-zinc-100 text-zinc-600',
    PAUSED: 'bg-zinc-100 text-zinc-600',
    COMPLETED: 'bg-green-100 text-green-700',
    OPTED_OUT: 'bg-red-100 text-red-700',
  }
  const labels: Record<ProspectStatus, string> = {
    ACTIVE: 'Active',
    PAUSED: 'Paused',
    COMPLETED: 'Meeting booked',
    OPTED_OUT: 'Opted out',
  }
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>{labels[status]}</span>
}

function ProspectRow({ prospect }: { prospect: ProspectRow }) {
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action()
    })
  }

  const canAct = prospect.status === 'ACTIVE' || prospect.status === 'PAUSED'

  return (
    <tr className={`border-t border-zinc-100 ${pending ? 'opacity-50' : ''}`}>
      <td className="py-3 pr-4">
        <Link href={`/prospects/${prospect.id}`} className="font-medium text-zinc-900 hover:underline">
          {prospect.name}
        </Link>
        <p className="text-xs text-zinc-500">{[prospect.jobTitle, prospect.company].filter(Boolean).join(' · ')}</p>
      </td>
      <td className="py-3 pr-4">
        <StatusPill status={prospect.status} />
      </td>
      <td className="py-3 pr-4 text-xs text-zinc-500">
        {prospect.activeStep
          ? `Day ${prospect.activeStep.dayOffset} · ${CHANNEL_LABELS[prospect.activeStep.channel]} · ${formatDate(prospect.activeStep.plannedDate)}`
          : '—'}
      </td>
      <td className="py-3 text-right">
        {canAct && (
          <div className="flex justify-end gap-2">
            <button
              disabled={pending}
              onClick={() => run(() => logProspectOutcomeAction(prospect.id, 'MEETING_BOOKED'))}
              className="rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white"
            >
              Meeting booked
            </button>
            <button
              disabled={pending}
              onClick={() => run(() => logProspectOutcomeAction(prospect.id, 'OPTED_OUT'))}
              className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              Opted out
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

export function SprintDetailClient({
  sprintId,
  prospects,
  canDelete,
}: {
  sprintId: string
  prospects: ProspectRow[]
  canDelete: boolean
}) {
  const [deleting, startDelete] = useTransition()

  function handleDelete() {
    if (!confirm('Delete this sprint permanently, including every prospect and their full activity history? This cannot be undone.')) {
      return
    }
    startDelete(async () => {
      await deleteSprintAction(sprintId)
    })
  }

  return (
    <div>
      {prospects.length === 0 ? (
        <p className="text-sm text-zinc-400">No prospects in this sprint.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-zinc-500">
            <tr>
              <th className="pb-2 pr-4 font-medium">Prospect</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Active step</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((p) => (
              <ProspectRow key={p.id} prospect={p} />
            ))}
          </tbody>
        </table>
      )}

      {canDelete && (
        <div className="mt-10 border-t border-zinc-200 pt-6">
          <button
            disabled={deleting}
            onClick={handleDelete}
            className="rounded border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
          >
            {deleting ? 'Deleting…' : 'Delete sprint'}
          </button>
        </div>
      )}
    </div>
  )
}
