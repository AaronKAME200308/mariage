import { requireSupabase } from '@/lib/supabase'

export interface CreateAccountInput {
  email: string
  full_name: string
  role: 'couple' | 'hostess'
  wedding_id: string
  password: string
}

/**
 * Crée un compte privilégié via l'Edge Function `admin-manage-users` : le service_role
 * n'existe que côté serveur, et la fonction vérifie que l'appelant est administrateur.
 */
export async function createAccount(input: CreateAccountInput): Promise<void> {
  const { data, error } = await requireSupabase().functions.invoke('admin-manage-users', {
    body: { action: 'create_user', ...input },
  })
  if (error) {
    let message = 'La création du compte a échoué.'
    try {
      const ctx = (error as { context?: Response }).context
      const body = ctx ? await ctx.json() : null
      if (body?.error) message = String(body.error)
    } catch { /* corps non JSON : message générique */ }
    throw new Error(message)
  }
  if (data?.error) throw new Error(String(data.error))
}
