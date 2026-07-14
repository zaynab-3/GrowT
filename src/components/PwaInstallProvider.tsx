import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PwaInstallContext, type PwaInstallGuide } from '../hooks/usePwaInstall'
import { PwaInstallDialog } from './PwaInstallDialog'
import './PwaInstall.css'

type InstallChoice = {
  outcome: 'accepted' | 'dismissed'
  platform: string
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<InstallChoice>
}

type PwaInstallProviderProps = {
  children: ReactNode
}

function isRunningStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true
}

function getInstallGuide(): PwaInstallGuide {
  const userAgent = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/i.test(userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/i.test(userAgent)
  const isFirefox = /Firefox|FxiOS/i.test(userAgent)
  const isMacOS = /Macintosh|Mac OS X/i.test(userAgent) && !isIOS
  const isSafari = /Safari/i.test(userAgent) && !/Chrome|CriOS|Edg|OPR|Vivaldi|FxiOS/i.test(userAgent)

  if (isIOS) {
    return {
      intro: 'Install GrowT from your browser share menu.',
      steps: [
        'Tap the Share button in the browser toolbar.',
        'Choose “Add to Home Screen”.',
        'Confirm with “Add”, then open GrowT from its new icon.',
      ],
    }
  }

  if (isMacOS && isSafari) {
    return {
      intro: 'Safari installs web apps from its File menu.',
      steps: [
        'Open the File menu at the top of the screen.',
        'Choose “Add to Dock…”.',
        'Confirm the GrowT name and select “Add”.',
      ],
    }
  }

  if (isFirefox && !isAndroid) {
    return {
      intro: 'Firefox desktop does not currently offer native PWA installation.',
      note: 'Open this same GrowT link in Chrome, Edge, Vivaldi, or another Chromium browser to install it as an app.',
      steps: [
        'Copy the current GrowT address.',
        'Open it in a Chromium browser.',
        'Select “Install GrowT” from the address bar or browser menu.',
      ],
    }
  }

  if (isAndroid) {
    return {
      intro: 'Your browser can install GrowT from its main menu.',
      steps: [
        'Open the browser menu (usually the three dots).',
        'Choose “Install app” or “Add to Home screen”.',
        'Confirm, then open GrowT from its new app icon.',
      ],
    }
  }

  return {
    intro: 'Your browser can install GrowT from its address bar or main menu.',
    note: 'If Install is not visible yet, interact with the page and keep it open briefly, then check the menu again.',
    steps: [
      'Open the browser menu (usually the three dots).',
      'Choose “Install GrowT” or “Install app”.',
      'Confirm the installation.',
    ],
  }
}

export function PwaInstallProvider({ children }: PwaInstallProviderProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isRunningStandalone)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const guide = useMemo(() => getInstallGuide(), [])

  useEffect(() => {
    const displayModeQuery = window.matchMedia('(display-mode: standalone)')

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    function handleInstalled() {
      setInstallPrompt(null)
      setIsInstalled(true)
      setIsHelpOpen(false)
    }

    function handleDisplayModeChange() {
      setIsInstalled(isRunningStandalone())
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    displayModeQuery.addEventListener('change', handleDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      displayModeQuery.removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  const requestInstall = useCallback(async () => {
    if (!installPrompt) {
      setIsHelpOpen(true)
      return
    }

    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      setInstallPrompt(null)

      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
      }
    } catch {
      setInstallPrompt(null)
      setIsHelpOpen(true)
    }
  }, [installPrompt])

  const contextValue = useMemo(
    () => ({ isInstalled, requestInstall }),
    [isInstalled, requestInstall],
  )

  return (
    <PwaInstallContext.Provider value={contextValue}>
      {children}
      <PwaInstallDialog guide={guide} isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </PwaInstallContext.Provider>
  )
}
