import type { ReactNode } from 'react'

type AcquaintancesViewProps = {
  children: ReactNode
}

export function AcquaintancesView({ children }: AcquaintancesViewProps) {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-5 sm:gap-8">
      <div className="flex items-center justify-between mb-0 sm:mb-2">
        <div>
          <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-on-surface">Acquaintances</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Find people by username, manage requests, and build your network.
          </p>
        </div>
      </div>
      {children}
    </div>
  )
}
