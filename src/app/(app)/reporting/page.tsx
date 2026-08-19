import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getReportSummary } from '@/lib/reporting/metrics'
import { CHANNEL_LABELS } from '@/lib/labels'
import type { AssignedRole } from '@/generated/prisma/client'
import { FilterBar } from './FilterBar'

function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}

export default async function ReportingPage({
  searchParams,
}: {
  searchParams: Promise<{ sprintId?: string; templateId?: string; personRole?: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== 'OWNER') redirect('/dashboard')

  const params = await searchParams
  const personRole: AssignedRole | undefined =
    params.personRole === 'OWNER' || params.personRole === 'MANAGER' ? params.personRole : undefined

  const [sprints, templates, { summary, channelBreakdown }] = await Promise.all([
    prisma.sprint.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.sequenceTemplate.findMany({ orderBy: { createdAt: 'desc' } }),
    getReportSummary({
      sprintId: params.sprintId || undefined,
      templateId: params.templateId || undefined,
      personRole,
    }),
  ])

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Reporting</h1>

      <FilterBar
        sprints={sprints.map((s) => ({ id: s.id, name: s.name }))}
        templates={templates.map((t) => ({ id: t.id, name: t.name }))}
        current={{ sprintId: params.sprintId, templateId: params.templateId, personRole: params.personRole }}
      />

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard label="Prospects in scope" value={summary.prospectsInScope} />
        <StatCard label="Prospects contacted" value={summary.prospectsContacted} />
        <StatCard label="Steps completed" value={summary.stepsCompleted} />
        <StatCard label="Reply rate" value={formatPercent(summary.replyRate)} />
        <StatCard label="Connection acceptance rate" value={formatPercent(summary.connectionAcceptanceRate)} />
        <StatCard label="Meeting booked rate" value={formatPercent(summary.meetingBookedRate)} />
        <StatCard label="Opportunity created rate" value={formatPercent(summary.opportunityCreatedRate)} />
        <StatCard label="Opt-out rate" value={formatPercent(summary.optOutRate)} />
      </div>

      <h2 className="mt-10 mb-2 text-sm font-semibold text-zinc-900">By channel</h2>
      {channelBreakdown.length === 0 ? (
        <p className="text-sm text-zinc-400">No activity in scope yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="py-2 font-medium">Channel</th>
              <th className="py-2 font-medium">Done</th>
              <th className="py-2 font-medium">Open</th>
              <th className="py-2 font-medium">Skipped</th>
              <th className="py-2 font-medium">Acceptance rate</th>
            </tr>
          </thead>
          <tbody>
            {channelBreakdown.map((row) => (
              <tr key={row.channel} className="border-b border-zinc-100">
                <td className="py-2">{CHANNEL_LABELS[row.channel]}</td>
                <td className="py-2">{row.done}</td>
                <td className="py-2">{row.open}</td>
                <td className="py-2">{row.skipped}</td>
                <td className="py-2">{formatPercent(row.acceptanceRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
