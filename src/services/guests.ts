import { requireSupabase } from '@/lib/supabase'
import type { Guest, QrTokenRow, RsvpResponseRow, RsvpStatus, TableRow } from '@/types/domain'

/** Traduit les erreurs de la base (contraintes, triggers, RLS) en messages compréhensibles. */
export function mapGuestError(error: { code?: string; message: string }): Error {
  const m = error.message
  if (m.includes('table_capacity_exceeded')) return new Error('Cette table n’a pas assez de places disponibles.')
  if (m.includes('guests_wedding_name_unique') || error.code === '23505') return new Error('Un invité porte déjà ce nom dans ce mariage.')
  if (m.includes('guests_confirmed_within_allowed')) return new Error('Les accompagnants confirmés dépassent le nombre autorisé.')
  if (m.includes('guests_companions_only_if_confirmed')) return new Error('Des accompagnants confirmés ne sont possibles que pour une présence confirmée.')
  if (m.includes('guests_arrived_within_party')) return new Error('Ce changement est incompatible avec le nombre de personnes déjà entrées.')
  if (m.includes('arrival_write_forbidden')) return new Error('L’arrivée effective ne peut être modifiée que par le contrôle d’accès.')
  if (m.includes('row-level security') || error.code === '42501') return new Error('Vous n’avez pas les droits nécessaires pour cette action.')
  if (error.code === '23514') return new Error('Certaines valeurs sont invalides. Vérifiez le formulaire.')
  return new Error('L’opération a échoué. Veuillez réessayer.')
}

export interface GuestQuery {
  weddingId: string
  page: number
  pageSize: number
  search: string
  rsvp: RsvpStatus | 'all'
  table: string // 'all' | 'none' | uuid
  arrival: 'all' | 'arrived' | 'not_arrived'
  sort: 'full_name' | 'created_at' | 'rsvp_status' | 'allowed_companions'
  ascending: boolean
}

export async function listGuestsPage(q: GuestQuery): Promise<{ rows: Guest[]; total: number }> {
  let query = requireSupabase().from('guests').select('*', { count: 'exact' }).eq('wedding_id', q.weddingId)
  const term = q.search.replace(/[,()%*\\_]/g, ' ').trim()
  if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
  if (q.rsvp !== 'all') query = query.eq('rsvp_status', q.rsvp)
  if (q.table === 'none') query = query.is('table_id', null)
  else if (q.table !== 'all') query = query.eq('table_id', q.table)
  if (q.arrival === 'arrived') query = query.gt('arrived_count', 0)
  if (q.arrival === 'not_arrived') query = query.eq('arrived_count', 0)
  const from = q.page * q.pageSize
  const { data, count, error } = await query
    .order(q.sort, { ascending: q.ascending })
    .order('full_name', { ascending: true })
    .range(from, from + q.pageSize - 1)
  if (error) throw mapGuestError(error)
  return { rows: data as Guest[], total: count ?? 0 }
}

/** Tous les invités d'un mariage (pagination par blocs de 1000) : tables, stats, export, doublons. */
export async function listAllGuests(weddingId: string): Promise<Guest[]> {
  const sb = requireSupabase()
  const all: Guest[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('guests').select('*').eq('wedding_id', weddingId).order('full_name').range(from, from + 999)
    if (error) throw mapGuestError(error)
    all.push(...(data as Guest[]))
    if (!data || data.length < 1000) break
  }
  return all
}

export interface GuestInput {
  full_name: string
  phone: string | null
  email: string | null
  allowed_companions: number
  rsvp_status: RsvpStatus
  confirmed_companions: number
  table_id: string | null
  notes: string | null
}

export async function saveGuest(weddingId: string, input: GuestInput, id?: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = id
    ? await sb.from('guests').update(input).eq('id', id)
    : await sb.from('guests').insert({ ...input, wedding_id: weddingId })
  if (error) throw mapGuestError(error)
}

export async function deleteGuest(id: string): Promise<void> {
  const { error } = await requireSupabase().from('guests').delete().eq('id', id)
  if (error) throw mapGuestError(error)
}

