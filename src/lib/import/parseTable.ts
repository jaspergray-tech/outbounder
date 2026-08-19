import Papa from 'papaparse'

export type ParsedTable = { headers: string[]; rows: string[][] }

// Parses either a CSV file's contents or a table copy-pasted from a
// spreadsheet (tab-separated). Papa Parse auto-detects the delimiter when
// given an empty string.
export function parseRawTable(raw: string): ParsedTable {
  const result = Papa.parse<string[]>(raw.trim(), {
    delimiter: '',
    skipEmptyLines: true,
  })
  const [headers, ...rows] = result.data as string[][]
  return { headers: headers ?? [], rows: rows ?? [] }
}

export const PROSPECT_FIELDS = [
  'name',
  'jobTitle',
  'company',
  'location',
  'email',
  'linkedinUrl',
  'notes',
] as const

export type ProspectField = (typeof PROSPECT_FIELDS)[number]

export const FIELD_LABELS: Record<ProspectField, string> = {
  name: 'Name',
  jobTitle: 'Job title',
  company: 'Company',
  location: 'Location',
  email: 'Email',
  linkedinUrl: 'LinkedIn URL',
  notes: 'Notes',
}

const FIELD_ALIASES: Record<ProspectField, string[]> = {
  name: ['name', 'full name', 'lead', 'prospect', 'prospect name'],
  jobTitle: ['title', 'job title', 'position', 'role'],
  company: ['company', 'account', 'organization', 'organisation', 'employer'],
  location: ['location', 'geography', 'region', 'area'],
  email: ['email', 'e-mail', 'email address'],
  linkedinUrl: ['linkedin', 'linkedin url', 'profile', 'profile url', 'url'],
  notes: ['notes', 'note', 'comment', 'comments'],
}

export type ColumnMapping = Record<ProspectField, number | null>

export function guessColumnMapping(headers: string[]): ColumnMapping {
  const normalized = headers.map((h) => h.trim().toLowerCase())
  const mapping = {} as ColumnMapping
  for (const field of PROSPECT_FIELDS) {
    const idx = normalized.findIndex((h) => FIELD_ALIASES[field].includes(h))
    mapping[field] = idx === -1 ? null : idx
  }
  return mapping
}

export type ImportRow = Record<ProspectField, string>

export function mapRowsToProspects(rows: string[][], mapping: ColumnMapping): ImportRow[] {
  return rows.map((row) => {
    const record = {} as ImportRow
    for (const field of PROSPECT_FIELDS) {
      const idx = mapping[field]
      record[field] = idx !== null && idx !== undefined ? (row[idx]?.trim() ?? '') : ''
    }
    return record
  })
}
