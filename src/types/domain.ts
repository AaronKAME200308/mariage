// Types alignés sur les migrations SQL (supabase/migrations).
// Une fois le projet Supabase créé, ils peuvent être régénérés avec `supabase gen types`.

export type AppRole = 'admin' | 'couple' | 'hostess'
export type WeddingStatus = 'draft' | 'published' | 'unpublished' | 'archived'
export type RsvpStatus = 'pending' | 'confirmed' | 'declined'

export interface Profile {
  id: string
  full_name: string
  role: AppRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Wedding {
  id: string
  slug: string
  partner_one_name: string
  partner_two_name: string
  wedding_date: string | null
  timezone: string
  status: WeddingStatus
  theme: Record<string, unknown>
  content: Record<string, unknown>
  settings: Record<string, unknown>
  hero_image_path: string | null
  music_path: string | null
  published_at: string | null
}

/** Résultat standard des RPC applicatives. */
export interface RpcResult {
  ok: boolean
  code: string
  [key: string]: unknown
}

export interface PublicWedding {
  wedding: Pick<
    Wedding,
    | 'id' | 'slug' | 'partner_one_name' | 'partner_two_name' | 'wedding_date' | 'timezone'
    | 'status' | 'theme' | 'content' | 'settings' | 'hero_image_path' | 'music_path'
  >
  events: WeddingEvent[]
  milestones: StoryMilestone[]
  gallery: GalleryImage[]
  gifts: Gift[]
  guestbook: GuestbookEntry[]
}

export type EventKind =
  | 'civil_ceremony' | 'religious_ceremony' | 'reception' | 'cocktail' | 'dinner' | 'party' | 'other'

export interface WeddingEvent {
  id: string
  wedding_id?: string
  kind: EventKind
  title: string
  starts_at: string | null
  ends_at: string | null
  venue_name: string | null
  address: string | null
  description: string | null
  map_url: string | null
  dress_code: string | null
  sort_order?: number
}

export interface StoryMilestone {
  id: string
  wedding_id?: string
  title: string
  description: string | null
  happened_on: string | null
  image_path: string | null
  sort_order?: number
}

export interface GalleryImage {
  id: string
  wedding_id?: string
  storage_path: string
  caption: string | null
  width: number | null
  height: number | null
  sort_order?: number
}

export interface Gift {
  id: string
  name: string
  description: string | null
  image_path: string | null
  suggested_amount: number | null
  currency: string
  external_url: string | null
  status: 'available' | 'reserved' | 'unavailable'
}

export interface GuestbookEntry {
  id: string
  author_name: string
  message: string
  created_at: string
}

export interface Guest {
  id: string
  wedding_id: string
  full_name: string
  phone: string | null
  email: string | null
  rsvp_status: RsvpStatus
  allowed_companions: number
  confirmed_companions: number
  rsvp_message: string | null
  rsvp_responded_at: string | null
  table_id: string | null
  arrived_count: number
  arrived_at: string | null
  notes: string | null
  created_at: string
}

export interface TableRow {
  id: string
  wedding_id: string
  name: string
  capacity: number
}

export interface QrTokenRow {
  id: string
  guest_id: string
  token: string
  status: 'active' | 'revoked'
  created_at: string
}

export interface RsvpResponseRow {
  id: string
  guest_id: string | null
  submitted_name: string
  status: 'confirmed' | 'declined'
  companions: number
  message: string | null
  created_at: string
}
