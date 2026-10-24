/** Marguerite au trait bleu (dessin original). */
export default function Marguerite({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 180" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden className={`pointer-events-none text-(--sj-blue) ${className}`}>
      {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx="50" cy="27" rx="6" ry="17" transform={`rotate(${i * 30} 50 50)`} />)}
      <circle cx="50" cy="50" r="7" fill="currentColor" />
      <path d="M50 68 C46 100 60 130 48 176" />
      <path d="M49 122 C30 114 24 102 22 91 C38 95 46 107 49 122Z" />
      <path d="M52 100 C68 96 76 86 80 76 C64 76 55 86 52 100Z" />
    </svg>
  )
}
