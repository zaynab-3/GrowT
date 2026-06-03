type TopbarProps = {
  accountLabel: string
  onSignOut: () => void
}

export function Topbar({ accountLabel, onSignOut }: TopbarProps) {
  return (
    <header className="topbar">
      <a className="brand" href="#session" aria-label="GrowT live session">
        <span className="brand-mark">GT</span>
        <span>GrowT</span>
      </a>
      <div className="account-actions">
        <span>{accountLabel}</span>
        <button className="button button--secondary" onClick={onSignOut} type="button">
          Sign out
        </button>
      </div>
    </header>
  )
}
