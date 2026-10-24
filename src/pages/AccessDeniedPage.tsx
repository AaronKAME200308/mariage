import { useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button, buttonStyles } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthProvider'
import { ROLE_HOME } from '@/lib/roles'

const REASONS: Record<string, { title: string; text: string }> = {
  desactive: { title: 'Compte désactivé', text: 'Ce compte a été désactivé. Contactez l’équipe MariamCM pour plus d’informations.' },
  profil: { title: 'Profil indisponible', text: 'Nous n’avons pas pu charger votre profil. Réessayez ou contactez un administrateur.' },
  role: { title: 'Accès refusé', text: 'Votre compte n’a pas les droits nécessaires pour consulter cette page.' },
}

export default function AccessDeniedPage() {
  const [params] = useSearchParams()
  const location = useLocation() as { state?: { home?: string } }
  const { profile, signOut } = useAuth()
  const reason = REASONS[params.get('raison') ?? 'role'] ?? REASONS.role
  const home = location.state?.home ?? (profile ? ROLE_HOME[profile.role] : '/')

  useEffect(() => {
    document.title = 'Accès refusé — MariamCM'
  }, [])

  return (
    <main className="grid min-h-dvh place-items-center bg-ivory px-4">
      <div className="max-w-md text-center">
        <ShieldAlert className="mx-auto size-12 text-champagne-700" aria-hidden />
        <h1 className="mt-4 text-4xl font-semibold text-forest">{reason.title}</h1>
        <p className="mt-3 text-ink-soft">{reason.text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={home} className={buttonStyles('primary')}>
            Retour à mon espace
          </Link>
          {profile && (
            <Button variant="secondary" onClick={() => void signOut()}>
              Se déconnecter
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
