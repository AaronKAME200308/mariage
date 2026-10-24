import { requireSupabase } from '@/lib/supabase'
import type { GalleryImage, StoryMilestone, WeddingEvent } from '@/types/domain'

function fail(): never {
  throw new Error('L’opération a échoué. Vérifiez vos droits puis réessayez.')
}

// ---- Programme ----
export type EventInput = Omit<WeddingEvent, 'id' | 'wedding_id' | 'sort_order'>

export async function listEvents(weddingId: string): Promise<WeddingEvent[]> {
  const { data, error } = await requireSupabase().from('wedding_events').select('*').eq('wedding_id', weddingId).order('sort_order').order('starts_at')
  if (error) fail()
  return data as WeddingEvent[]
}
export async function saveEvent(weddingId: string, input: EventInput, id?: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = id
    ? await sb.from('wedding_events').update(input).eq('id', id)
    : await sb.from('wedding_events').insert({ ...input, wedding_id: weddingId })
  if (error) fail()
}
export async function deleteEvent(id: string): Promise<void> {
  const { error } = await requireSupabase().from('wedding_events').delete().eq('id', id)
  if (error) fail()
}

// ---- Histoire ----
export type MilestoneInput = Omit<StoryMilestone, 'id' | 'wedding_id' | 'sort_order'>

export async function listMilestones(weddingId: string): Promise<StoryMilestone[]> {
  const { data, error } = await requireSupabase().from('story_milestones').select('*').eq('wedding_id', weddingId).order('sort_order').order('happened_on')
  if (error) fail()
  return data as StoryMilestone[]
}
export async function saveMilestone(weddingId: string, input: MilestoneInput, id?: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = id
    ? await sb.from('story_milestones').update(input).eq('id', id)
    : await sb.from('story_milestones').insert({ ...input, wedding_id: weddingId })
  if (error) fail()
}
export async function deleteMilestone(id: string): Promise<void> {
  const { error } = await requireSupabase().from('story_milestones').delete().eq('id', id)
  if (error) fail()
}

// ---- Galerie ----
export async function listGallery(weddingId: string): Promise<GalleryImage[]> {
  const { data, error } = await requireSupabase().from('gallery_images').select('*').eq('wedding_id', weddingId).order('sort_order').order('created_at')
  if (error) fail()
  return data as GalleryImage[]
}
export async function addGalleryImage(
  weddingId: string, path: string, size: { width: number; height: number } | null, sortOrder: number,
): Promise<void> {
  const { error } = await requireSupabase().from('gallery_images').insert({
    wedding_id: weddingId, storage_path: path, width: size?.width ?? null, height: size?.height ?? null, sort_order: sortOrder,
  })
  if (error) fail()
}
export async function updateGalleryCaption(id: string, caption: string | null): Promise<void> {
  const { error } = await requireSupabase().from('gallery_images').update({ caption }).eq('id', id)
  if (error) fail()
}
export async function swapGalleryOrder(a: GalleryImage, b: GalleryImage): Promise<void> {
  const sb = requireSupabase()
  const r1 = await sb.from('gallery_images').update({ sort_order: b.sort_order ?? 0 }).eq('id', a.id)
  const r2 = await sb.from('gallery_images').update({ sort_order: a.sort_order ?? 0 }).eq('id', b.id)
  if (r1.error || r2.error) fail()
}
export async function deleteGalleryImage(id: string): Promise<void> {
  const { error } = await requireSupabase().from('gallery_images').delete().eq('id', id)
  if (error) fail()
}
