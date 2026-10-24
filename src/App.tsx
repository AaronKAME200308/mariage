import { lazy, Suspense, useEffect } from 'react'
import { PRIVATE_PREFIXES } from '@/lib/seo'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { FullPageSpinner } from '@/components/ui/Feedback'
import { ScrollToHash } from '@/components/layout/ScrollToHash'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import AccessDeniedPage from '@/pages/AccessDeniedPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import HomePage from '@/pages/HomePage'
import LegalPage from '@/pages/LegalPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'

const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminOverviewPage = lazy(() => import('@/pages/admin/AdminOverviewPage'))
const AdminWeddingDetailPage = lazy(() => import('@/pages/admin/AdminWeddingDetailPage'))
const AdminWeddingScope = lazy(() => import('@/pages/admin/AdminWeddingScope'))
const AdminWeddingsPage = lazy(() => import('@/pages/admin/AdminWeddingsPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminAuditPage = lazy(() => import('@/pages/admin/AdminAuditPage'))
const AdminMessagesPage = lazy(() => import('@/pages/admin/AdminMessagesPage'))
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'))
const GuestbookPage = lazy(() => import('@/pages/shared/GuestbookPage'))
const GiftsPage = lazy(() => import('@/pages/shared/GiftsPage'))
const CoupleLayout = lazy(() => import('@/pages/couple/CoupleLayout'))
const CoupleOverviewPage = lazy(() => import('@/pages/couple/CoupleOverviewPage'))
const CustomizePage = lazy(() => import('@/pages/shared/CustomizePage'))
const GalleryPage = lazy(() => import('@/pages/shared/GalleryPage'))
const GuestsPage = lazy(() => import('@/pages/shared/GuestsPage'))
const RsvpPage = lazy(() => import('@/pages/shared/RsvpPage'))
const StatsPage = lazy(() => import('@/pages/shared/StatsPage'))
const TablesPage = lazy(() => import('@/pages/shared/TablesPage'))
const ProgramPage = lazy(() => import('@/pages/shared/ProgramPage'))
const StoryPage = lazy(() => import('@/pages/shared/StoryPage'))
const AccessLandingPage = lazy(() => import('@/pages/AccessLandingPage'))
const HostessCheckInPage = lazy(() => import('@/pages/hostess/HostessPages').then((m) => ({ default: m.HostessCheckInPage })))
const HostessHomePage = lazy(() => import('@/pages/hostess/HostessPages').then((m) => ({ default: m.HostessHomePage })))
const ExamplePage = lazy(() => import('@/pages/ExamplePage'))
const WeddingSitePage = lazy(() => import('@/pages/WeddingSitePage'))

/** Pages privées : jamais indexées par les moteurs de recherche. */
function PrivateNoIndex() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (!PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p.endsWith('/') ? p : p + '/'))) return
    let el = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!el) { el = document.createElement('meta'); el.name = 'robots'; document.head.appendChild(el) }
    el.content = 'noindex, nofollow'
    return () => { el.remove() }
  }, [pathname])
  return null
}

export default function App() {
  return (
    // reducedMotion="user" : respecte la préférence « réduire les animations » du système
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AuthProvider>
          <ScrollToHash />
          <PrivateNoIndex />
          <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            {/* Les chemins statiques ci-dessous doivent rester synchronisés avec la liste
                des slugs réservés (contrainte weddings_slug_not_reserved). */}
            <Route path="/" element={<HomePage />} />
            <Route path="/connexion" element={<LoginPage />} />
            <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
            <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
            <Route path="/acces-refuse" element={<AccessDeniedPage />} />
            <Route path="/mentions-legales" element={<LegalPage page="mentions-legales" />} />
            <Route path="/confidentialite" element={<LegalPage page="confidentialite" />} />
            <Route path="/cgu" element={<LegalPage page="cgu" />} />

            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="mariages" element={<AdminWeddingsPage />} />
                <Route path="utilisateurs" element={<AdminUsersPage />} />
                <Route path="messages" element={<AdminMessagesPage />} />
                <Route path="journal" element={<AdminAuditPage />} />
                <Route path="parametres" element={<AdminSettingsPage />} />
                <Route path="mariages/:id" element={<AdminWeddingScope />}>
                  <Route index element={<AdminWeddingDetailPage />} />
                  <Route path="personnalisation" element={<CustomizePage />} />
                  <Route path="histoire" element={<StoryPage />} />
                  <Route path="programme" element={<ProgramPage />} />
                  <Route path="galerie" element={<GalleryPage />} />
                  <Route path="invites" element={<GuestsPage />} />
                  <Route path="tables" element={<TablesPage />} />
                  <Route path="rsvp" element={<RsvpPage />} />
                  <Route path="statistiques" element={<StatsPage />} />
                  <Route path="livre-d-or" element={<GuestbookPage />} />
                  <Route path="cadeaux" element={<GiftsPage />} />
                </Route>
              </Route>
            </Route>
            <Route element={<ProtectedRoute roles={['couple']} />}>
              <Route path="/couple" element={<CoupleLayout />}>
                <Route index element={<CoupleOverviewPage />} />
                <Route path="personnalisation" element={<CustomizePage />} />
                <Route path="histoire" element={<StoryPage />} />
                <Route path="programme" element={<ProgramPage />} />
                <Route path="galerie" element={<GalleryPage />} />
                <Route path="invites" element={<GuestsPage />} />
                <Route path="tables" element={<TablesPage />} />
                <Route path="rsvp" element={<RsvpPage />} />
                <Route path="statistiques" element={<StatsPage />} />
                  <Route path="livre-d-or" element={<GuestbookPage />} />
                  <Route path="cadeaux" element={<GiftsPage />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute roles={['hostess']} />}>
              <Route path="/hotesse" element={<HostessHomePage />} />
              <Route path="/hotesse/:id" element={<HostessCheckInPage />} />
            </Route>

            <Route path="/exemples/mariage" element={<ExamplePage />} />
            <Route path="/acces/:token" element={<AccessLandingPage />} />

            {/* Sites publics des mariages : /:slug */}
            <Route path="/:slug" element={<WeddingSitePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  )
}
