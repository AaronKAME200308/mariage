import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const buttonStyles = (variant: Variant = 'primary', size: Size = 'md') =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-60',
    size === 'sm' && 'px-4 py-2 text-sm',
    size === 'md' && 'px-6 py-3 text-sm',
    size === 'lg' && 'px-8 py-4 text-base',
    variant === 'primary' && 'bg-forest text-ivory hover:bg-forest-700',
    variant === 'secondary' &&
      'border border-forest/25 bg-white/60 text-forest hover:border-forest/50 hover:bg-white',
    variant === 'ghost' && 'text-forest hover:bg-forest/5',
    variant === 'danger' && 'bg-red-700 text-white hover:bg-red-800',
  )

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonStyles(variant, size), className)}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
})
