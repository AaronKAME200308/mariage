import type { AppRole } from '@/types/domain'

export const ROLE_HOME: Record<AppRole, string> = {
  admin: '/admin',
  couple: '/couple',
  hostess: '/hotesse',
}

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: 'Administrateur',
  couple: 'Mariés',
  hostess: 'Hôtesse',
}
