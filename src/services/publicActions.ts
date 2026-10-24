import { requireSupabase } from '@/lib/supabase'
import type { RpcResult } from '@/types/domain'

export const RSVP_MESSAGES: Record<string, string> = {
  wedding_not_found: 'Ce site n’est plus disponible.',
  rsvp_closed: 'Les réponses ne sont plus acceptées.',
  invalid_input: 'Certaines informations sont invalides. Vérifiez votre saisie.',
  rate_limited: 'Trop de réponses en peu de temps. Réessayez dans une minute.',
  guest_not_found: 'Nous ne retrouvons pas votre invitation. Vérifiez l’orthographe de votre nom et, si on vous l’a demandé, votre e-mail ou téléphone.',
  companions_exceeded: 'Le nombre d’accompagnants dépasse celui prévu pour votre invitation.',
  table_full: 'Votre table ne peut pas accueillir ce nombre de personnes. Contactez les mariés.',
  rsvp_locked: 'Votre arrivée est déjà enregistrée : la réponse ne peut plus être modifiée.',
  duplicate: 'Une réponse existe déjà pour ce nom.',
}

export const GUESTBOOK_MESSAGES: Record<string, string> = {
  guestbook_closed: 'Le livre d’or est fermé.',
  invalid_input: 'Vérifiez votre nom et votre message.',
  rate_limited: 'Trop de messages en peu de temps. Réessayez dans une minute.',
  wedding_not_found: 'Ce site n’est plus disponible.',
}

export interface RsvpPayload {
  slug: string
  fullName: string
  status: 'confirmed' | 'declined'
  companions: number
  phone?: string
  email?: string
  message?: string
}

export async function submitRsvp(p: RsvpPayload): Promise<RpcResult> {
  const { data, error } = await requireSupabase().rpc('submit_rsvp', {
    p_slug: p.slug,
    p_full_name: p.fullName,
    p_status: p.status,
    p_companions: p.status === 'confirmed' ? p.companions : 0,
    p_phone: p.phone || null,
    p_email: p.email || null,
    p_message: p.message || null,
  })
  if (error) throw new Error('Envoi impossible pour le moment. Veuillez réessayer.')
  return data as RpcResult
}

export async function submitGuestbookMessage(slug: string, author: string, message: string): Promise<RpcResult> {
  const { data, error } = await requireSupabase().rpc('submit_guestbook_message', {
    p_slug: slug, p_author_name: author, p_message: message,
  })
  if (error) throw new Error('Envoi impossible pour le moment. Veuillez réessayer.')
  return data as RpcResult
}
