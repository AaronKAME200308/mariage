import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <Link
      to="/"
      aria-label="MariamCM — accueil"
      className={cn(
        'font-serif text-2xl font-semibold tracking-tight',
        tone === 'dark' ? 'text-forest' : 'text-ivory',
        className,
      )}
    >
      Mariam<span className="text-champagne">CM</span>
    </Link>
  )
}
