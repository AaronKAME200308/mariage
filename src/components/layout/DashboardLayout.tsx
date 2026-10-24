import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LogOut, type LucideIcon } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthProvider'
import { ROLE_LABEL } from '@/lib/roles'
import { cn } from '@/lib/utils'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export function DashboardLayout({ nav, header }: { nav: NavItem[]; header?: ReactNode }) {
  const { profile, session, signOut } = useAuth()
  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
      isActive ? 'bg-forest text-ivory' : 'text-ink-soft hover:bg-forest/5 hover:text-forest',
    )

  return (
    <div className="min-h-dvh bg-ivory lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-forest/10 bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:flex-col lg:items-start lg:gap-0 lg:px-5 lg:py-6">
          <Logo />
          <p className="hidden text-xs text-ink-soft lg:mt-1 lg:block">{profile ? ROLE_LABEL[profile.role] : ''}</p>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => void signOut()}>
            <LogOut className="size-4" aria-hidden />
            <span className="sr-only">Déconnexion</span>
          </Button>
        </div>
        <nav aria-label="Navigation du tableau de bord" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:pb-0">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={link}>
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-forest/10 p-4 lg:block">
          <p className="truncate text-sm font-medium text-ink">{profile?.full_name || session?.user.email}</p>
          <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => void signOut()}>
            <LogOut className="size-4" aria-hidden />
            Déconnexion
          </Button>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:py-10">
        {header}
        <Outlet />
      </main>
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-4xl font-semibold text-forest">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}
