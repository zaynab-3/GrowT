import type { ReactNode } from 'react'

type ViewHeaderProps = {
  actions?: ReactNode
  description: string
  label: string
  title: string
}

export function ViewHeader({ actions, description, label, title }: ViewHeaderProps) {
  return (
    <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <p className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider mb-1">{label}</p>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">{title}</h1>
        <p className="text-on-surface-variant font-body-md mt-1">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  )
}
