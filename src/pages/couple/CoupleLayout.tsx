import { BarChart3, Camera, CalendarHeart, BookHeart, ClipboardCheck, LayoutDashboard, Palette, Gift, MessageSquareHeart, Table2, Users } from 'lucide-react'
import { DashboardLayout, type NavItem } from '@/components/layout/DashboardLayout'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { WeddingProvider } from '@/features/weddings/WeddingContext'
import { useAsync } from '@/hooks/useAsync'
import { getMyWedding } from '@/services/weddings'

const NAV: NavItem[] = [
  { to: '/couple', label: 'Vue d’ensemble', icon: LayoutDashboard, end: true },
  { to: '/couple/personnalisation', label: 'Personnalisation', icon: Palette },
  { to: '/couple/histoire', label: 'Notre histoire', icon: BookHeart },
  { to: '/couple/programme', label: 'Programme', icon: CalendarHeart },
  { to: '/couple/galerie', label: 'Galerie', icon: Camera },
  { to: '/couple/invites', label: 'Invités', icon: Users },
  { to: '/couple/tables', label: 'Tables', icon: Table2 },
  { to: '/couple/rsvp', label: 'RSVP', icon: ClipboardCheck },
  { to: '/couple/statistiques', label: 'Statistiques', icon: BarChart3 },
  { to: '/couple/livre-d-or', label: 'Livre d’or', icon: MessageSquareHeart },
  { to: '/couple/cadeaux', label: 'Cadeaux', icon: Gift },
]

export default function CoupleLayout() {
  const state = useAsync(getMyWedding, [])
  if (state.status === 'loading') return <div className="grid min-h-dvh place-items-center"><Spinner /></div>
  if (state.status === 'error') return <div className="p-8"><Alert>{state.error.message}</Alert></div>
  if (!state.data) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <EmptyState title="Aucun mariage attribué" description="Votre compte n’est rattaché à aucun mariage pour le moment. Contactez l’équipe MariamCM." />
      </div>
    )
  }
  return (
    <WeddingProvider weddingId={state.data.id} basePath="/couple">
      <DashboardLayout nav={NAV} />
    </WeddingProvider>
  )
}
