import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/** Vrai quand les variables d'environnement publiques sont renseignées. */
export const isSupabaseConfigured = Boolean(url && key && !url.includes('votre-projet'))

/**
 * Client Supabase unique de l'application. Il n'utilise que la clé publique
 * (publishable/anon) : la sécurité repose sur la RLS et les RPC côté base.
 * Aucune clé service_role ne doit jamais apparaître dans le frontend.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, key as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'Supabase n’est pas configuré. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans le fichier .env.',
    )
    this.name = 'SupabaseNotConfiguredError'
  }
}

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new SupabaseNotConfiguredError()
  return supabase
}
