import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import { FONT_OPTIONS, parseContent, parseSettings, parseTheme, type SiteContent, type SiteSettings, type SiteTheme } from '@/lib/siteConfig'
import type { PublicWedding } from '@/types/domain'

export interface SiteContextValue {
  /** Données publiques complètes : mariage, programme, histoire, galerie, cadeaux, livre d'or. */
  data: PublicWedding
  wedding: PublicWedding['wedding']
  /** « Prénom & Prénom » */
  names: string
  theme: SiteTheme
  /** Textes saisis dans « Personnalisation » (vous pouvez les ignorer et écrire les vôtres). */
  content: SiteContent
  settings: SiteSettings
  /** true : aperçu d'un brouillon, les formulaires sont désactivés. */
  preview: boolean
}

const Ctx = createContext<SiteContextValue | null>(null)

/** Fournit les données du mariage aux fichiers de section et applique les variables de couleur. */
export function CustomSiteProvider({ data, preview, children }: { data: PublicWedding; preview: boolean; children: ReactNode }) {
  const { wedding } = data
  const theme = parseTheme(wedding.theme)
  const value: SiteContextValue = {
    data, wedding, preview, theme,
    names: `${wedding.partner_one_name} & ${wedding.partner_two_name}`,
    content: parseContent(wedding.content),
    settings: parseSettings(wedding.settings),
  }
  const font = FONT_OPTIONS.find((f) => f.key === theme.headingFont)!.css
  const style = {
    '--w-primary': theme.primary, '--w-secondary': theme.secondary, '--w-bg': theme.background,
    '--w-accent': theme.accent, '--w-text': theme.text, '--w-heading': font,
  } as CSSProperties
  return <Ctx.Provider value={value}><div className="site-root" style={style}>{children}</div></Ctx.Provider>
}

export function useSite(): SiteContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSite() doit être utilisé dans une page de mariage.')
  return v
}
