import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Alert, Spinner } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { getWedding } from '@/services/weddings'
import type { Wedding } from '@/types/domain'

interface WeddingContextValue {
  wedding: Wedding
  reload: () => void
  /** Préfixe des routes : /couple ou /admin/mariages/:id */
  basePath: string
  isAdminScope: boolean
}

const Ctx = createContext<WeddingContextValue | null>(null)

/** Charge un mariage (la RLS garantit que l'utilisateur n'obtient que ceux qu'il gère). */
export function WeddingProvider({
  weddingId, basePath, isAdminScope = false, children,
}: { weddingId: string; basePath: string; isAdminScope?: boolean; children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const state = useAsync(() => getWedding(weddingId), [weddingId, version])
  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const wedding = state.status === 'success' ? state.data : null
  const value = useMemo(
    () => (wedding ? { wedding, reload, basePath, isAdminScope } : null),
    [wedding, reload, basePath, isAdminScope],
  )
  if (state.status === 'loading' && !value) return <Spinner />
  if (state.status === 'error') return <Alert>{state.error.message}</Alert>
  if (!value) return <Alert>Ce mariage est introuvable ou vous n’y avez pas accès.</Alert>
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWedding(): WeddingContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWedding doit être utilisé dans <WeddingProvider>.')
  return ctx
}
