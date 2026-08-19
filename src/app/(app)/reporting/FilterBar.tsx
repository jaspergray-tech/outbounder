'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export function FilterBar({
  sprints,
  templates,
  current,
}: {
  sprints: { id: string; name: string }[]
  templates: { id: string; name: string }[]
  current: { sprintId?: string; templateId?: string; personRole?: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        className="rounded border border-zinc-300 p-1.5 text-sm text-zinc-700"
        value={current.sprintId ?? ''}
        onChange={(e) => update('sprintId', e.target.value)}
      >
        <option value="">All sprints</option>
        {sprints.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <select
        className="rounded border border-zinc-300 p-1.5 text-sm text-zinc-700"
        value={current.templateId ?? ''}
        onChange={(e) => update('templateId', e.target.value)}
      >
        <option value="">All templates</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <select
        className="rounded border border-zinc-300 p-1.5 text-sm text-zinc-700"
        value={current.personRole ?? ''}
        onChange={(e) => update('personRole', e.target.value)}
      >
        <option value="">Owner + Manager</option>
        <option value="OWNER">Owner only</option>
        <option value="MANAGER">Manager only</option>
      </select>
    </div>
  )
}