export async function insertGuestsBatch(
  weddingId: string,
  rows: Array<Pick<GuestInput, 'full_name' | 'phone' | 'email' | 'allowed_companions' | 'notes'>>,
): Promise<{ inserted: number; failed: number }> {
  const sb = requireSupabase()
  let inserted = 0
  let failed = 0
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100).map((r) => ({ ...r, wedding_id: weddingId }))
    const { error } = await sb.from('guests').insert(chunk)
    if (!error) { inserted += chunk.length; continue }
    // Un lot refusé (ex. doublon créé entre-temps) est rejoué ligne par ligne pour isoler les rejets.
    for (const row of chunk) {
      const single = await sb.from('guests').insert(row)
      if (single.error) failed++; else inserted++
    }
  }
  return { inserted, failed }
}

export async function fetchActiveTokens(guestIds: string[]): Promise<Record<string, QrTokenRow>> {
  if (guestIds.length === 0) return {}
  const { data, error } = await requireSupabase()
    .from('guest_qr_tokens').select('id, guest_id, token, status, created_at').in('guest_id', guestIds).eq('status', 'active')
  if (error) throw mapGuestError(error)
  return Object.fromEntries((data as QrTokenRow[]).map((t) => [t.guest_id, t]))
}

/** Les guests dont le QR a été révoqué sans renouvellement (aucun jeton actif). */
export async function fetchRevokedGuestIds(guestIds: string[]): Promise<Set<string>> {
  if (guestIds.length === 0) return new Set()
  const { data, error } = await requireSupabase()
    .from('guest_qr_tokens').select('guest_id').in('guest_id', guestIds).eq('status', 'revoked')
  if (error) throw mapGuestError(error)
  return new Set((data as Array<{ guest_id: string }>).map((r) => r.guest_id))
}

async function rpcOk(fn: string, guestId: string): Promise<void> {
  const { data, error } = await requireSupabase().rpc(fn, { p_guest_id: guestId })
  if (error) throw new Error('L’opération a échoué. Veuillez réessayer.')
  const res = data as { ok: boolean; code: string }
  if (!res.ok) {
    throw new Error(res.code === 'forbidden' ? 'Vous n’avez pas les droits nécessaires.' : res.code === 'not_checked_in' ? 'Cet invité n’est pas enregistré comme présent.' : 'Opération impossible.')
  }
}
export const revokeGuestQr = (guestId: string) => rpcOk('revoke_guest_qr', guestId)
export const renewGuestQr = (guestId: string) => rpcOk('renew_guest_qr', guestId)
export const cancelGuestCheckIn = (guestId: string) => rpcOk('cancel_check_in', guestId)

// ---- Tables ----
export async function listTables(weddingId: string): Promise<TableRow[]> {
  const { data, error } = await requireSupabase().from('tables').select('id, wedding_id, name, capacity').eq('wedding_id', weddingId).order('name')
  if (error) throw mapGuestError(error)
  return (data as TableRow[]).sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }))
}

export async function saveTable(weddingId: string, input: { name: string; capacity: number }, id?: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = id ? await sb.from('tables').update(input).eq('id', id) : await sb.from('tables').insert({ ...input, wedding_id: weddingId })
  if (error) {
    if (error.code === '23505') throw new Error('Une table porte déjà ce nom.')
    throw mapGuestError(error)
  }
}

export async function deleteTable(id: string): Promise<void> {
  const { error } = await requireSupabase().from('tables').delete().eq('id', id)
  if (error) throw mapGuestError(error)
}

export async function assignGuestToTable(guestId: string, tableId: string | null): Promise<void> {
  const { error } = await requireSupabase().from('guests').update({ table_id: tableId }).eq('id', guestId)
  if (error) throw mapGuestError(error)
}

// ---- RSVP ----
export async function listRsvpResponses(weddingId: string, limit = 100): Promise<RsvpResponseRow[]> {
  const { data, error } = await requireSupabase()
    .from('rsvp_responses').select('id, guest_id, submitted_name, status, companions, message, created_at')
    .eq('wedding_id', weddingId).order('created_at', { ascending: false }).limit(limit)
  if (error) throw mapGuestError(error)
  return data as RsvpResponseRow[]
}
