import { useState } from 'react'
import { Scanner, type IScannerError } from '@yudiel/react-qr-scanner'
import { Camera, CameraOff, ScanLine } from 'lucide-react'
import { Alert } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { checkInByGuest, extractToken, performCheckIn, type CheckInResult } from '@/services/checkin'
import { ResultCard } from './ResultCard'
import { GuestSearch } from './GuestSearch'

const CAMERA_ERRORS: Record<string, string> = {
  'permission-denied': 'L’accès à la caméra a été refusé. Autorisez-le dans les réglages du navigateur, ou utilisez la recherche par nom ci-dessous.',
  'no-camera': 'Aucune caméra n’a été trouvée sur cet appareil. Utilisez la recherche par nom ci-dessous.',
  'in-use': 'La caméra est déjà utilisée par une autre application. Fermez-la puis réessayez.',
  'insecure-context': 'La caméra exige une connexion sécurisée (https).',
  unsupported: 'Ce navigateur ne permet pas de scanner. Utilisez la recherche par nom ci-dessous.',
}

/**
 * Scanner : la caméra ne démarre que sur action explicite et s'arrête quand on quitte l'écran.
 * Un seul contrôle est traité à la fois ; le résultat reste affiché jusqu'à « Scanner le suivant »
 * pour éviter qu'un même code soit lu plusieurs fois par la caméra.
 */
export function ScannerPanel({ weddingId, timeZone, onChecked }: { weddingId: string; timeZone: string; onChecked: () => void }) {
  const [active, setActive] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)

  async function handle(run: () => Promise<CheckInResult>) {
    setBusy(true); setNetworkError(null)
    try { setResult(await run()); onChecked() }
    catch (e) { setNetworkError(e instanceof Error ? e.message : 'Erreur réseau.') }
    finally { setBusy(false) }
  }

  function onScan(codes: { rawValue: string }[]) {
    if (busy || result) return
    const raw = codes[0]?.rawValue
    if (!raw) return
    const token = extractToken(raw)
    if (!token) { setResult({ ok: false, code: 'unknown_token' }); return }
    void handle(() => performCheckIn(weddingId, token))
  }

  function onError(err: IScannerError) {
    if (err.kind === 'aborted') return
    setCameraError(CAMERA_ERRORS[err.kind] ?? 'La caméra n’a pas pu démarrer. Utilisez la recherche par nom ci-dessous.')
    setActive(false)
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="scan-title" className="rounded-2xl border border-forest/10 bg-white p-5">
        <h2 id="scan-title" className="flex items-center gap-2 text-2xl font-semibold text-forest"><ScanLine className="size-5" aria-hidden />Scanner un QR code</h2>

        {cameraError && <Alert className="mt-4">{cameraError}</Alert>}
        {networkError && <Alert className="mt-4">{networkError}</Alert>}

        {!active ? (
          <div className="mt-4">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => { setCameraError(null); setResult(null); setActive(true) }}>
              <Camera className="size-5" aria-hidden />Activer la caméra
            </Button>
            <p className="mt-2 text-xs text-ink-soft">La caméra ne démarre qu’après votre action et n’enregistre rien.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-black">
              <Scanner
                onScan={onScan}
                onError={onError}
                paused={busy || result !== null}
                formats={['qr_code']}
                constraints={{ facingMode: 'environment' }}
                sound={false}
                components={{ finder: true }}
              />
            </div>
            <p className="text-center text-sm text-ink-soft" aria-live="polite">
              {busy ? 'Vérification…' : result ? 'Scan en pause.' : 'Placez le QR code dans le cadre.'}
            </p>
            <Button variant="secondary" size="sm" onClick={() => setActive(false)}><CameraOff className="size-4" aria-hidden />Arrêter la caméra</Button>
          </div>
        )}

        {result && (
          <div className="mt-5 space-y-3">
            <ResultCard result={result} timeZone={timeZone} />
            <Button size="lg" className="w-full" onClick={() => setResult(null)}>Scanner le suivant</Button>
          </div>
        )}
      </section>

      <GuestSearch
        weddingId={weddingId}
        timeZone={timeZone}
        onCheckIn={(guestId) => handle(() => checkInByGuest(weddingId, guestId))}
        busy={busy}
        manualResult={!active ? result : null}
        onDismiss={() => setResult(null)}
      />
    </div>
  )
}
