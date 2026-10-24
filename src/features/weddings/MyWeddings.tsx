import { Link } from 'react-router-dom'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { formatDate } from '@/lib/utils'
import { requireSupabase } from '@/lib/supabase'
import type { Wedding } from '@/types/domain'

const STATUS_LABEL: Record<Wedding['status'], string> = {
  draft: 'Brouillon',
  published: 'Publié',
  unpublished: 'Dépublié',
  archived: 'Archivé',
}

type Row = Pick<Wedding, 'id' | 'slug' | 'partner_one_name' | 'partner_two_name' | 'wedding_date' | 'status' | 'timezone'>

/** Liste les mariages visibles par l'utilisateur : la RLS filtre côté base selon son rôle. */
async function fetchMyWeddings(): Promise<Row[]> {
  const { data, error } = await requireSupabase()
    .from('weddings')
    .select('id, slug, partner_one_name, partner_two_name, wedding_date, status, timezone')
    .order('wedding_date', { ascending: true, nullsFirst: false })
  if (error) throw new Error('Impossible de charger les mariages.')
  return data as Row[]
}

export function MyWeddings({ emptyText }: { emptyText: string }) {
  const state = useAsync(fetchMyWeddings, [])
  if (state.status === 'loading') return <Spinner />
  if (state.status === 'error') return <Alert>{state.error.message}</Alert>
  if (state.data.length === 0) return <EmptyState title="Aucun mariage" description={emptyText} />
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {state.data.map((w) => (
        <li key={w.id} className="rounded-2xl border border-forest/10 bg-white p-5 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-champagne-700">{STATUS_LABEL[w.status]}</p>
          <h3 className="mt-1 text-2xl font-semibold text-forest">
            {w.partner_one_name} &amp; {w.partner_two_name}
          </h3>
          <p className="mt-1 text-sm text-ink-soft">{formatDate(w.wedding_date, w.timezone) || 'Date à définir'}</p>
          <Link to={`/${w.slug}?apercu=1`} className="mt-4 inline-block text-sm font-medium text-forest underline-offset-4 hover:underline">
            Prévisualiser le site
          </Link>
        </li>
      ))}
    </ul>
  )
}
