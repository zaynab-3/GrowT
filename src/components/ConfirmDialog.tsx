import { createPortal } from 'react-dom'

type ConfirmDialogProps = {
  cancelLabel?: string
  confirmLabel?: string
  isBusy?: boolean
  message: string
  onCancel: () => void
  onConfirm: () => void
  title: string
}

export function ConfirmDialog({
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  isBusy = false,
  message,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="confirm-overlay" role="presentation">
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-dialog__actions">
          <button className="btn btn--secondary" disabled={isBusy} onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button className="btn btn--danger" disabled={isBusy} onClick={onConfirm} type="button">
            {isBusy ? 'Working' : confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body
  )
}
