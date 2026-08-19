import type { Tone } from '@/lib/labels'

const TONE_STYLES: Record<Tone, string> = {
  neutral: 'bg-background text-foreground/70 border border-border',
  positive: 'bg-positive-bg text-positive',
  negative: 'bg-negative-bg text-negative',
}

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONE_STYLES[tone]}`}>
      {children}
    </span>
  )
}
