import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Inbox, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ label = 'Chargement…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center justify-center gap-3 p-8 text-ink-soft', className)}>
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ivory">
      <Spinner />
    </div>
  )
}

export function Alert({
  tone = 'error',
  children,
  className,
}: {
  tone?: 'error' | 'success' | 'info'
  children: ReactNode
  className?: string
}) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
        tone === 'error' && 'border-red-200 bg-red-50 text-red-800',
        tone === 'success' && 'border-forest/20 bg-sage-100 text-forest',
        tone === 'info' && 'border-champagne/40 bg-ivory-200 text-ink',
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-forest/20 bg-white/50 p-10 text-center">
      <Inbox className="size-8 text-sage" aria-hidden />
      <h3 className="text-xl font-semibold text-forest">{title}</h3>
      {description && <p className="max-w-md text-sm text-ink-soft">{description}</p>}
      {action}
    </div>
  )
}
