import type { ReactNode } from 'react'

export function SiteSection({ id, title, intro, tinted, children }: { id: string; title: string; intro?: string; tinted?: boolean; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titre`} className={`scroll-mt-4 px-6 py-20 ${tinted ? 'bg-(--w-secondary)/20' : ''}`}>
      <div className="mx-auto max-w-4xl">
        <h2 id={`${id}-titre`} className="text-center text-5xl font-semibold text-(--w-primary)">{title}</h2>
        <div className="mx-auto mt-4 h-px w-16 bg-(--w-accent)" aria-hidden />
        {intro && <p className="mx-auto mt-6 max-w-2xl text-center whitespace-pre-line text-(--w-text)/80">{intro}</p>}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  )
}
