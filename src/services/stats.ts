import { requireSupabase } from '@/lib/supabase'

export interface PlatformStats {
  weddings: number
  published: number
  upcoming: number
  guests: number
  confirmed: number
  pending: number
  checkIns: number
}

export interface ActivityItem {
  id: string
  action: string
  created_at: string
  metadata: Record<string, unknown>
}

async function count(build: (q: ReturnType<ReturnType<typeof requireSupabase>['from']>) => unknown, table: string): Promise<number> {
  const base = requireSupabase().from(table).select('*', { count: 'exact', head: true })
  const { count: n, error } = (await build(base as never)) as { count: number | null; error: unknown }
  if (error) throw new Error('Impossible de charger les statistiques.')
  return n ?? 0
}

/** Statistiques calculées par la base à partir des données réelles (la RLS limite selon le rôle). */
export async function fetchPlatformStats(): Promise<PlatformStats> {
  const nowIso = new Date().toISOString()
  const [weddings, published, upcoming, guests, confirmed, pending, checkIns] = await Promise.all([
    count((q) => q, 'weddings'),
    count((q) => (q as any).eq('status', 'published'), 'weddings'),
    count((q) => (q as any).gte('wedding_date', nowIso).neq('status', 'archived'), 'weddings'),
    count((q) => q, 'guests'),
    count((q) => (q as any).eq('rsvp_status', 'confirmed'), 'guests'),
    count((q) => (q as any).eq('rsvp_status', 'pending'), 'guests'),
    count((q) => (q as any).eq('result', 'success'), 'check_ins'),
  ])
  return { weddings, published, upcoming, guests, confirmed, pending, checkIns }
}

export async function fetchRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const { data, error } = await requireSupabase()
    .from('audit_logs').select('id, action, created_at, metadata').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error('Impossible de charger l’activité.')
  return data as ActivityItem[]
}

export const ACTION_LABELS: Record<string, string> = {
  'wedding.created': 'Mariage créé',
  'wedding.status_changed': 'Statut du site modifié',
  'wedding.deleted': 'Mariage supprimé',
  'membership.added': 'Accès attribué',
  'membership.removed': 'Accès retiré',
  'profile.role_changed': 'Rôle modifié',
  'profile.active_changed': 'Compte activé/désactivé',
  'check_in.cancelled': 'Contrôle d’accès annulé',
  'check_in.unknown_token': 'QR code inconnu scanné',
  'check_in.wrong_wedding': 'QR code d’un autre mariage scanné',
  'qr.revoked': 'QR code révoqué',
  'qr.renewed': 'QR code renouvelé',
}
