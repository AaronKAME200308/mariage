import { lazy, Suspense, useEffect, useMemo } from 'react'
import { FullPageSpinner } from '@/components/ui/Feedback'
import { CustomSiteProvider } from '@/weddings/_kit/context'
import { EXAMPLE_SLUG, exampleData } from '@/weddings/exemple'
import { loadCustomPage } from '@/weddings/registry'

/** Vitrine de l'exemple de page (données fictives, formulaires désactivés). Route : /exemples/mariage */
export default function ExamplePage() {
  const data = useMemo(exampleData, [])
  const Page = useMemo(() => lazy(() => loadCustomPage(EXAMPLE_SLUG)!), [])
  useEffect(() => { document.title = 'Exemple de page de mariage — MariamCM' }, [])
  return (
    <CustomSiteProvider data={data} preview>
      <Suspense fallback={<FullPageSpinner />}><Page /></Suspense>
    </CustomSiteProvider>
  )
}
