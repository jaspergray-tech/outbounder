import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ImportClient } from './ImportClient'

export default async function ImportProspectsPage() {
  const session = await auth()
  if (session?.user?.role !== 'OWNER') {
    redirect('/dashboard')
  }

  const [sprints, templates] = await Promise.all([
    prisma.sprint.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, defaultTemplateId: true },
    }),
    prisma.sequenceTemplate.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Import prospects</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Paste a table copied from a spreadsheet, or upload a CSV file. Clean the list up before
        pasting — headers like &quot;Name&quot;, &quot;Title&quot;, &quot;Company&quot; and
        &quot;Location&quot; are detected automatically.
      </p>
      <ImportClient sprints={sprints} templates={templates} />
    </div>
  )
}
