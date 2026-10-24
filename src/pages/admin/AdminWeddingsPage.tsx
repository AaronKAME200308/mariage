import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/features/auth/AuthProvider'
import { WeddingForm } from '@/features/weddings/WeddingForm'
import { useAsync } from '@/hooks/useAsync'
import { formatDate } from '@/lib/utils'
import { createWedding, listWeddings } from '@/services/weddings'
import type { WeddingStatus } from '@/types/domain'

export const STATUS_LABEL: Record<WeddingStatus, string> = {
  draft: 'Brouillon', published: 'Publié', unpublished: 'Dépublié', archived: 'Archivé',
}
export const STATUS_TONE: Record<WeddingStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral', published: 'success', unpublished: 'warning', archived: 'danger',
}

export default function AdminWeddingsPage() {
  useEffect(() => { document.title = 'Mariages — MariamCM' }, [])
  const { session } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [reload, setReload] = useState(0)
  const state = useAsync(listWeddings, [reload])

  return (
    <>
      <PageHeader
        title="Mariages"
        description="Créez et gérez les sites de mariage de vos clients."
        actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" aria-hidden />Nouveau mariage</Button>}
      />
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <Alert>{state.error.message}</Alert>}
      {state.status === 'success' && (state.data.length === 0 ? (
        <EmptyState title="Aucun mariage" description="Créez le premier site de mariage pour commencer."
          action={<Button onClick={() => setOpen(true)}>Nouveau mariage</Button>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.data.map((w) => (
            <li key={w.id}>
              <Link to={`/admin/mariages/${w.id}`} className="block h-full rounded-2xl border border-forest/10 bg-white p-5 shadow-soft transition-shadow hover:shadow-md">
                <Badge tone={STATUS_TONE[w.status]}>{STATUS_LABEL[w.status]}</Badge>
                <h2 className="mt-3 text-2xl font-semibold text-forest">{w.partner_one_name} &amp; {w.partner_two_name}</h2>
                <p className="mt-1 text-sm text-ink-soft">{formatDate(w.wedding_date, w.timezone) || 'Date à définir'}</p>
                <p className="mt-3 text-xs text-ink-soft">/{w.slug}</p>
              </Link>
            </li>
          ))}
        </ul>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau mariage" wide>
        <WeddingForm
          submitLabel="Créer le mariage"
          onSubmit={async (input) => {
            const created = await createWedding(input, session!.user.id)
            setOpen(false)
            setReload((n) => n + 1)
            navigate(`/admin/mariages/${created.id}`)
          }}
        />
      </Modal>
    </>
  )
}
