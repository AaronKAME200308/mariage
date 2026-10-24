import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { TextAreaField, TextField } from '@/components/ui/Field'
import { useAsync } from '@/hooks/useAsync'
import { contactSchema, type ContactValues } from '@/lib/schemas'
import { isSupabaseConfigured } from '@/lib/supabase'
import { sendContactMessage } from '@/services/contact'
import { fetchPublicPlatformSettings } from '@/services/platform'

export function ContactSection() {
  const settings = useAsync(fetchPublicPlatformSettings, [])
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await sendContactMessage(values)
      setSent(true)
      reset()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Envoi impossible.')
    }
  })

  const contact = settings.status === 'success' ? settings.data.contact : {}

  return (
    <section id="contact" className="scroll-mt-20 bg-forest px-4 py-24 text-ivory sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-champagne">Contact</p>
          <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">Parlons de votre mariage</h2>
          <p className="mt-4 text-ivory/80">
            Décrivez-nous votre projet : nous vous répondons rapidement pour créer le site de votre mariage.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-ivory/90">
            {contact.email && <li className="flex items-center gap-3"><Mail className="size-4 text-champagne" aria-hidden /><a className="underline-offset-4 hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a></li>}
            {contact.phone && <li className="flex items-center gap-3"><Phone className="size-4 text-champagne" aria-hidden /><a className="underline-offset-4 hover:underline" href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a></li>}
            {contact.address && <li className="flex items-center gap-3"><MapPin className="size-4 text-champagne" aria-hidden />{contact.address}</li>}
          </ul>
        </div>

        <div className="rounded-3xl bg-ivory p-6 text-ink sm:p-8 lg:col-span-3">
          {sent ? (
            <Alert tone="success">Merci ! Votre message a bien été envoyé. Nous revenons vers vous très vite.</Alert>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              {!isSupabaseConfigured && <Alert tone="info">Le formulaire sera actif une fois Supabase configuré.</Alert>}
              {formError && <Alert>{formError}</Alert>}
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label="Nom" autoComplete="name" error={errors.name?.message} {...register('name')} />
                <TextField label="Adresse e-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
              </div>
              <TextField label="Objet (facultatif)" error={errors.subject?.message} {...register('subject')} />
              <TextAreaField label="Message" error={errors.message?.message} {...register('message')} />
              <Button type="submit" loading={isSubmitting} disabled={!isSupabaseConfigured}>
                Envoyer le message
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
