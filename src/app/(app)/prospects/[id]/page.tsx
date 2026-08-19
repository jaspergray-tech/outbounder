import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProspectDetail } from '@/lib/prospects/queries'
import { OUTCOME_LABELS } from '@/lib/labels'
import type { ProspectStatus } from '@/generated/prisma/client'
import { ProspectDetailClient } from './ProspectDetailClient'

const STATUS_STYLES: Record<ProspectStatus, string> = {
  ACTIVE: 'bg-zinc-100 text-zinc-600',
  PAUSED: 'bg-zinc-100 text-zinc-600',
  COMPLETED: 'bg-green-100 text-green-700',
  OPTED_OUT: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<ProspectStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Meeting booked',
  OPTED_OUT: 'Opted out',
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function ProspectDetailPage({ params }: PageProps<'/prospects/[id]'>) {
  const { id } = await params
  const prospect = await getProspectDetail(id)
  if (!prospect) notFound()

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link href={`/sprints/${prospect.sprint.id}`} className="text-sm text-zinc-500 hover:underline">
        ← {prospect.sprint.name}
      </Link>

      <div className="mt-2 mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">{prospect.name}</h1>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[prospect.status]}`}>
          {STATUS_LABELS[prospect.status]}
        </span>
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        {[prospect.jobTitle, prospect.company, prospect.location].filter(Boolean).join(' · ')}
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        {prospect.email && (
          <div>
            <p className="text-xs text-zinc-400">Email</p>
            <p className="text-zinc-700">{prospect.email}</p>
          </div>
        )}
        {prospect.linkedinUrl && (
          <div>
            <p className="text-xs text-zinc-400">LinkedIn</p>
            <a href={prospect.linkedinUrl} target="_blank" rel="noreferrer" className="text-zinc-700 underline">
              Profile
            </a>
          </div>
        )}
        {prospect.instance && (
          <div>
            <p className="text-xs text-zinc-400">Sequence</p>
            <p className="text-zinc-700">{prospect.instance.templateName}</p>
          </div>
        )}
      </div>

      {prospect.notes && (
        <div className="mb-8 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          {prospect.notes}
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Step history</h2>
      <ProspectDetailClient
        prospectId={prospect.id}
        instanceId={prospect.instance?.id ?? null}
        instanceStatus={prospect.instance?.status ?? null}
        steps={prospect.steps}
        canLogOutcome={prospect.status === 'ACTIVE'}
      />

      {prospect.outcomes.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Outcomes logged</h2>
          <ul className="space-y-1 text-sm text-zinc-600">
            {prospect.outcomes.map((o) => (
              <li key={o.id}>
                {OUTCOME_LABELS[o.type]} — {formatDate(o.date)}
                {o.notes ? ` · ${o.notes}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
