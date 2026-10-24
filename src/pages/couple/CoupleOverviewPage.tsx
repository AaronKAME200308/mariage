import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { buttonStyles } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { useWedding } from '@/features/weddings/WeddingContext'
import { formatDateTime } from '@/lib/time'
import { STATUS_LABEL, STATUS_TONE } from '@/pages/admin/AdminWeddingsPage'

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  return Number.isNaN(diff) ? null : Math.ceil(diff / 86_400_000)
}

export default function CoupleOverviewPage() {
  const { wedding: w } = useWedding()
  useEffect(() => { document.title = 'Vue d’ensemble — MariamCM' }, [])
  const [days] = useState(() => daysUntil(w.wedding_date))

  return (
    <>
      <PageHeader
        title={`${w.partner_one_name} & ${w.partner_two_name}`}
        description="Voici l’état de votre site de mariage."
        actions={<Link to={`/${w.slug}?apercu=1`} target="_blank" className={buttonStyles('primary', 'sm')}>Prévisualiser le site <ExternalLink className="size-4" aria-hidden /></Link>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-soft">
          <p className="text-sm text-ink-soft">Compte à rebours</p>
          <p className="mt-2 font-serif text-5xl font-semibold text-forest">
            {days === null ? '—' : days > 0 ? days : days === 0 ? 'Aujourd’hui' : 'Terminé'}
          </p>
          {days !== null && days > 0 && <p className="text-sm text-ink-soft">jour{days > 1 ? 's' : ''} avant le mariage</p>}
        </div>
        <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-soft">
          <p className="text-sm text-ink-soft">Date</p>
          <p className="mt-2 text-lg font-medium text-forest">{formatDateTime(w.wedding_date, w.timezone) || 'À définir'}</p>
        </div>
        <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-soft">
          <p className="text-sm text-ink-soft">Statut du site</p>
          <p className="mt-2"><Badge tone={STATUS_TONE[w.status]}>{STATUS_LABEL[w.status]}</Badge></p>
          <p className="mt-2 text-xs text-ink-soft">mariamcm.com/{w.slug}</p>
        </div>
      </div>
      {w.status !== 'published' && (
        <Alert tone="info" className="mt-6">
          Votre site n’est pas encore public. L’équipe MariamCM le publiera quand vous serez prêts : d’ici là,
          utilisez « Prévisualiser le site ».
        </Alert>
      )}
      <p className="mt-8 text-sm text-ink-soft">
        La gestion des invités, des RSVP et des tables sera disponible à l’étape suivante.
      </p>
    </>
  )
}
