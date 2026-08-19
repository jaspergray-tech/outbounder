import { prisma } from '@/lib/prisma'
import { CHANNEL_LABELS } from '@/lib/labels'

export default async function TemplatesPage() {
  const templates = await prisma.sequenceTemplate.findMany({
    orderBy: { createdAt: 'desc' },
    include: { steps: { orderBy: [{ dayOffset: 'asc' }, { orderIndex: 'asc' }] } },
  })

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Sequence templates</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Read-only view of the step sequences used to enroll prospects. Editing templates through the app
        isn&apos;t supported yet.
      </p>

      {templates.length === 0 ? (
        <p className="text-sm text-zinc-400">No templates yet.</p>
      ) : (
        <div className="space-y-8">
          {templates.map((template) => (
            <div key={template.id} className="rounded-lg border border-zinc-200 p-4">
              <h2 className="text-lg font-semibold text-zinc-900">{template.name}</h2>
              {template.description && <p className="text-sm text-zinc-500">{template.description}</p>}
              <table className="mt-4 w-full text-left text-sm">
                <thead className="text-xs text-zinc-500">
                  <tr>
                    <th className="pb-2 pr-4 font-medium">Day</th>
                    <th className="pb-2 pr-4 font-medium">Channel</th>
                    <th className="pb-2 pr-4 font-medium">Assigned to</th>
                    <th className="pb-2 font-medium">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {template.steps.map((step) => (
                    <tr key={step.id} className="border-t border-zinc-100">
                      <td className="py-2 pr-4 text-zinc-600">{step.dayOffset}</td>
                      <td className="py-2 pr-4">{CHANNEL_LABELS[step.channel]}</td>
                      <td className="py-2 pr-4 text-xs text-zinc-500">{step.assignedRole}</td>
                      <td className="py-2 text-xs text-zinc-400">
                        {step.condition ? JSON.stringify(step.condition) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
