import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Alert, Spinner } from '@/components/ui/Feedback'
import { TextField } from '@/components/ui/Field'
import { useAuth } from '@/features/auth/AuthProvider'
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/schemas'
import { updatePassword } from '@/services/auth'

export default function ResetPasswordPage() {
  const { status, session } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) })

  useEffect(() => {
    document.title = 'Nouveau mot de passe — MariamCM'
  }, [])

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/', { replace: true }), 1500)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Modification impossible.')
    }
  })

  return (
    <AuthLayout title="Nouveau mot de passe" subtitle="Choisissez un mot de passe d’au moins 10 caractères.">
      {status === 'loading' && !session ? (
        <Spinner />
      ) : !session ? (
        <>
          <Alert>Ce lien est invalide ou a expiré. Demandez-en un nouveau.</Alert>
          <p className="mt-6 text-center text-sm">
            <Link to="/mot-de-passe-oublie" className="text-forest underline-offset-4 hover:underline">
              Recevoir un nouveau lien
            </Link>
          </p>
        </>
      ) : done ? (
        <Alert tone="success">Votre mot de passe a été modifié. Redirection en cours…</Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {formError && <Alert>{formError}</Alert>}
          <TextField label="Nouveau mot de passe" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
          <TextField label="Confirmer le mot de passe" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Enregistrer
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
