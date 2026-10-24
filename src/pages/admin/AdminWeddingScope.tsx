import { Link, Outlet, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { WeddingProvider } from '@/features/weddings/WeddingContext'

/** Permet à l'administrateur d'éditer le contenu d'un mariage avec les mêmes écrans que les mariés. */
export default function AdminWeddingScope() {
  const { id = '' } = useParams()
  const { pathname } = useLocation()
  const base = `/admin/mariages/${id}`
  const atRoot = pathname === base
  return (
    <WeddingProvider weddingId={id} basePath={base} isAdminScope>
      {!atRoot && (
        <Link to={base} className="mb-6 inline-flex items-center gap-2 text-sm text-forest underline-offset-4 hover:underline">
          <ArrowLeft className="size-4" aria-hidden />Retour au mariage
        </Link>
      )}
      <Outlet />
    </WeddingProvider>
  )
}
