import type { ReactNode } from 'react'
import { ViewHeader } from './ViewHeader'

type AcquaintancesViewProps = {
  children: ReactNode
}

export function AcquaintancesView({ children }: AcquaintancesViewProps) {
  return (
    <section className="view-stack view-stack--narrow">
      <ViewHeader
        description="Find people by username, manage incoming and outgoing requests, and keep your GrowT circle ready for sharing."
        label="Acquaintances"
        title="People you work with"
      />
      {children}
    </section>
  )
}
