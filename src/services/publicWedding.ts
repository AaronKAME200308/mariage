import { requireSupabase } from '@/lib/supabase'
import type { PublicWedding } from '@/types/domain'

/** Charge un site de mariage par slug. Retourne null si inconnu ou non publié. */
export async function fetchPublicWedding(slug: string, preview = false): Promise<PublicWedding | null> {
  const { data, error } = await requireSupabase().rpc('get_public_wedding', {
    p_slug: slug,
    p_preview: preview,
  })
  if (error) throw new Error('Impossible de charger ce site pour le moment.')
  return (data as PublicWedding | null) ?? null
}
