import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageSpinner } from '@/components/ui/Feedback'
import { ROLE_HOME } from '@/lib/roles'
import type { AppRole } from '@/types/domain'
import { useAuth } from './AuthProvider'

/**
 * Garde de navigation : améliore l'expérience, mais la sécurité réelle reste
 * assurée par la RLS et les RPC. Masquer une page n'est jamais une protection.
 */
export function ProtectedRoute({ roles }: { roles: AppRole[] }) {
  const { status, profile } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'disabled') return <Navigate to="/acces-refuse?raison=desactive" replace />
  if (status === 'error') return <Navigate to="/acces-refuse?raison=profil" replace />
  if (status === 'signed_out' || !profile) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  }
  if (!roles.includes(profile.role)) {
    return <Navigate to={`/acces-refuse?raison=role`} replace state={{ home: ROLE_HOME[profile.role] }} />
  }
  return <Outlet />
}
