import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Alert } from '@/components/ui/Feedback'

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-linear-to-b from-ivory to-sage-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-forest/10 bg-white p-8 shadow-soft">
          <h1 className="text-3xl font-semibold text-forest">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>}
          {!isSupabaseConfigured && (
            <Alert tone="info" className="mt-5">
              Supabase n’est pas encore configuré : renseignez le fichier <code>.env</code> pour activer la connexion.
            </Alert>
          )}
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link to="/" className="underline-offset-4 hover:underline">
            ← Retour au site MariamCM
          </Link>
        </p>
      </div>
    </main>
  )
}
