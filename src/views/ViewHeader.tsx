import type { ReactNode } from 'react'

type ViewHeaderProps = {
  actions?: ReactNode
  description: string
  label: string
  title: string
}

export function ViewHeader({ actions, description, label, title }: ViewHeaderProps) {
  return (
    <header className="view-header">
      <div>
        <p className="section-label">{label}</p>
        <h1>{title}</h1>
        <p className="hero-text">{description}</p>
      </div>
      {actions ? <div className="view-header__actions">{actions}</div> : null}
    </header>
  )
}
