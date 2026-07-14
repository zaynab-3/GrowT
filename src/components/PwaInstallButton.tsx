import { Download } from 'lucide-react'
import { usePwaInstall } from '../hooks/usePwaInstall'

type PwaInstallButtonProps = {
  variant?: 'auth' | 'landing' | 'topbar'
}

export function PwaInstallButton({ variant = 'topbar' }: PwaInstallButtonProps) {
  const { isInstalled, requestInstall } = usePwaInstall()

  if (isInstalled) {
    return null
  }

  return (
    <button
      aria-label="Install GrowT on this device"
      className={`pwa-install-button pwa-install-button--${variant}`}
      onClick={() => void requestInstall()}
      title="Install GrowT"
      type="button"
    >
      <Download aria-hidden="true" size={16} strokeWidth={2.3} />
      <span>Install</span>
    </button>
  )
}
