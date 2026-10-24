// Vérifie sur une VRAIE base Supabase que deux scans simultanés du même QR ne produisent qu'un seul succès.
// Usage (variables lues dans l'environnement, rien n'est stocké) :
//   SUPABASE_URL=… SUPABASE_KEY=<clé publishable> HOSTESS_EMAIL=… HOSTESS_PASSWORD=… \
//   WEDDING_ID=<uuid> TOKEN=<jeton QR d'un invité NON encore arrivé> node scripts/concurrency-check.mjs
// À lancer sur un mariage de TEST : le contrôle réussi modifie l'invité (annulable depuis l'interface).
import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_KEY, HOSTESS_EMAIL, HOSTESS_PASSWORD, WEDDING_ID, TOKEN } = process.env
if (![SUPABASE_URL, SUPABASE_KEY, HOSTESS_EMAIL, HOSTESS_PASSWORD, WEDDING_ID, TOKEN].every(Boolean)) {
  console.error('Variables manquantes : voir l’en-tête du script.')
  process.exit(2)
}
const N = 6
const clients = await Promise.all(Array.from({ length: N }, async () => {
  const c = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  const { error } = await c.auth.signInWithPassword({ email: HOSTESS_EMAIL, password: HOSTESS_PASSWORD })
  if (error) throw new Error('Connexion impossible : ' + error.message)
  return c
}))
const results = await Promise.all(clients.map((c) => c.rpc('perform_check_in', { p_wedding_id: WEDDING_ID, p_token: TOKEN, p_party_size: null })))
const codes = results.map((r) => (r.error ? 'erreur:' + r.error.message : r.data.code))
console.log('Résultats :', codes)
const successes = codes.filter((c) => c === 'success').length
if (successes === 1) { console.log(`OK : 1 seul succès sur ${N} scans simultanés.`); process.exit(0) }
console.error(`ÉCHEC : ${successes} succès (attendu : 1).`)
process.exit(1)
