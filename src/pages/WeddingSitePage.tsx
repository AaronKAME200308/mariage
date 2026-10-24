import { lazy, Suspense, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { FullPageSpinner } from '@/components/ui/Feedback'
import { SiteView } from '@/features/site/SiteView'
import { useAsync } from '@/hooks/useAsync'
import { applySeo } from '@/lib/seo'
import { publicUrl } from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import { fetchPublicWedding } from '@/services/publicWedding'
import { CustomSiteProvider } from '@/weddings/_kit/context'
import { hasCustomPage, loadCustomPage } from '@/weddings/registry'
import NotFoundPage from './NotFoundPage'

/** Site public d'un mariage, chargé dynamiquement depuis son slug (RPC get_public_wedding). */
export default function WeddingSitePage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const preview = params.get('apercu') === '1'
  // Page écrite à la main pour ce mariage (dossier src/weddings/<slug>/) ? Sinon : site généré.
  const CustomPage = useMemo(
    () => (hasCustomPage(slug) ? lazy(() => loadCustomPage(slug)!) : null),
    [slug],
  )
  const state = useAsync(() => fetchPublicWedding(slug, preview), [slug, preview])

  const wedding = state.status === 'success' ? state.data?.wedding : undefined
  useEffect(() => {
    if (!wedding) return
    const names = `${wedding.partner_one_name} & ${wedding.partner_two_name}`
    const date = formatDate(wedding.wedding_date, wedding.timezone)
    applySeo({
      title: `${names} — Mariage`,
      description: date ? `Rejoignez ${names} pour leur mariage le ${date}.` : `Le site de mariage de ${names}.`,
      image: publicUrl('image', wedding.hero_image_path),
      url: window.location.origin + '/' + wedding.slug,
      noindex: preview || wedding.status !== 'published',
    })
  }, [wedding, preview])

  if (state.status === 'loading') return <FullPageSpinner />
  if (state.status === 'error' || !state.data) {
    return <NotFoundPage title="Site indisponible" text="Ce site de mariage n’existe pas ou n’est pas encore publié." />
  }
  if (CustomPage) {
    return (
      <CustomSiteProvider data={state.data} preview={preview && state.data.wedding.status !== 'published'}>
        <Suspense fallback={<FullPageSpinner />}><CustomPage /></Suspense>
      </CustomSiteProvider>
    )
  }
  // En mode aperçu (brouillon visible par ses gestionnaires) : formulaires désactivés.
  return <SiteView data={state.data} preview={preview && state.data.wedding.status !== 'published'} />
}
