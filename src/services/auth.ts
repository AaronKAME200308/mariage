import { requireSupabase } from '@/lib/supabase'

export class AuthError extends Error {}

function friendly(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.'
  if (m.includes('email not confirmed')) return 'Votre adresse e-mail n’est pas encore confirmée.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Trop de tentatives. Patientez quelques minutes.'
  if (m.includes('same password') || m.includes('different from the old')) {
    return 'Le nouveau mot de passe doit être différent de l’ancien.'
  }
  if (m.includes('weak') || m.includes('password should')) return 'Ce mot de passe est trop faible.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Connexion impossible. Vérifiez votre réseau.'
  return 'Une erreur est survenue. Veuillez réessayer.'
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await requireSupabase().auth.signInWithPassword({ email, password })
  if (error) throw new AuthError(friendly(error.message))
}

export async function requestPasswordReset(email: string): Promise<void> {
  const origin = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || window.location.origin
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reinitialiser-mot-de-passe`,
  })
  // Message identique que le compte existe ou non (pas d'énumération) : seules les erreurs techniques remontent.
  if (error && !error.message.toLowerCase().includes('not found')) throw new AuthError(friendly(error.message))
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await requireSupabase().auth.updateUser({ password })
  if (error) throw new AuthError(friendly(error.message))
}
