import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProspectDetail } from '@/lib/prospects/queries'
import { OUTCOME_LABELS, PROSPECT_STATUS_LABELS, PROSPECT_STATUS_TONE } from '@/lib/labels'
import { Badge } from '@/components/Badge'
import { ProspectDetailClient } from './ProspectDetailClient'

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function ProspectDetailPage({ params }: PageProps<'/prospects/[id]'>) {
  const { id } = await params
  const prospect = await getProspectDetail(id)
  if (!prospect) notFound()

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href={`/sprints/${prospect.sprint.id}`} className="text-sm text-muted hover:underline">
        ← {prospect.sprint.name}
      </Link>

      <div className="mt-2 mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">{prospect.name}</h1>
        <Badge tone={PROSPECT_STATUS_TONE[prospect.status]}>{PROSPECT_STATUS_LABELS[prospect.status]}</Badge>
      </div>
      <p className="mb-6 text-sm text-muted">
        {[prospect.jobTitle, prospect.company, prospect.location].filter(Boolean).join(' · ')}
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        {prospect.email && (
          <div>
            <p className="text-xs text-muted">Email</p>
            <p className="text-foreground">{prospect.email}</p>
          </div>
        )}
        {prospect.linkedinUrl && (
          <div>
            <p className="text-xs text-muted">LinkedIn</p>
            <a href={prospect.linkedinUrl} target="_blank" rel="noreferrer" className="text-foreground underline">
              Profile
            </a>
          </div>
        )}
        {prospect.instance && (
          <div>
            <p className="text-xs text-muted">Sequence</p>
            <p className="text-foreground">{prospect.instance.templateName}</p>
          </div>
        )}
      </div>

      {prospect.notes && (
        <div className="mb-8 rounded-lg border border-border bg-background p-3 text-sm text-foreground">
          {prospect.notes}
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-foreground">Step history</h2>
      <ProspectDetailClient
        prospectId={prospect.id}
        instanceId={prospect.instance?.id ?? null}
        instanceStatus={prospect.instance?.status ?? null}
        steps={prospect.steps}
        canLogOutcome={prospect.status === 'ACTIVE'}
      />

      {prospect.outcomes.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Outcomes logged</h2>
          <ul className="space-y-1 text-sm text-foreground">
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
