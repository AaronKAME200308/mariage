import { requireSupabase } from '@/lib/supabase'
import type { AppRole, Wedding, WeddingStatus } from '@/types/domain'

export interface WeddingInput {
  slug: string
  partner_one_name: string
  partner_two_name: string
  wedding_date: string | null
  timezone: string
}

function mapError(error: { code?: string; message: string }): Error {
  if (error.code === '23505') return new Error('Cette adresse (slug) est déjà utilisée par un autre mariage.')
  if (error.message.includes('weddings_slug_not_reserved')) return new Error('Cette adresse est réservée par la plateforme. Choisissez-en une autre.')
  if (error.message.includes('weddings_slug_format')) return new Error('Adresse invalide : 3 à 60 caractères, lettres minuscules, chiffres et tirets.')
  if (error.code === '42501' || error.message.includes('row-level security') || error.message.includes('forbidden')) {
    return new Error('Vous n’avez pas les droits nécessaires pour cette action.')
  }
  return new Error('L’opération a échoué. Veuillez réessayer.')
}

const COLUMNS = 'id, slug, partner_one_name, partner_two_name, wedding_date, timezone, status, theme, content, settings, hero_image_path, music_path, published_at'

export async function listWeddings(): Promise<Wedding[]> {
  const { data, error } = await requireSupabase().from('weddings').select(COLUMNS).order('created_at', { ascending: false })
  if (error) throw mapError(error)
  return data as Wedding[]
}

export async function getWedding(id: string): Promise<Wedding | null> {
  const { data, error } = await requireSupabase().from('weddings').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw mapError(error)
  return (data as Wedding | null) ?? null
}

export async function createWedding(input: WeddingInput, userId: string): Promise<Wedding> {
  const { data, error } = await requireSupabase()
    .from('weddings').insert({ ...input, status: 'draft', created_by: userId }).select(COLUMNS).single()
  if (error) throw mapError(error)
  return data as Wedding
}

export async function updateWeddingIdentity(id: string, input: WeddingInput): Promise<void> {
  const { error } = await requireSupabase().from('weddings').update(input).eq('id', id)
  if (error) throw mapError(error)
}

/** Réservé à l'administrateur : la base refuse ce changement à tout autre rôle. */
export async function setWeddingStatus(id: string, status: WeddingStatus): Promise<void> {
  const { error } = await requireSupabase().from('weddings').update({ status }).eq('id', id)
  if (error) throw mapError(error)
}

export interface SitePatch {
  theme: Record<string, unknown>
  content: Record<string, unknown>
  settings: Record<string, unknown>
  hero_image_path: string | null
  music_path: string | null
}

export async function updateWeddingSite(id: string, patch: SitePatch): Promise<void> {
  const { error } = await requireSupabase().from('weddings').update(patch).eq('id', id)
  if (error) throw mapError(error)
}

export async function deleteWedding(id: string): Promise<void> {
  const { error } = await requireSupabase().from('weddings').delete().eq('id', id)
  if (error) throw mapError(error)
}

export interface MembershipRow {
  id: string
  user_id: string
  member_role: Exclude<AppRole, 'admin'>
  profile: { full_name: string; is_active: boolean } | null
}

export async function listMemberships(weddingId: string): Promise<MembershipRow[]> {
  const { data, error } = await requireSupabase()
    .from('wedding_memberships')
    .select('id, user_id, member_role, profiles(full_name, is_active)')
    .eq('wedding_id', weddingId)
    .order('created_at')
  if (error) throw mapError(error)
  return (data as unknown as Array<Omit<MembershipRow, 'profile'> & { profiles: MembershipRow['profile'] }>).map(({ profiles, ...m }) => ({ ...m, profile: profiles }))
}

export async function removeMembership(id: string): Promise<void> {
  const { error } = await requireSupabase().from('wedding_memberships').delete().eq('id', id)
  if (error) throw mapError(error)
}

/** Le mariage rattaché à l'utilisateur couple connecté (la RLS ne renvoie que le sien). */
export async function getMyWedding(): Promise<Wedding | null> {
  const { data, error } = await requireSupabase().from('weddings').select(COLUMNS).order('created_at').limit(1)
  if (error) throw mapError(error)
  return ((data ?? [])[0] as Wedding | undefined) ?? null
}
