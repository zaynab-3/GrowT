import type { ReactNode } from 'react'
import { UserRoundSearch } from 'lucide-react'

type AcquaintancesViewProps = {
  children: ReactNode
}

export function AcquaintancesView({ children }: AcquaintancesViewProps) {
  return (
    <div className="acquaintances-page growt-page flex-1 w-full max-w-[1320px] mx-auto flex flex-col gap-5 sm:gap-8">
      <div className="gui-page-heading">
        <span className="gui-page-heading__icon"><UserRoundSearch aria-hidden="true" size={22} /></span>
        <h1>Acquaintances</h1>
      </div>
      {children}
    </div>
  )
}
