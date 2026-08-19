'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  PROSPECT_FIELDS,
  FIELD_LABELS,
  guessColumnMapping,
  mapRowsToProspects,
  parseRawTable,
  type ColumnMapping,
  type ImportRow,
  type ParsedTable,
} from '@/lib/import/parseTable'
import { importProspects } from './actions'

type Sprint = { id: string; name: string; defaultTemplateId: string | null }
type Template = { id: string; name: string }

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function ImportClient({ sprints, templates }: { sprints: Sprint[]; templates: Template[] }) {
  const [rawText, setRawText] = useState('')
  const [parsed, setParsed] = useState<ParsedTable | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [included, setIncluded] = useState<boolean[]>([])

  const [sprintMode, setSprintMode] = useState<'existing' | 'new'>(sprints.length > 0 ? 'existing' : 'new')
  const [sprintId, setSprintId] = useState(sprints[0]?.id ?? '')
  const [newSprintName, setNewSprintName] = useState('')
  const [templateId, setTemplateId] = useState(sprints[0]?.defaultTemplateId ?? templates[0]?.id ?? '')
  const [startDate, setStartDate] = useState(todayIso())

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ created: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const includedCount = useMemo(() => included.filter(Boolean).length, [included])

  function applyParse(text: string) {
    const table = parseRawTable(text)
    if (table.headers.length === 0) {
      setError('Could not find any columns in that text.')
      return
    }
    const guessedMapping = guessColumnMapping(table.headers)
    setParsed(table)
    setMapping(guessedMapping)
    const mappedRows = mapRowsToProspects(table.rows, guessedMapping)
    setRows(mappedRows)
    setIncluded(mappedRows.map((r) => r.name.trim().length > 0))
    setResult(null)
    setError(null)
  }

  async function handleFileUpload(file: File) {
    const text = await file.text()
    setRawText(text)
    applyParse(text)
  }

  function updateMapping(field: (typeof PROSPECT_FIELDS)[number], columnIndex: number | null) {
    if (!parsed || !mapping) return
    const nextMapping = { ...mapping, [field]: columnIndex }
    setMapping(nextMapping)
    const mappedRows = mapRowsToProspects(parsed.rows, nextMapping)
    setRows(mappedRows)
  }

  function updateCell(rowIndex: number, field: (typeof PROSPECT_FIELDS)[number], value: string) {
    setRows((prev) => prev.map((row, i) => (i === rowIndex ? { ...row, [field]: value } : row)))
  }

  function toggleIncluded(rowIndex: number) {
    setIncluded((prev) => prev.map((v, i) => (i === rowIndex ? !v : v)))
  }

  function selectSprint(id: string) {
    setSprintId(id)
    const sprint = sprints.find((s) => s.id === id)
    if (sprint?.defaultTemplateId) {
      setTemplateId(sprint.defaultTemplateId)
    }
  }

  async function handleSubmit() {
    setError(null)
    const finalRows = rows.filter((_, i) => included[i])
    if (finalRows.length === 0) {
      setError('Select at least one row with a name to import.')
      return
    }
    if (sprintMode === 'new' && !newSprintName.trim()) {
      setError('Enter a name for the new sprint.')
      return
    }
    if (!templateId) {
      setError('Choose a sequence template.')
      return
    }

    setSubmitting(true)
    try {
      const { created } = await importProspects({
        rows: finalRows,
        sprintId: sprintMode === 'existing' ? sprintId : undefined,
        newSprintName: sprintMode === 'new' ? newSprintName : undefined,
        templateId,
        startDate,
      })
      setResult({ created })
      setParsed(null)
      setMapping(null)
      setRows([])
      setIncluded([])
      setRawText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {result && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <span>
            Imported {result.created} prospect{result.created === 1 ? '' : 's'} and enrolled them in the
            sequence.
          </span>
          <Link href="/dashboard" className="font-medium underline hover:no-underline">
            Back to dashboard
          </Link>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {!parsed && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Paste a table (from Excel, Google Sheets, etc.)
            </label>
            <textarea
              className="h-40 w-full rounded-lg border border-zinc-300 p-3 font-mono text-xs"
              placeholder={'Name\tTitle\tCompany\tLocation\nLyndsey Horobin\tLearning & Performance Business Partner\tevoke\tGreater Leeds Area'}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => applyParse(rawText)}
              disabled={!rawText.trim()}
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Parse pasted table
            </button>
            <span className="text-sm text-zinc-400">or</span>
            <label className="cursor-pointer rounded border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
              Upload CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleFileUpload(file)
                }}
              />
            </label>
          </div>
        </div>
      )}

      {parsed && mapping && (
        <>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Column mapping</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PROSPECT_FIELDS.map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    {FIELD_LABELS[field]}
                    {field === 'name' && ' *'}
                  </label>
                  <select
                    className="w-full rounded border border-zinc-300 p-1.5 text-sm"
                    value={mapping[field] ?? ''}
                    onChange={(e) =>
                      updateMapping(field, e.target.value === '' ? null : Number(e.target.value))
                    }
                  >
                    <option value="">— none —</option>
                    {parsed.headers.map((header, idx) => (
                      <option key={idx} value={idx}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">
                Review ({includedCount} of {rows.length} selected)
              </h2>
              <button
                type="button"
                onClick={() => {
                  setParsed(null)
                  setMapping(null)
                  setRows([])
                  setIncluded([])
                }}
                className="text-sm text-zinc-500 underline hover:text-zinc-700"
              >
                Start over
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-zinc-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs text-zinc-500">
                  <tr>
                    <th className="p-2"></th>
                    {PROSPECT_FIELDS.map((field) => (
                      <th key={field} className="p-2 font-medium">
                        {FIELD_LABELS[field]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-zinc-100">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={included[rowIndex] ?? false}
                          onChange={() => toggleIncluded(rowIndex)}
                        />
                      </td>
                      {PROSPECT_FIELDS.map((field) => (
                        <td key={field} className="p-1">
                          <input
                            className="w-full min-w-32 rounded border border-transparent p-1 text-sm hover:border-zinc-200 focus:border-zinc-400"
                            value={row[field]}
                            onChange={(e) => updateCell(rowIndex, field, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Enroll into</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Sprint</label>
                <div className="mb-2 flex gap-3 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={sprintMode === 'existing'}
                      onChange={() => setSprintMode('existing')}
                      disabled={sprints.length === 0}
                    />
                    Existing
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={sprintMode === 'new'}
                      onChange={() => setSprintMode('new')}
                    />
                    New
                  </label>
                </div>
                {sprintMode === 'existing' ? (
                  <select
                    className="w-full rounded border border-zinc-300 p-1.5 text-sm"
                    value={sprintId}
                    onChange={(e) => selectSprint(e.target.value)}
                  >
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="w-full rounded border border-zinc-300 p-1.5 text-sm"
                    placeholder="e.g. JG_17_08_Sprint"
                    value={newSprintName}
                    onChange={(e) => setNewSprintName(e.target.value)}
                  />
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Sequence template</label>
                <select
                  className="w-full rounded border border-zinc-300 p-1.5 text-sm"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Start date</label>
                <input
                  type="date"
                  className="w-full rounded border border-zinc-300 p-1.5 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || includedCount === 0}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {submitting ? 'Importing…' : `Import ${includedCount} prospect${includedCount === 1 ? '' : 's'}`}
          </button>
        </>
      )}
    </div>
  )
}
