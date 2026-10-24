import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { useAsync } from '@/hooks/useAsync'
import { fetchPublicPlatformSettings } from '@/services/platform'

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
}

export function Footer() {
  const settings = useAsync(fetchPublicPlatformSettings, [])
  const links =
    settings.status === 'success'
      ? Object.entries(settings.data.socialLinks).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].startsWith('https://'),
        )
      : []

  return (
    <footer className="border-t border-forest/10 bg-forest-900 px-4 py-12 text-ivory/80 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo tone="light" />
          <p className="mt-3 max-w-xs text-sm">Sites de mariage et gestion des invités, pensés pour les couples et leurs proches.</p>
        </div>
        <nav aria-label="Pied de page" className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Link to="/mentions-legales" className="hover:text-ivory">Mentions légales</Link>
          <Link to="/confidentialite" className="hover:text-ivory">Confidentialité</Link>
          <Link to="/cgu" className="hover:text-ivory">Conditions d’utilisation</Link>
          <Link to="/connexion" className="hover:text-ivory">Connexion</Link>
          {links.map(([key, url]) => (
            <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="hover:text-ivory">
              {SOCIAL_LABELS[key] ?? key}
            </a>
          ))}
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-xs text-ivory/60">© {new Date().getFullYear()} MariamCM. Tous droits réservés.</p>
    </footer>
  )
}
