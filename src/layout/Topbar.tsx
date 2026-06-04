import { NotificationBell } from '../features/notifications/NotificationBell'
import { SearchBar } from '../features/search/SearchBar'

type TopbarProps = {
  accountLabel: string
  onSearchChange: (query: string) => void
  onSignOut: () => void
  searchQuery: string
}

export function Topbar({ accountLabel, onSearchChange, onSignOut, searchQuery }: TopbarProps) {
  return (
    <header className="topbar">
      <a className="brand" href="#session" aria-label="GrowT live session">
        <span className="brand-mark">GT</span>
        <span>GrowT</span>
      </a>
      <SearchBar onChange={onSearchChange} value={searchQuery} />
      <div className="account-actions">
        <span>{accountLabel}</span>
        <NotificationBell />
        <button className="button button--secondary" onClick={onSignOut} type="button">
          Sign out
        </button>
      </div>
    </header>
  )
}
