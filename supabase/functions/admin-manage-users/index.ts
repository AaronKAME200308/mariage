// Edge Function Supabase (Deno) — création de comptes privilégiés par un administrateur.
//
// Pourquoi une Edge Function : créer un utilisateur avec un rôle exige la clé service_role,
// qui ne doit jamais exister côté navigateur. La fonction :
//   1. authentifie l'appelant via son JWT ;
//   2. vérifie qu'il est administrateur actif (table profiles) ;
//   3. crée le compte avec le rôle dans app_metadata (non modifiable par l'utilisateur) ;
//   4. rattache le compte au mariage (wedding_memberships).
//
// Déploiement : npx supabase functions deploy admin-manage-users
// Variables fournies automatiquement par Supabase : SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // 1) Identité de l'appelant
  const authHeader = req.headers.get('Authorization') ?? ''
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: userData, error: userError } = await caller.auth.getUser()
  if (userError || !userData.user) return json({ error: 'Non authentifié.' }, 401)

  // 2) L'appelant doit être administrateur actif
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data: me } = await admin.from('profiles').select('role, is_active').eq('id', userData.user.id).maybeSingle()
  if (!me || me.role !== 'admin' || !me.is_active) return json({ error: 'Accès réservé aux administrateurs.' }, 403)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ error: 'Requête invalide.' }, 400) }
  if (body.action !== 'create_user') return json({ error: 'Action inconnue.' }, 400)

  // 3) Validation stricte des entrées
  const email = String(body.email ?? '').trim().toLowerCase()
  const fullName = String(body.full_name ?? '').trim()
  const role = body.role
  const weddingId = String(body.wedding_id ?? '')
  const password = String(body.password ?? '')
  if (!EMAIL.test(email) || email.length > 254) return json({ error: 'Adresse e-mail invalide.' }, 400)
  if (fullName.length < 1 || fullName.length > 120) return json({ error: 'Nom invalide.' }, 400)
  if (role !== 'couple' && role !== 'hostess') return json({ error: 'Rôle invalide.' }, 400)
  if (!UUID.test(weddingId)) return json({ error: 'Mariage invalide.' }, 400)
  if (password.length < 10 || password.length > 72) return json({ error: 'Le mot de passe doit contenir de 10 à 72 caractères.' }, 400)

  const { data: wedding } = await admin.from('weddings').select('id').eq('id', weddingId).maybeSingle()
  if (!wedding) return json({ error: 'Mariage introuvable.' }, 404)

  // 4) Création du compte : le rôle va dans app_metadata (lu par le trigger handle_new_user)
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { role },
    user_metadata: { full_name: fullName },
  })
  if (createError || !created.user) {
    const msg = createError?.message ?? ''
    if (msg.toLowerCase().includes('already')) return json({ error: 'Un compte existe déjà avec cette adresse e-mail.' }, 409)
    return json({ error: 'Création du compte impossible.' }, 400)
  }

  // 5) Rattachement au mariage (le trigger vérifie la cohérence rôle/membership)
  const { error: memberError } = await admin.from('wedding_memberships').insert({
    wedding_id: weddingId, user_id: created.user.id, member_role: role, created_by: userData.user.id,
  })
  if (memberError) {
    // Pas de compte orphelin : on annule la création.
    await admin.auth.admin.deleteUser(created.user.id)
    return json({ error: 'Le compte a été annulé : rattachement au mariage impossible.' }, 400)
  }

  return json({ ok: true, user_id: created.user.id })
})
