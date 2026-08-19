'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import type { ProspectStatus, Channel } from '@/generated/prisma/client'
import { CHANNEL_LABELS, PROSPECT_STATUS_LABELS, PROSPECT_STATUS_TONE } from '@/lib/labels'
import { Badge } from '@/components/Badge'
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

function ProspectRow({ prospect }: { prospect: ProspectRow }) {
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action()
    })
  }

  const canAct = prospect.status === 'ACTIVE' || prospect.status === 'PAUSED'

  return (
    <tr className={`border-t border-border ${pending ? 'opacity-50' : ''}`}>
      <td className="py-3 pr-4">
        <Link href={`/prospects/${prospect.id}`} className="font-medium text-foreground hover:underline">
          {prospect.name}
        </Link>
        <p className="text-xs text-muted">{[prospect.jobTitle, prospect.company].filter(Boolean).join(' · ')}</p>
      </td>
      <td className="py-3 pr-4">
        <Badge tone={PROSPECT_STATUS_TONE[prospect.status]}>{PROSPECT_STATUS_LABELS[prospect.status]}</Badge>
      </td>
      <td className="py-3 pr-4 text-xs text-muted">
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
              className="rounded bg-positive px-2 py-1 text-xs font-medium text-white hover:opacity-90"
            >
              Meeting booked
            </button>
            <button
              disabled={pending}
              onClick={() => run(() => logProspectOutcomeAction(prospect.id, 'OPTED_OUT'))}
              className="rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-background"
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
        <p className="text-sm text-muted">No prospects in this sprint.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted">
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
        <div className="mt-10 border-t border-border pt-6">
          <button
            disabled={deleting}
            onClick={handleDelete}
            className="rounded border border-negative px-3 py-1.5 text-sm font-medium text-negative hover:bg-negative-bg disabled:opacity-40"
          >
            {deleting ? 'Deleting…' : 'Delete sprint'}
          </button>
        </div>
      )}
    </div>
  )
}
