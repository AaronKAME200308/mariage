import { requireSupabase } from '@/lib/supabase'
import type { Gift } from '@/types/domain'

function fail(error: { code?: string; message: string }): Error {
  if (error.code === '42501' || error.message.includes('row-level security')) return new Error('Vous n’avez pas les droits nécessaires pour cette action.')
  if (error.message.includes('external_url')) return new Error('Le lien doit commencer par https://.')
  return new Error('L’opération a échoué. Veuillez réessayer.')
}

// ---------- Livre d'or ----------
export type ModerationStatus = 'pending' | 'approved' | 'rejected'
export interface GuestbookRow { id: string; author_name: string; message: string; status: ModerationStatus; created_at: string }

export async function listGuestbook(weddingId: string): Promise<GuestbookRow[]> {
  const { data, error } = await requireSupabase().from('guestbook_messages')
    .select('id, author_name, message, status, created_at').eq('wedding_id', weddingId).order('created_at', { ascending: false }).limit(500)
  if (error) throw fail(error)
  return data as GuestbookRow[]
}

export async function moderateMessage(id: string, status: ModerationStatus, userId: string): Promise<void> {
  const { error } = await requireSupabase().from('guestbook_messages')
    .update({ status, moderated_by: userId, moderated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw fail(error)
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await requireSupabase().from('guestbook_messages').delete().eq('id', id)
  if (error) throw fail(error)
}

// ---------- Cadeaux ----------
export type GiftRow = Gift & { sort_order: number }
export interface GiftInput {
  name: string; description: string | null; suggested_amount: number | null; currency: string
  external_url: string | null; status: Gift['status']; image_path?: string | null
}
const GIFT_COLS = 'id, name, description, image_path, suggested_amount, currency, external_url, status, sort_order'

export async function listGifts(weddingId: string): Promise<GiftRow[]> {
  const { data, error } = await requireSupabase().from('gifts').select(GIFT_COLS).eq('wedding_id', weddingId).order('sort_order').order('created_at')
  if (error) throw fail(error)
  return data as GiftRow[]
}

export async function saveGift(weddingId: string, input: GiftInput, id?: string, sortOrder = 0): Promise<void> {
  const db = requireSupabase().from('gifts')
  const { error } = id ? await db.update(input).eq('id', id) : await db.insert({ ...input, wedding_id: weddingId, sort_order: sortOrder })
  if (error) throw fail(error)
}

export async function deleteGift(id: string): Promise<void> {
  const { error } = await requireSupabase().from('gifts').delete().eq('id', id)
  if (error) throw fail(error)
}

// ---------- Administration ----------
export interface AdminUser { id: string; full_name: string; role: 'admin' | 'couple' | 'hostess'; is_active: boolean; created_at: string }

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await requireSupabase().from('profiles').select('id, full_name, role, is_active, created_at').order('created_at', { ascending: false }).limit(500)
  if (error) throw fail(error)
  return data as AdminUser[]
}

export async function setUserActive(id: string, active: boolean): Promise<void> {
  const { error } = await requireSupabase().from('profiles').update({ is_active: active }).eq('id', id)
  if (error) throw fail(error)
}

export interface AuditRow { id: string; action: string; entity: string | null; actor_id: string | null; wedding_id: string | null; created_at: string }
export async function listAudit(limit = 200): Promise<AuditRow[]> {
  const { data, error } = await requireSupabase().from('audit_logs').select('id, action, entity, actor_id, wedding_id, created_at').order('created_at', { ascending: false }).limit(limit)
  if (error) throw fail(error)
  return data as AuditRow[]
}

export interface ContactRow { id: string; name: string; email: string; subject: string | null; message: string; is_read: boolean; created_at: string }
export async function listContactMessages(): Promise<ContactRow[]> {
  const { data, error } = await requireSupabase().from('contact_messages').select('id, name, email, subject, message, is_read, created_at').order('created_at', { ascending: false }).limit(200)
  if (error) throw fail(error)
  return data as ContactRow[]
}
export async function markContactRead(id: string, read: boolean): Promise<void> {
  const { error } = await requireSupabase().from('contact_messages').update({ is_read: read }).eq('id', id)
  if (error) throw fail(error)
}
export async function deleteContact(id: string): Promise<void> {
  const { error } = await requireSupabase().from('contact_messages').delete().eq('id', id)
  if (error) throw fail(error)
}

export async function loadContactSettings(): Promise<{ contact: Record<string, string>; social: Record<string, string> }> {
  const { data, error } = await requireSupabase().from('platform_settings').select('key, value').in('key', ['contact', 'social_links'])
  if (error) throw fail(error)
  const by = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, Record<string, string>>
  return { contact: by.contact ?? {}, social: by.social_links ?? {} }
}

export async function saveContactSettings(contact: Record<string, string>, social: Record<string, string>, userId: string): Promise<void> {
  const clean = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v))
  const now = new Date().toISOString()
  const { error } = await requireSupabase().from('platform_settings').upsert([
    { key: 'contact', value: clean(contact), is_public: true, updated_by: userId, updated_at: now },
    { key: 'social_links', value: clean(social), is_public: true, updated_by: userId, updated_at: now },
  ])
  if (error) throw fail(error)
}
