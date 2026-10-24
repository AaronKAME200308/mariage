import { supabase } from '@/lib/supabase'

export interface PublicPlatformSettings {
  contact: { email?: string | null; phone?: string | null; address?: string | null }
  socialLinks: Record<string, string | null | undefined>
}

const EMPTY: PublicPlatformSettings = { contact: {}, socialLinks: {} }

/** Paramètres publics (contact, réseaux sociaux) configurables par l'administrateur. */
export async function fetchPublicPlatformSettings(): Promise<PublicPlatformSettings> {
  if (!supabase) return EMPTY
  const { data, error } = await supabase.from('platform_settings').select('key, value').in('key', ['contact', 'social_links'])
  if (error || !data) return EMPTY
  const byKey = Object.fromEntries(data.map((row) => [row.key, row.value])) as Record<string, Record<string, string | null>>
  return { contact: byKey.contact ?? {}, socialLinks: byKey.social_links ?? {} }
}
