import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { Button, buttonStyles } from '@/components/ui/Button'
import { Alert, Spinner } from '@/components/ui/Feedback'
import { ResultCard } from '@/features/checkin/ResultCard'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAsync } from '@/hooks/useAsync'
import { requireSupabase } from '@/lib/supabase'
import { extractToken, performCheckIn, type CheckInResult } from '@/services/checkin'
import type { Wedding } from '@/types/domain'

type Row = Pick<Wedding, 'id' | 'partner_one_name' | 'partner_two_name' | 'timezone' | 'status'>

/**
 * Destination de l'URL encodée dans les QR codes. Elle ne révèle rien sur l'invité : sans compte
 * autorisé, c'est une simple page d'information. Le contrôle exige un clic explicite (jamais
 * déclenché par le simple chargement de la page, par exemple par un aperçu de lien).
 */
export default function AccessLandingPage() {
  const { token: raw = '' } = useParams()
  const token = extractToken(raw)
  const auth = useAuth()
  useEffect(() => { document.title = 'Contrôle d’accès — MariamCM' }, [])
  const canScan = auth.status === 'ready' && !!auth.profile && ['hostess', 'admin', 'couple'].includes(auth.profile.role)

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-4 py-10">
      <Logo />
      <h1 className="text-4xl font-semibold text-forest">Contrôle d’accès</h1>
      {!token && <Alert>Ce lien n’est pas un QR code valide.</Alert>}
      {token && auth.status === 'loading' && <Spinner />}
      {token && auth.status !== 'loading' && !canScan && (
        <>
          <p className="text-ink-soft">Ce code sert uniquement à contrôler l’entrée le jour du mariage. Présentez-le à l’accueil : il n’affiche aucune information personnelle.</p>
          <Link to="/connexion" className={buttonStyles('secondary', 'md')}>Je suis hôtesse : me connecter</Link>
        </>
      )}
      {token && canScan && <Verify token={token} />}
    </main>
  )
}

function Verify({ token }: { token: string }) {
  const weddings = useAsync(async () => {
    const { data, error } = await requireSupabase().from('weddings').select('id, partner_one_name, partner_two_name, timezone, status').neq('status', 'archived')
    if (error) throw new Error('Impossible de charger vos mariages.')
    return data as Row[]
  }, [])
  const [weddingId, setWeddingId] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (weddings.status === 'loading') return <Spinner />
  if (weddings.status === 'error') return <Alert>{weddings.error.message}</Alert>
  const list = weddings.data
  if (list.length === 0) return <Alert>Aucun mariage actif ne vous est attribué.</Alert>
  const selected = list.find((w) => w.id === (weddingId || (list.length === 1 ? list[0].id : ''))) ?? null

  async function run() {
    if (!selected) return
    setBusy(true); setError(null)
    try { setResult(await performCheckIn(selected.id, token)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Erreur réseau.') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      {list.length > 1 && (
        <div>
          <label htmlFor="w" className="mb-1 block text-sm font-medium text-ink">Mariage contrôlé</label>
          <select id="w" value={selected?.id ?? ''} onChange={(e) => { setWeddingId(e.target.value); setResult(null) }} className="w-full rounded-xl border border-forest/25 bg-white px-4 py-3">
            <option value="" disabled>Choisir…</option>
            {list.map((w) => <option key={w.id} value={w.id}>{w.partner_one_name} &amp; {w.partner_two_name}</option>)}
          </select>
        </div>
      )}
      {selected && list.length === 1 && <p className="text-ink-soft">Mariage : {selected.partner_one_name} &amp; {selected.partner_two_name}</p>}
      {error && <Alert>{error}</Alert>}
      {result && selected && <ResultCard result={result} timeZone={selected.timezone} />}
      {!result && <Button size="lg" className="w-full" loading={busy} disabled={!selected} onClick={() => void run()}>Valider l’entrée</Button>}
      {selected && <Link to={`/hotesse/${selected.id}`} className="block text-sm font-medium text-forest underline">Ouvrir le scanner</Link>}
    </div>
  )
}
