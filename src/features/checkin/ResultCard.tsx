import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { formatTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { CHECK_IN_MESSAGE, type CheckInResult } from '@/services/checkin'

export function ResultCard({ result, timeZone }: { result: CheckInResult; timeZone: string }) {
  const msg = CHECK_IN_MESSAGE[result.code] ?? { tone: 'danger' as const, title: 'Contrôle refusé', detail: 'Réponse inattendue du serveur.' }
  const Icon = msg.tone === 'success' ? CheckCircle2 : msg.tone === 'warning' ? AlertTriangle : XCircle
  return (
    <div
      role={msg.tone === 'success' ? 'status' : 'alert'}
      className={cn(
        'rounded-2xl border-2 p-5',
        msg.tone === 'success' && 'border-emerald-600 bg-emerald-50 text-emerald-950',
        msg.tone === 'warning' && 'border-amber-500 bg-amber-50 text-amber-950',
        msg.tone === 'danger' && 'border-red-600 bg-red-50 text-red-950',
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="size-8 shrink-0" aria-hidden />
        <h3 className="text-2xl font-semibold">{msg.title}</h3>
      </div>
      {result.guest_name && <p className="mt-3 text-xl font-medium">{result.guest_name}</p>}
      <dl className="mt-2 space-y-1 text-base">
        {result.table_name !== undefined && result.guest_name && (
          <div className="flex gap-2"><dt className="font-medium">Table :</dt><dd>{result.table_name ?? 'Non attribuée'}</dd></div>
        )}
        {result.code === 'success' && result.party_size !== undefined && (
          <div className="flex gap-2"><dt className="font-medium">Personnes :</dt><dd>{result.party_size} sur {result.allowed_party} maximum</dd></div>
        )}
        {result.code === 'already_checked_in' && (
          <div className="flex gap-2"><dt className="font-medium">Arrivé(e) :</dt><dd>{result.arrived_count} personne(s){result.checked_in_at ? ` à ${formatTime(result.checked_in_at, timeZone)}` : ''}</dd></div>
        )}
      </dl>
      {msg.detail && <p className="mt-3 text-sm">{msg.detail}</p>}
    </div>
  )
}
