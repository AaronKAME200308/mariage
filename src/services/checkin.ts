import { requireSupabase } from '@/lib/supabase'

export interface CheckInResult {
  ok: boolean
  code: string
  guest_name?: string
  table_name?: string | null
  allowed_party?: number
  party_size?: number
  arrived_count?: number
  checked_in_at?: string
}

export interface CheckInStats { expected_guests: number; arrived_guests: number; arrived_people: number }
export interface RecentCheckIn { guest_name: string; table_name: string | null; party_size: number; method: 'qr' | 'manual'; checked_in_at: string }
export interface GuestHit {
  guest_id: string; full_name: string; table_name: string | null
  rsvp_status: 'pending' | 'confirmed' | 'declined'; allowed_companions: number; arrived_count: number
}

/** Message affiché à l'hôtesse pour chaque code renvoyé par la base. */
export const CHECK_IN_MESSAGE: Record<string, { tone: 'success' | 'warning' | 'danger'; title: string; detail: string }> = {
  success: { tone: 'success', title: 'Accès autorisé', detail: '' },
  already_checked_in: { tone: 'warning', title: 'Déjà enregistré', detail: 'Cet invité est déjà entré. Ne pas valider une seconde fois.' },
  rsvp_declined: { tone: 'danger', title: 'Invitation déclinée', detail: 'Cet invité a indiqué ne pas venir. Orientez-le vers un responsable.' },
  party_size_exceeded: { tone: 'danger', title: 'Trop de personnes', detail: 'Le groupe dépasse le nombre de places prévues pour cet invité.' },
  revoked_token: { tone: 'danger', title: 'QR code révoqué', detail: 'Ce code n’est plus valable. Orientez l’invité vers les mariés ou un responsable.' },
  unknown_token: { tone: 'danger', title: 'QR code inconnu', detail: 'Ce code n’est pas reconnu.' },
  wrong_wedding: { tone: 'danger', title: 'Autre mariage', detail: 'Ce code ne correspond pas à ce mariage.' },
  wedding_closed: { tone: 'danger', title: 'Mariage fermé', detail: 'Les contrôles d’accès sont désactivés pour ce mariage.' },
  unknown_guest: { tone: 'danger', title: 'Invité introuvable', detail: 'Cet invité n’existe pas dans ce mariage.' },
  forbidden: { tone: 'danger', title: 'Accès refusé', detail: 'Votre compte n’est pas autorisé à contrôler ce mariage.' },
  not_authenticated: { tone: 'danger', title: 'Session expirée', detail: 'Reconnectez-vous puis recommencez.' },
}

/** Accepte l'URL encodée dans le QR (…/acces/<jeton>) ou le jeton brut. Renvoie null si le format est invalide. */
export function extractToken(raw: string): string | null {
  const value = raw.trim()
  const match = /\/acces\/([0-9a-f]{48,200})\/?(?:[?#].*)?$/i.exec(value)
  const token = match ? match[1] : value
  return /^[0-9a-f]{48,200}$/i.test(token) ? token.toLowerCase() : null
}

async function rpcResult(fn: string, args: Record<string, unknown>): Promise<CheckInResult> {
  const { data, error } = await requireSupabase().rpc(fn, args)
  if (error) {
    if (error.message.includes('already_checked_in')) return { ok: false, code: 'already_checked_in' }
    throw new Error('Le contrôle n’a pas pu être enregistré (réseau ou serveur). Vérifiez la connexion puis recommencez.')
  }
  return data as CheckInResult
}

export const performCheckIn = (weddingId: string, token: string, partySize?: number) =>
  rpcResult('perform_check_in', { p_wedding_id: weddingId, p_token: token, p_party_size: partySize ?? null })

export const checkInByGuest = (weddingId: string, guestId: string, partySize?: number) =>
  rpcResult('perform_check_in_by_guest', { p_wedding_id: weddingId, p_guest_id: guestId, p_party_size: partySize ?? null })

export async function getCheckInStats(weddingId: string): Promise<CheckInStats> {
  const { data, error } = await requireSupabase().rpc('check_in_stats', { p_wedding_id: weddingId })
  if (error) throw new Error('Impossible de charger la progression.')
  return data as CheckInStats
}

export async function getRecentCheckIns(weddingId: string): Promise<RecentCheckIn[]> {
  const { data, error } = await requireSupabase().rpc('recent_check_ins', { p_wedding_id: weddingId, p_limit: 15 })
  if (error) throw new Error('Impossible de charger les derniers contrôles.')
  return data as RecentCheckIn[]
}

export async function searchGuestsForCheckIn(weddingId: string, query: string): Promise<GuestHit[]> {
  const { data, error } = await requireSupabase().rpc('search_guests_for_check_in', { p_wedding_id: weddingId, p_query: query })
  if (error) throw new Error('La recherche a échoué.')
  return data as GuestHit[]
}
