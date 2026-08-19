import { prisma } from '@/lib/prisma'
import { CHANNEL_LABELS } from '@/lib/labels'

export default async function TemplatesPage() {
  const templates = await prisma.sequenceTemplate.findMany({
    orderBy: { createdAt: 'desc' },
    include: { steps: { orderBy: [{ dayOffset: 'asc' }, { orderIndex: 'asc' }] } },
  })

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">Sequence templates</h1>
      <p className="mb-8 text-sm text-muted">
        Read-only view of the step sequences used to enroll prospects. Editing templates through the app
        isn&apos;t supported yet.
      </p>

      {templates.length === 0 ? (
        <p className="text-sm text-muted">No templates yet.</p>
      ) : (
        <div className="space-y-8">
          {templates.map((template) => (
            <div key={template.id} className="rounded-lg border border-border bg-surface p-4">
              <h2 className="text-lg font-semibold text-foreground">{template.name}</h2>
              {template.description && <p className="text-sm text-muted">{template.description}</p>}
              <table className="mt-4 w-full text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="pb-2 pr-4 font-medium">Day</th>
                    <th className="pb-2 pr-4 font-medium">Channel</th>
                    <th className="pb-2 pr-4 font-medium">Assigned to</th>
                    <th className="pb-2 font-medium">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {template.steps.map((step) => (
                    <tr key={step.id} className="border-t border-border">
                      <td className="py-2 pr-4 text-foreground">{step.dayOffset}</td>
                      <td className="py-2 pr-4">{CHANNEL_LABELS[step.channel]}</td>
                      <td className="py-2 pr-4 text-xs text-muted">{step.assignedRole}</td>
                      <td className="py-2 text-xs text-muted">
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
