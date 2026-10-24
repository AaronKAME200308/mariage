import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { SelectField, TextField } from '@/components/ui/Field'
import { normalizeSlug, suggestSlug } from '@/lib/slug'
import { isoToLocalInput, localInputToIso, TIMEZONES } from '@/lib/time'
import type { Wedding } from '@/types/domain'
import type { WeddingInput } from '@/services/weddings'

const schema = z.object({
  partner_one_name: z.string().trim().min(1, 'Indiquez le prénom.').max(80),
  partner_two_name: z.string().trim().min(1, 'Indiquez le prénom.').max(80),
  slug: z.string().trim().min(3, 'Au moins 3 caractères.').max(60, 'Au plus 60 caractères.')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Lettres minuscules, chiffres et tirets uniquement.'),
  timezone: z.string().min(1),
  date: z.string().optional(),
})
type Values = z.infer<typeof schema>

export function WeddingForm({
  wedding, submitLabel, onSubmit,
}: { wedding?: Wedding; submitLabel: string; onSubmit: (input: WeddingInput) => Promise<void> }) {
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(Boolean(wedding))
  const tz = wedding?.timezone ?? 'Africa/Douala'
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      partner_one_name: wedding?.partner_one_name ?? '',
      partner_two_name: wedding?.partner_two_name ?? '',
      slug: wedding?.slug ?? '',
      timezone: tz,
      date: isoToLocalInput(wedding?.wedding_date, tz),
    },
  })
  const slug = watch('slug')
  const names = { a: watch('partner_one_name'), b: watch('partner_two_name') }
  const timezone = watch('timezone')

  const submit = handleSubmit(async (v) => {
    setError(null)
    try {
      await onSubmit({
        slug: v.slug, partner_one_name: v.partner_one_name, partner_two_name: v.partner_two_name,
        timezone: v.timezone, wedding_date: v.date ? localInputToIso(v.date, v.timezone) : null,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible.')
    }
  })

  const onNameChange = () => {
    if (!slugTouched) setValue('slug', suggestSlug(names.a, names.b))
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Prénom du premier marié" error={errors.partner_one_name?.message}
          {...register('partner_one_name', { onChange: onNameChange })} />
        <TextField label="Prénom du second marié" error={errors.partner_two_name?.message}
          {...register('partner_two_name', { onChange: onNameChange })} />
      </div>
      <TextField
        label="Adresse du site (slug)"
        hint={`mariamcm.com/${slug || 'amelieetyoan'}`}
        error={errors.slug?.message}
        {...register('slug', { onChange: (e) => { setSlugTouched(true); e.target.value = normalizeSlug(e.target.value) } })}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Date et heure du mariage" type="datetime-local" hint={`Heure locale (${timezone})`} {...register('date')} />
        <SelectField label="Fuseau horaire" {...register('timezone')}>
          {TIMEZONES.map((z) => <option key={z} value={z}>{z}</option>)}
        </SelectField>
      </div>
      <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
    </form>
  )
}
