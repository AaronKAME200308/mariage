import { useEffect } from 'react'
import { ContactSection } from '@/features/marketing/ContactSection'
import { Footer } from '@/features/marketing/Footer'
import { Hero } from '@/features/marketing/Hero'
import { Navbar } from '@/features/marketing/Navbar'
import { Examples, Features, HowItWorks } from '@/features/marketing/Sections'

export default function HomePage() {
  useEffect(() => {
    document.title = 'MariamCM — Sites de mariage et gestion des invités'
  }, [])
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-ivory">
        Aller au contenu
      </a>
      <Navbar />
      <main id="contenu">
        <Hero />
        <Features />
        <HowItWorks />
        <Examples />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
