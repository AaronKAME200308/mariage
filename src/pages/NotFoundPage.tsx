import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { buttonStyles } from '@/components/ui/Button'

export default function NotFoundPage({ title = 'Page introuvable', text = 'Cette adresse ne correspond à aucune page.' }: { title?: string; text?: string }) {
  useEffect(() => {
    document.title = `${title} — MariamCM`
  }, [title])
  return (
    <main className="grid min-h-dvh place-items-center bg-ivory px-4">
      <div className="max-w-md text-center">
        <p className="font-serif text-7xl text-champagne">404</p>
        <h1 className="mt-2 text-4xl font-semibold text-forest">{title}</h1>
        <p className="mt-3 text-ink-soft">{text}</p>
        <Link to="/" className={`${buttonStyles('primary')} mt-8`}>
          Retour à l’accueil
        </Link>
      </div>
    </main>
  )
}
