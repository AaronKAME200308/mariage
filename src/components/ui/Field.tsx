import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface FieldShellProps {
  label: string
  error?: string
  hint?: string
  id: string
  children: React.ReactNode
}

function FieldShell({ label, error, hint, id, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-soft">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

const controlStyles =
  'w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 ' +
  'transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 ' +
  'disabled:bg-ivory-200'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField(
  { label, error, hint, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell label={label} error={error} hint={hint} id={fieldId}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(controlStyles, error ? 'border-red-600' : 'border-forest/20', className)}
        {...props}
      />
    </FieldShell>
  )
})

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextAreaField(
  { label, error, hint, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell label={label} error={error} hint={hint} id={fieldId}>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(controlStyles, 'min-h-32 resize-y', error ? 'border-red-600' : 'border-forest/20', className)}
        {...props}
      />
    </FieldShell>
  )
})

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
}

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField(
  { label, error, hint, className, id, children, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell label={label} error={error} hint={hint} id={fieldId}>
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error) || undefined}
        className={cn(controlStyles, error ? 'border-red-600' : 'border-forest/20', className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  )
})

export function ToggleField({
  label, hint, checked, onChange,
}: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-5 shrink-0 rounded border-forest/30 accent-forest"
      />
      <label htmlFor={id} className="text-sm">
        <span className="font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
      </label>
    </div>
  )
}
