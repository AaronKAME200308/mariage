import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field'
import { RSVP_LABEL } from '@/lib/seats'
import { saveGuest } from '@/services/guests'
import type { Guest, RsvpStatus, TableRow } from '@/types/domain'

const schema = z.object({
  full_name: z.string().trim().min(1, 'Indiquez le nom.').max(120, 'Nom trop long.'),
  phone: z.string().trim().max(30, 'Téléphone trop long.').optional(),
  email: z.union([z.literal(''), z.email('Adresse e-mail invalide.')]).optional(),
  allowed_companions: z.number('Indiquez un nombre.').int().min(0, 'Minimum 0.').max(20, 'Maximum 20.'),
  rsvp_status: z.enum(['pending', 'confirmed', 'declined']),
  confirmed_companions: z.number('Indiquez un nombre.').int().min(0).max(20),
  table_id: z.string().optional(),
  notes: z.string().trim().max(1000, '1 000 caractères maximum.').optional(),
}).refine((v) => v.rsvp_status !== 'confirmed' || v.confirmed_companions <= v.allowed_companions, {
  path: ['confirmed_companions'], message: 'Ne peut pas dépasser le nombre autorisé.',
})
type Values = z.infer<typeof schema>

export function GuestForm({ weddingId, guest, tables, onDone }: { weddingId: string; guest: Guest | null; tables: TableRow[]; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: guest?.full_name ?? '', phone: guest?.phone ?? '', email: guest?.email ?? '',
      allowed_companions: guest?.allowed_companions ?? 0, rsvp_status: guest?.rsvp_status ?? 'pending',
      confirmed_companions: guest?.confirmed_companions ?? 0, table_id: guest?.table_id ?? '', notes: guest?.notes ?? '',
    },
  })
  const status = watch('rsvp_status')

  const submit = handleSubmit(async (v) => {
    setError(null)
    try {
      await saveGuest(weddingId, {
        full_name: v.full_name.replace(/\s+/g, ' '), phone: v.phone || null, email: v.email ? v.email.toLowerCase() : null,
        allowed_companions: v.allowed_companions, rsvp_status: v.rsvp_status as RsvpStatus,
        confirmed_companions: v.rsvp_status === 'confirmed' ? v.confirmed_companions : 0,
        table_id: v.table_id || null, notes: v.notes || null,
      }, guest?.id)
      onDone()
    } catch (e) { setError(e instanceof Error ? e.message : 'Enregistrement impossible.') }
  })

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField label="Nom complet" error={errors.full_name?.message} {...register('full_name')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Téléphone (facultatif)" type="tel" error={errors.phone?.message} {...register('phone')} />
        <TextField label="E-mail (facultatif)" type="email" error={errors.email?.message} {...register('email')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Accompagnants autorisés" type="number" min={0} max={20} error={errors.allowed_companions?.message} {...register('allowed_companions', { valueAsNumber: true })} />
        <SelectField label="Table" {...register('table_id')}>
          <option value="">Aucune table</option>
          {tables.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.capacity} places)</option>)}
        </SelectField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Réponse RSVP" {...register('rsvp_status')}>
          {(Object.keys(RSVP_LABEL) as RsvpStatus[]).map((s) => <option key={s} value={s}>{RSVP_LABEL[s]}</option>)}
        </SelectField>
        {status === 'confirmed' && (
          <TextField label="Accompagnants confirmés" type="number" min={0} max={20} error={errors.confirmed_companions?.message} {...register('confirmed_companions', { valueAsNumber: true })} />
        )}
      </div>
      <TextAreaField label="Notes (facultatif)" className="min-h-20" error={errors.notes?.message} {...register('notes')} />
      <Button type="submit" loading={isSubmitting} className="w-full">Enregistrer</Button>
    </form>
  )
}
