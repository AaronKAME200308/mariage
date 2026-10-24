import { useEffect } from 'react'
import { Footer } from '@/features/marketing/Footer'
import { Navbar } from '@/features/marketing/Navbar'
import { Alert } from '@/components/ui/Feedback'

const PAGES = {
  'mentions-legales': 'Mentions légales',
  confidentialite: 'Politique de confidentialité',
  cgu: 'Conditions d’utilisation',
} as const

export default function LegalPage({ page }: { page: keyof typeof PAGES }) {
  const title = PAGES[page]
  useEffect(() => {
    document.title = `${title} — MariamCM`
  }, [title])
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[60dvh] max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-5xl font-semibold text-forest">{title}</h1>
        <Alert tone="info" className="mt-8">
          Contenu à compléter : ce texte juridique doit être rédigé ou validé par MariamCM (éditeur, hébergeur,
          traitement des données personnelles des invités, durée de conservation, droits des personnes).
        </Alert>
      </main>
      <Footer />
    </>
  )
}
