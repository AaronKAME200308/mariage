import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ExternalLink, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonStyles } from '@/components/ui/Button'
import { Alert, Spinner } from '@/components/ui/Feedback'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { CreateAccountForm } from '@/features/weddings/CreateAccountForm'
import { WeddingForm } from '@/features/weddings/WeddingForm'
import { useAsync } from '@/hooks/useAsync'
import {
  deleteWedding, getWedding, listMemberships, removeMembership, setWeddingStatus, updateWeddingIdentity,
  type MembershipRow,
} from '@/services/weddings'
import type { Wedding, WeddingStatus } from '@/types/domain'
import { hasCustomPage } from '@/weddings/registry'
import { STATUS_LABEL, STATUS_TONE } from './AdminWeddingsPage'

const ROLE_LABEL = { couple: 'Marié(e)', hostess: 'Hôtesse' } as const

interface StatusAction { to: WeddingStatus; label: string; danger?: boolean; confirm?: string }

function actionsFor(status: WeddingStatus): StatusAction[] {
  switch (status) {
    case 'draft': return [{ to: 'published', label: 'Publier le site' }, { to: 'archived', label: 'Archiver', danger: true, confirm: 'Le mariage sera archivé : le site restera hors ligne et les contrôles d’accès seront refusés.' }]
    case 'published': return [{ to: 'unpublished', label: 'Dépublier', danger: true, confirm: 'Le site ne sera plus accessible au public.' }, { to: 'archived', label: 'Archiver', danger: true, confirm: 'Le site sera retiré et les contrôles d’accès seront refusés.' }]
    case 'unpublished': return [{ to: 'published', label: 'Republier le site' }, { to: 'archived', label: 'Archiver', danger: true, confirm: 'Le mariage sera archivé : les contrôles d’accès seront refusés.' }]
    case 'archived': return [{ to: 'draft', label: 'Restaurer en brouillon' }]
  }
}

