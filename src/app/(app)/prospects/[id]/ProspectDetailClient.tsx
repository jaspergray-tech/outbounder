'use client'

import { useTransition } from 'react'
import type { ActivityStatus, InstanceStatus, OutcomeType } from '@/generated/prisma/client'
import { CHANNEL_LABELS, OUTCOME_LABELS } from '@/lib/labels'
import type { ProspectStepRow } from '@/lib/prospects/queries'
import {
  markDoneAction,
  skipAction,
  snoozeAction,
  logStepOutcomeAction,
  logProspectOutcomeAction,
  rewindStepAction,
} from './actions'

function formatDate(d: Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_STYLES: Record<ActivityStatus, string> = {
  PENDING: 'bg-zinc-100 text-zinc-600',
  DUE: 'bg-zinc-100 text-zinc-600',
  OVERDUE: 'bg-red-100 text-red-700',
  DONE: 'bg-green-100 text-green-700',
  SKIPPED: 'bg-zinc-100 text-zinc-400',
}

function StepRow({
  step,
  isActive,
  instanceId,
  instanceStatus,
  prospectId,
}: {
  step: ProspectStepRow
  isActive: boolean
  instanceId: string
  instanceStatus: InstanceStatus
  prospectId: string
}) {
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action()
    })
  }

  const canRewind = instanceStatus === 'ACTIVE' && (step.status === 'DONE' || step.status === 'SKIPPED')

  return (
    <tr className={`border-t border-zinc-100 ${pending ? 'opacity-50' : ''}`}>
      <td className="py-2 pr-4 text-zinc-500">Day {step.dayOffset}</td>
      <td className="py-2 pr-4">{CHANNEL_LABELS[step.channel]}</td>
      <td className="py-2 pr-4 text-xs text-zinc-500">{step.assignedRole}</td>
      <td className="py-2 pr-4">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[step.status]}`}>
          {step.status}
        </span>
      </td>
      <td className="py-2 pr-4 text-xs text-zinc-500">{formatDate(step.plannedDate)}</td>
      <td className="py-2 pr-4 text-xs text-zinc-500">
        {step.actualDate ? `${formatDate(step.actualDate)}${step.completedByName ? ` · ${step.completedByName}` : ''}` : '—'}
      </td>
      <td className="py-2 text-right">
        {isActive && instanceStatus === 'ACTIVE' && (
          <div className="flex justify-end gap-2">
            <select
              className="rounded border border-zinc-300 p-1 text-xs text-zinc-600"
              disabled={pending}
              defaultValue=""
              onChange={(e) => {
                const type = e.target.value as OutcomeType
                if (type) run(() => logStepOutcomeAction(step.activityLogId, prospectId, type))
              }}
            >
              <option value="">Log outcome…</option>
              {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              disabled={pending}
              onClick={() => run(() => snoozeAction(step.activityLogId, prospectId, 1))}
              className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              Snooze
            </button>
            <button
              disabled={pending}
              onClick={() => run(() => skipAction(step.activityLogId, prospectId))}
              className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              Skip
            </button>
            <button
              disabled={pending}
              onClick={() => run(() => markDoneAction(step.activityLogId, prospectId))}
              className="rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white"
            >
              Done
            </button>
          </div>
        )}
        {canRewind && (
          <button
            disabled={pending}
            onClick={() => {
              if (
                confirm(
                  `Move this prospect back to Day ${step.dayOffset} (${CHANNEL_LABELS[step.channel]})? This resets that step and everything after it, and recalculates due dates from here forward.`
                )
              ) {
                run(() => rewindStepAction(instanceId, step.stepId, prospectId))
              }
            }}
            className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
          >
            Rewind to here
          </button>
        )}
      </td>
    </tr>
  )
}

export function ProspectDetailClient({
  prospectId,
  instanceId,
  instanceStatus,
  steps,
  canLogOutcome,
}: {
  prospectId: string
  instanceId: string | null
  instanceStatus: InstanceStatus | null
  steps: ProspectStepRow[]
  canLogOutcome: boolean
}) {
  const [pending, startTransition] = useTransition()
  const activeStep = steps.find((s) => s.status === 'PENDING' || s.status === 'DUE' || s.status === 'OVERDUE')

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action()
    })
  }

  return (
    <div>
      {canLogOutcome && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-700">Log outcome for this prospect:</span>
          <select
            className="rounded border border-zinc-300 p-1.5 text-sm text-zinc-600"
            disabled={pending}
            defaultValue=""
            onChange={(e) => {
              const type = e.target.value as OutcomeType
              if (type) run(() => logProspectOutcomeAction(prospectId, type))
            }}
          >
            <option value="">Choose…</option>
            {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {steps.length === 0 ? (
        <p className="text-sm text-zinc-400">Not enrolled in a sequence.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-zinc-500">
            <tr>
              <th className="pb-2 pr-4 font-medium">Day</th>
              <th className="pb-2 pr-4 font-medium">Channel</th>
              <th className="pb-2 pr-4 font-medium">Assigned</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Planned</th>
              <th className="pb-2 pr-4 font-medium">Actual</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step) => (
              <StepRow
                key={step.activityLogId}
                step={step}
                isActive={step.activityLogId === activeStep?.activityLogId}
                instanceId={instanceId ?? ''}
                instanceStatus={instanceStatus ?? 'COMPLETED'}
                prospectId={prospectId}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
