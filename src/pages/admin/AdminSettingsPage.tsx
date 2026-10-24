import { useEffect, useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Alert, Spinner } from '@/components/ui/Feedback'
import { TextField } from '@/components/ui/Field'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAsync } from '@/hooks/useAsync'
import { loadContactSettings, saveContactSettings } from '@/services/moderation'

const SOCIALS = ['facebook', 'instagram', 'tiktok', 'whatsapp', 'youtube'] as const

function SettingsForm({ initial }: { initial: { contact: Record<string, string>; social: Record<string, string> } }) {
  const { session } = useAuth()
  const [contact, setContact] = useState(initial.contact)
  const [social, setSocial] = useState(initial.social)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!session) return
    const bad = SOCIALS.find((k) => social[k]?.trim() && !/^https:\/\//i.test(social[k].trim()))
    if (bad) { setNotice({ tone: 'error', text: `Le lien ${bad} doit commencer par https://` }); return }
    setBusy(true); setNotice(null)
    try { await saveContactSettings(contact, social, session.user.id); setNotice({ tone: 'success', text: 'Paramètres enregistrés.' }) }
    catch (err) { setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Enregistrement impossible.' }) }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="max-w-xl space-y-5">
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <p className="text-sm text-ink-soft">Ces informations sont publiques : elles s’affichent dans le pied de page et la section contact du site.</p>
      <TextField label="E-mail de contact" type="email" maxLength={254} value={contact.email ?? ''} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
      <TextField label="Téléphone" type="tel" maxLength={30} value={contact.phone ?? ''} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
      <TextField label="Adresse" maxLength={200} value={contact.address ?? ''} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
      <h2 className="pt-2 text-2xl font-semibold text-forest">Réseaux sociaux</h2>
      {SOCIALS.map((k) => (
        <TextField key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} type="url" placeholder="https://…" maxLength={300} value={social[k] ?? ''} onChange={(e) => setSocial({ ...social, [k]: e.target.value })} />
      ))}
      <Button type="submit" loading={busy}>Enregistrer</Button>
    </form>
  )
}

export default function AdminSettingsPage() {
  useEffect(() => { document.title = 'Paramètres — MariamCM' }, [])
  const state = useAsync(loadContactSettings, [])
  return (
    <>
      <PageHeader title="Paramètres" />
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <Alert>{state.error.message}</Alert>}
      {state.status === 'success' && <SettingsForm initial={state.data} />}
    </>
  )
}
