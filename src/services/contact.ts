import { requireSupabase } from '@/lib/supabase'
import type { ContactValues } from '@/lib/schemas'
import type { RpcResult } from '@/types/domain'

const MESSAGES: Record<string, string> = {
  invalid_input: 'Certains champs sont invalides. Vérifiez votre saisie.',
  rate_limited: 'Trop de messages envoyés en peu de temps. Réessayez dans une minute.',
}

export async function sendContactMessage(values: ContactValues): Promise<void> {
  const { data, error } = await requireSupabase().rpc('submit_contact_message', {
    p_name: values.name,
    p_email: values.email,
    p_message: values.message,
    p_subject: values.subject || null,
  })
  if (error) throw new Error('Envoi impossible pour le moment. Veuillez réessayer.')
  const result = data as RpcResult
  if (!result?.ok) throw new Error(MESSAGES[result?.code] ?? 'Votre message n’a pas pu être envoyé.')
}
