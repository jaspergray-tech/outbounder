import Link from 'next/link'
import { getSprintSummaries } from '@/lib/sprints/queries'

export default async function SprintsPage() {
  const sprints = await getSprintSummaries()

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Sprints</h1>

      {sprints.length === 0 ? (
        <p className="text-sm text-zinc-400">No sprints yet — import a prospect list to create one.</p>
      ) : (
        <div className="space-y-3">
          {sprints.map((sprint) => (
            <Link
              key={sprint.id}
              href={`/sprints/${sprint.id}`}
              className="block rounded-lg border border-zinc-200 p-4 hover:border-zinc-300 hover:bg-zinc-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900">{sprint.name}</p>
                  {sprint.description && <p className="text-sm text-zinc-500">{sprint.description}</p>}
                </div>
                {sprint.status === 'ARCHIVED' && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">Archived</span>
                )}
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                {sprint.totalProspects} compan{sprint.totalProspects === 1 ? 'y' : 'ies'} — {sprint.meetingsBooked}{' '}
                meeting{sprint.meetingsBooked === 1 ? '' : 's'} booked, {sprint.optedOut} opted out,{' '}
                {sprint.activeProspects} active
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
