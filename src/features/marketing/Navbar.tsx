import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { buttonStyles } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/#fonctionnalites', label: 'Fonctionnalités' },
  { to: '/#comment-ca-marche', label: 'Comment ça marche' },
  { to: '/#exemples', label: 'Exemples de mariages' },
  { to: '/#contact', label: 'Contact' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-ivory/90 backdrop-blur">
      <nav aria-label="Navigation principale" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />
        <ul className="hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="text-sm text-ink-soft transition-colors hover:text-forest">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/connexion" className={buttonStyles('ghost', 'sm')}>
            Connexion
          </Link>
          <Link to="/#contact" className={buttonStyles('primary', 'sm')}>
            Créer mon site
          </Link>
        </div>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full text-forest hover:bg-forest/5 lg:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </nav>
      <div id="menu-mobile" className={cn('border-t border-forest/10 bg-ivory lg:hidden', !open && 'hidden')}>
        <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link to={l.to} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-ink hover:bg-forest/5">
                {l.label}
              </Link>
            </li>
          ))}
          <li className="mt-2 flex gap-3">
            <Link to="/connexion" onClick={() => setOpen(false)} className={cn(buttonStyles('secondary', 'md'), 'flex-1')}>
              Connexion
            </Link>
            <Link to="/#contact" onClick={() => setOpen(false)} className={cn(buttonStyles('primary', 'md'), 'flex-1')}>
              Créer mon site
            </Link>
          </li>
        </ul>
      </div>
    </header>
  )
}
