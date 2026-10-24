import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { TextField } from '@/components/ui/Field'
import { useAuth } from '@/features/auth/AuthProvider'
import { ROLE_HOME } from '@/lib/roles'
import { loginSchema, type LoginValues } from '@/lib/schemas'
import { isSupabaseConfigured } from '@/lib/supabase'
import { signInWithPassword } from '@/services/auth'

export default function LoginPage() {
  const { status, profile } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    document.title = 'Connexion — MariamCM'
  }, [])

  if (status === 'ready' && profile) return <Navigate to={ROLE_HOME[profile.role]} replace />

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await signInWithPassword(values.email, values.password)
      // La redirection se fait via l'état d'authentification, selon le rôle lu en base.
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Connexion impossible.')
    }
  })

  return (
    <AuthLayout title="Connexion" subtitle="Accédez à votre espace MariamCM.">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {status === 'disabled' && <Alert>Ce compte a été désactivé. Contactez l’équipe MariamCM.</Alert>}
        {formError && <Alert>{formError}</Alert>}
        <TextField
          label="Adresse e-mail"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full" loading={isSubmitting} disabled={!isSupabaseConfigured}>
          Se connecter
        </Button>
        <p className="text-center text-sm">
          <Link to="/mot-de-passe-oublie" className="text-forest underline-offset-4 hover:underline">
            Mot de passe oublié ?
          </Link>
        </p>
      </form>
      <p className="mt-6 border-t border-forest/10 pt-5 text-center text-xs text-ink-soft">
        Les comptes sont créés par l’équipe MariamCM. Il n’existe pas d’inscription publique.
      </p>
    </AuthLayout>
  )
}
