import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { SelectField, TextField } from '@/components/ui/Field'
import { createAccount } from '@/services/accounts'

const schema = z.object({
  full_name: z.string().trim().min(1, 'Indiquez le nom.').max(120),
  email: z.email('Adresse e-mail invalide.'),
  role: z.enum(['couple', 'hostess']),
  password: z.string().min(10, 'Au moins 10 caractères.').max(72),
})
type Values = z.infer<typeof schema>

export function CreateAccountForm({ weddingId, onCreated }: { weddingId: string; onCreated: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema), defaultValues: { role: 'couple' },
  })
  const submit = handleSubmit(async (v) => {
    setError(null)
    try {
      await createAccount({ ...v, wedding_id: weddingId })
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Création impossible.')
    }
  })
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <Alert>{error}</Alert>}
      <SelectField label="Rôle" {...register('role')}>
        <option value="couple">Marié(e)</option>
        <option value="hostess">Hôtesse</option>
      </SelectField>
      <TextField label="Nom complet" autoComplete="off" error={errors.full_name?.message} {...register('full_name')} />
      <TextField label="Adresse e-mail" type="email" autoComplete="off" error={errors.email?.message} {...register('email')} />
      <TextField label="Mot de passe provisoire" type="text" autoComplete="off"
        hint="À communiquer à la personne, qui pourra le changer via « Mot de passe oublié »."
        error={errors.password?.message} {...register('password')} />
      <Button type="submit" loading={isSubmitting} className="w-full">Créer le compte</Button>
    </form>
  )
}
