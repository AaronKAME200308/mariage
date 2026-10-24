/** Silhouettes de tenues (dessins originaux) pour le code vestimentaire. */
export function Robe({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 120" fill="currentColor" aria-hidden className={`text-(--sj-blue) ${className}`}>
      <path d="M24 4 L30 15 L36 4 L41 21 C39 34 37 40 39 48 C47 70 53 100 59 116 L1 116 C7 100 13 70 21 48 C23 40 21 34 19 21 Z" />
    </svg>
  )
}

export function Costume({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 120" fill="currentColor" aria-hidden className={`text-(--sj-blue) ${className}`}>
      <path d="M18 6 L30 20 L42 6 L53 16 L57 62 L57 116 L3 116 L3 62 L7 16 Z" />
      <path d="M30 20 L34 30 L30 64 L26 30 Z" fill="var(--sj-cream)" />
    </svg>
  )
}
