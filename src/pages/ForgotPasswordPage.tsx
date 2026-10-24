import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { TextField } from '@/components/ui/Field'
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/schemas'
import { isSupabaseConfigured } from '@/lib/supabase'
import { requestPasswordReset } from '@/services/auth'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) })

  useEffect(() => {
    document.title = 'Mot de passe oublié — MariamCM'
  }, [])

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Envoi impossible.')
    }
  })

  return (
    <AuthLayout title="Mot de passe oublié" subtitle="Nous vous enverrons un lien pour choisir un nouveau mot de passe.">
      {sent ? (
        <Alert tone="success">
          Si un compte correspond à cette adresse, un e-mail de réinitialisation vient d’être envoyé. Pensez à
          vérifier vos courriers indésirables.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {formError && <Alert>{formError}</Alert>}
          <TextField label="Adresse e-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Button type="submit" className="w-full" loading={isSubmitting} disabled={!isSupabaseConfigured}>
            Envoyer le lien
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to="/connexion" className="text-forest underline-offset-4 hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </AuthLayout>
  )
}
