import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { getSprintDetail } from '@/lib/sprints/queries'
import { SprintDetailClient } from './SprintDetailClient'

export default async function SprintDetailPage({ params }: PageProps<'/sprints/[id]'>) {
  const { id } = await params
  const session = await auth()
  const sprint = await getSprintDetail(id)
  if (!sprint) notFound()

  const meetingsBooked = sprint.prospects.filter((p) => p.status === 'COMPLETED').length
  const optedOut = sprint.prospects.filter((p) => p.status === 'OPTED_OUT').length
  const active = sprint.prospects.filter((p) => p.status === 'ACTIVE' || p.status === 'PAUSED').length

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">{sprint.name}</h1>
      </div>
      {sprint.description && <p className="mb-4 text-sm text-zinc-500">{sprint.description}</p>}

      <p className="mb-8 text-sm font-medium text-zinc-700">
        {sprint.prospects.length} compan{sprint.prospects.length === 1 ? 'y' : 'ies'} — {meetingsBooked} meeting
        {meetingsBooked === 1 ? '' : 's'} booked, {optedOut} opted out, {active} active
      </p>

      <SprintDetailClient
        sprintId={sprint.id}
        prospects={sprint.prospects}
        canDelete={session?.user?.role === 'OWNER'}
      />
    </div>
  )
}
