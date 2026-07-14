import { createContext, useContext } from 'react'

export type PwaInstallGuide = {
  intro: string
  note?: string
  steps: string[]
}

export type PwaInstallContextValue = {
  isInstalled: boolean
  requestInstall: () => Promise<void>
}

export const PwaInstallContext = createContext<PwaInstallContextValue | null>(null)

export function usePwaInstall() {
  const context = useContext(PwaInstallContext)

  if (!context) {
    throw new Error('usePwaInstall must be used within PwaInstallProvider')
  }

  return context
}
