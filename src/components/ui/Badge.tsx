import { cn } from '@/lib/utils'

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'success' | 'warning' | 'danger'; children: React.ReactNode }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      tone === 'neutral' && 'bg-ivory-200 text-ink-soft',
      tone === 'success' && 'bg-sage-100 text-forest',
      tone === 'warning' && 'bg-amber-100 text-amber-900',
      tone === 'danger' && 'bg-red-100 text-red-800',
    )}>
      {children}
    </span>
  )
}
