import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Profile } from '@/types/domain'

export type AuthStatus =
  | 'loading' // session ou profil en cours de chargement
  | 'signed_out'
  | 'ready' // connecté, profil actif chargé
  | 'disabled' // compte désactivé par un administrateur
  | 'error' // profil introuvable ou erreur réseau

interface AuthContextValue {
  status: AuthStatus
  session: Session | null
  profile: Profile | null
  errorMessage: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(!isSupabaseConfigured)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileState, setProfileState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Mémorise un compte désactivé après la déconnexion forcée, pour afficher le bon message.
  const [wasDisabled, setWasDisabled] = useState(false)

  // 1) Session : persistance et mises à jour (callback strictement synchrone).
  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setSessionLoaded(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setSessionLoaded(true)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id ?? null

  const loadProfile = useCallback(async (id: string) => {
    if (!supabase) return
    setProfileState('loading')
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
    if (error) {
      setErrorMessage('Impossible de charger votre profil. Vérifiez votre connexion puis réessayez.')
      setProfile(null)
      setProfileState('error')
      return
    }
    if (!data) {
      setErrorMessage('Aucun profil n’est associé à ce compte. Contactez un administrateur.')
      setProfile(null)
      setProfileState('error')
      return
    }
    setErrorMessage(null)
    setProfile(data as Profile)
    setProfileState('done')
  }, [])

  // 2) Profil et rôle : toujours lus depuis la base (jamais déduits du client).
  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setProfileState('idle')
      return
    }
    setWasDisabled(false)
    void loadProfile(userId)
  }, [userId, loadProfile])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (userId) await loadProfile(userId)
  }, [userId, loadProfile])

  // Un compte désactivé est déconnecté immédiatement.
  useEffect(() => {
    if (profileState === 'done' && profile && !profile.is_active) {
      setWasDisabled(true)
      void supabase?.auth.signOut()
    }
  }, [profileState, profile])

  const status: AuthStatus = useMemo(() => {
    if (!sessionLoaded) return 'loading'
    if (!session) return wasDisabled ? 'disabled' : 'signed_out'
    if (profileState === 'idle' || profileState === 'loading') return 'loading'
    if (profileState === 'error') return 'error'
    if (profile && !profile.is_active) return 'disabled'
    return 'ready'
  }, [sessionLoaded, session, profileState, profile, wasDisabled])

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, profile, errorMessage, signOut, refreshProfile }),
    [status, session, profile, errorMessage, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>.')
  return ctx
}
