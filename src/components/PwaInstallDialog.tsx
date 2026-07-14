import { useEffect, useRef } from 'react'
import { Download, X } from 'lucide-react'
import { GrowTLogo } from './GrowTLogo'
import type { PwaInstallGuide } from '../hooks/usePwaInstall'

type PwaInstallDialogProps = {
  guide: PwaInstallGuide
  isOpen: boolean
  onClose: () => void
}

export function PwaInstallDialog({ guide, isOpen, onClose }: PwaInstallDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="pwa-install-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        aria-labelledby="pwa-install-title"
        aria-modal="true"
        className="pwa-install-dialog"
        role="dialog"
      >
        <button
          aria-label="Close install instructions"
          className="pwa-install-dialog__close"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>

        <div className="pwa-install-dialog__brand" aria-hidden="true">
          <GrowTLogo size={52} />
          <span><Download size={18} strokeWidth={2.4} /></span>
        </div>

        <h2 id="pwa-install-title">Install GrowT</h2>
        <p>{guide.intro}</p>

        <ol className="pwa-install-steps">
          {guide.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>

        {guide.note ? <p className="pwa-install-dialog__note">{guide.note}</p> : null}

        <button className="pwa-install-dialog__done" onClick={onClose} type="button">
          Got it
        </button>
      </section>
    </div>
  )
}