export default function AdminWeddingDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [reload, setReload] = useState(0)
  const wedding = useAsync(() => getWedding(id), [id, reload])
  const members = useAsync(() => listMemberships(id), [id, reload])
  const [accountOpen, setAccountOpen] = useState(false)
  const [pending, setPending] = useState<StatusAction | null>(null)
  const [removing, setRemoving] = useState<MembershipRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const w: Wedding | null = wedding.status === 'success' ? wedding.data : null
  useEffect(() => { if (w) document.title = `${w.partner_one_name} & ${w.partner_two_name} — MariamCM` }, [w])

  async function run(fn: () => Promise<void>, success: string) {
    setBusy(true); setNotice(null)
    try { await fn(); setNotice({ tone: 'success', text: success }); setReload((n) => n + 1) }
    catch (e) { setNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Action impossible.' }) }
    finally { setBusy(false); setPending(null); setRemoving(null) }
  }

  if (wedding.status === 'loading') return <Spinner />
  if (wedding.status === 'error') return <Alert>{wedding.error.message}</Alert>
  if (!w) return <Alert>Ce mariage est introuvable.</Alert>

  const base = `/admin/mariages/${w.id}`
  return (
    <>
      <PageHeader
        title={`${w.partner_one_name} & ${w.partner_two_name}`}
        description={`mariamcm.com/${w.slug}`}
        actions={<Link to={`/${w.slug}?apercu=1`} target="_blank" className={buttonStyles('secondary', 'sm')}>Prévisualiser <ExternalLink className="size-4" aria-hidden /></Link>}
      />
      {notice && <Alert tone={notice.tone} className="mb-6">{notice.text}</Alert>}

      <div className="space-y-10">
        <section aria-labelledby="statut" className="rounded-2xl border border-forest/10 bg-white p-6">
          <h2 id="statut" className="text-2xl font-semibold text-forest">Publication</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">Statut actuel : <Badge tone={STATUS_TONE[w.status]}>{STATUS_LABEL[w.status]}</Badge></p>
          <div className="mt-4 flex flex-wrap gap-3">
            {actionsFor(w.status).map((a) => (
              <Button key={a.to} variant={a.danger ? 'secondary' : 'primary'} size="sm" disabled={busy}
                onClick={() => a.confirm ? setPending(a) : void run(() => setWeddingStatus(w.id, a.to), 'Statut mis à jour.')}>
                {a.label}
              </Button>
            ))}
          </div>
        </section>

        <section aria-labelledby="infos" className="rounded-2xl border border-forest/10 bg-white p-6">
          <h2 id="infos" className="mb-5 text-2xl font-semibold text-forest">Informations</h2>
          <WeddingForm wedding={w} submitLabel="Enregistrer"
            onSubmit={async (input) => { await updateWeddingIdentity(w.id, input); setNotice({ tone: 'success', text: 'Informations enregistrées.' }); setReload((n) => n + 1) }} />
        </section>

        <section aria-labelledby="page" className="rounded-2xl border border-forest/10 bg-white p-6">
          <h2 id="page" className="text-2xl font-semibold text-forest">Page du site</h2>
          {hasCustomPage(w.slug) ? (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <Badge tone="success">Page écrite à la main détectée</Badge>
              Le site affiche le dossier <code className="rounded bg-ivory-200 px-1.5 py-0.5">src/weddings/{w.slug}/</code>.
            </p>
          ) : (
            <div className="mt-2 text-sm text-ink-soft">
              <p className="flex flex-wrap items-center gap-2"><Badge>Site généré automatiquement</Badge>Aucune page personnalisée pour ce mariage.</p>
              <p className="mt-3">Pour écrire la page vous-même, lancez dans le projet puis redéployez :</p>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-ivory-200 p-3 text-xs text-ink">npm run nouveau-mariage -- {w.slug}</pre>
            </div>
          )}
          <p className="mt-3 text-xs text-ink-soft">Le lien entre la page et ce mariage est le slug <strong>{w.slug}</strong> : le dossier doit porter exactement ce nom. Programme, histoire, galerie, cadeaux, RSVP et livre d’or viennent de la base ; les textes que vous écrivez dans les fichiers font partie du code.</p>
        </section>

        <section aria-labelledby="contenu" className="rounded-2xl border border-forest/10 bg-white p-6">
          <h2 id="contenu" className="text-2xl font-semibold text-forest">Contenu du site</h2>
          <p className="mt-2 text-sm text-ink-soft">Vous pouvez modifier le site à la place des mariés.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to={`${base}/personnalisation`} className={buttonStyles('secondary', 'sm')}>Personnalisation</Link>
            <Link to={`${base}/histoire`} className={buttonStyles('secondary', 'sm')}>Notre histoire</Link>
            <Link to={`${base}/programme`} className={buttonStyles('secondary', 'sm')}>Programme</Link>
            <Link to={`${base}/galerie`} className={buttonStyles('secondary', 'sm')}>Galerie</Link>
          </div>
          <h3 className="mt-6 text-lg font-semibold text-forest">Invités et suivi</h3>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link to={`${base}/invites`} className={buttonStyles('secondary', 'sm')}>Invités</Link>
            <Link to={`${base}/tables`} className={buttonStyles('secondary', 'sm')}>Tables</Link>
            <Link to={`${base}/rsvp`} className={buttonStyles('secondary', 'sm')}>RSVP</Link>
            <Link to={`${base}/statistiques`} className={buttonStyles('secondary', 'sm')}>Statistiques</Link>
            <Link to={`${base}/livre-d-or`} className={buttonStyles('secondary', 'sm')}>Livre d’or</Link>
            <Link to={`${base}/cadeaux`} className={buttonStyles('secondary', 'sm')}>Cadeaux</Link>
          </div>
        </section>

        <section aria-labelledby="acces" className="rounded-2xl border border-forest/10 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="acces" className="text-2xl font-semibold text-forest">Accès au mariage</h2>
            <Button size="sm" onClick={() => setAccountOpen(true)}><UserPlus className="size-4" aria-hidden />Créer un compte</Button>
          </div>
          <div className="mt-4">
            {members.status === 'loading' && <Spinner />}
            {members.status === 'error' && <Alert>{members.error.message}</Alert>}
            {members.status === 'success' && (members.data.length === 0
              ? <p className="text-sm text-ink-soft">Aucun compte rattaché à ce mariage.</p>
              : (
                <ul className="divide-y divide-forest/10">
                  {members.data.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                      <span>
                        <span className="font-medium text-ink">{m.profile?.full_name || 'Sans nom'}</span>{' '}
                        <Badge>{ROLE_LABEL[m.member_role]}</Badge>
                        {m.profile && !m.profile.is_active && <> <Badge tone="danger">Désactivé</Badge></>}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setRemoving(m)}>Retirer l’accès</Button>
                    </li>
                  ))}
                </ul>
              ))}
          </div>
        </section>

        <section aria-labelledby="danger" className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
          <h2 id="danger" className="text-2xl font-semibold text-red-800">Zone sensible</h2>
          <p className="mt-2 text-sm text-red-900/80">La suppression efface définitivement le mariage, ses invités, ses QR codes et son contenu. Préférez l’archivage.</p>
          <Button variant="danger" size="sm" className="mt-4" onClick={() => setDeleting(true)}>Supprimer ce mariage</Button>
        </section>
      </div>

      <Modal open={accountOpen} onClose={() => setAccountOpen(false)} title="Créer un compte">
        <CreateAccountForm weddingId={w.id} onCreated={() => { setAccountOpen(false); setNotice({ tone: 'success', text: 'Compte créé et rattaché au mariage.' }); setReload((n) => n + 1) }} />
      </Modal>
      <ConfirmDialog open={pending !== null} title={pending?.label ?? ''} message={pending?.confirm ?? ''} confirmLabel="Confirmer" danger busy={busy}
        onCancel={() => setPending(null)} onConfirm={() => pending && void run(() => setWeddingStatus(w.id, pending.to), 'Statut mis à jour.')} />
      <ConfirmDialog open={removing !== null} title="Retirer l’accès" busy={busy} danger confirmLabel="Retirer"
        message={`${removing?.profile?.full_name ?? 'Cette personne'} n’aura plus accès à ce mariage. Son compte n’est pas supprimé.`}
        onCancel={() => setRemoving(null)} onConfirm={() => removing && void run(() => removeMembership(removing.id), 'Accès retiré.')} />
      <ConfirmDialog open={deleting} title="Supprimer le mariage" busy={busy} danger confirmLabel="Supprimer définitivement"
        message={`Supprimer « ${w.partner_one_name} & ${w.partner_two_name} » ? Cette action est irréversible.`}
        onCancel={() => setDeleting(false)}
        onConfirm={() => void (async () => { setBusy(true); try { await deleteWedding(w.id); navigate('/admin/mariages') } catch (e) { setNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Suppression impossible.' }); setDeleting(false) } finally { setBusy(false) } })()} />
    </>
  )
}
