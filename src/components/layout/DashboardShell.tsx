import type { ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthProvider'
import { ROLE_LABEL } from '@/lib/roles'

export function DashboardShell({ title, children }: { title: string; children: ReactNode }) {
  const { profile, session, signOut } = useAuth()
  return (
    <div className="min-h-dvh bg-ivory">
      <header className="border-b border-forest/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-right sm:block">
              <span className="block font-medium text-ink">{profile?.full_name || session?.user.email}</span>
              <span className="block text-xs text-ink-soft">{profile ? ROLE_LABEL[profile.role] : ''}</span>
            </span>
            <Button variant="secondary" size="sm" onClick={() => void signOut()}>
              <LogOut className="size-4" aria-hidden />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-semibold text-forest">{title}</h1>
        <div className="mt-8 space-y-8">{children}</div>
      </main>
    </div>
  )
}
