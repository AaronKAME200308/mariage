import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

/** Boîte de dialogue accessible basée sur <dialog> (focus piégé, Échap pour fermer). */
export function Modal({
  open, onClose, title, children, wide,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
      aria-label={title}
      className={`m-auto w-[calc(100%-2rem)] ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-3xl border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-forest-900/50`}
    >
      {open && (
        <div className="max-h-[85dvh] overflow-y-auto p-6 sm:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="text-3xl font-semibold text-forest">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Fermer" className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-forest/5">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirmer', danger, busy, onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean; busy?: boolean
  onConfirm: () => void; onCancel: () => void
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-ink-soft">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>Annuler</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
