import type { ComponentType } from 'react'

/**
 * Découverte automatique des pages écrites à la main : un dossier par mariage,
 * src/weddings/<slug>/index.tsx (le nom du dossier = le slug du mariage).
 * Les dossiers commençant par « _ » (_kit, _modele) sont ignorés.
 */
const modules = import.meta.glob<{ default: ComponentType }>('/src/weddings/*/index.tsx')

const bySlug = new Map<string, () => Promise<{ default: ComponentType }>>()
for (const [path, loader] of Object.entries(modules)) {
  const slug = /\/src\/weddings\/([^/]+)\/index\.tsx$/.exec(path)?.[1]
  if (slug && !slug.startsWith('_')) bySlug.set(slug, loader)
}

export const hasCustomPage = (slug: string) => bySlug.has(slug)
export const loadCustomPage = (slug: string) => bySlug.get(slug)?.()
