import { LogOut } from 'lucide-react'
import { SproutIcon } from '../components/SproutIcon'
import { NotificationBell } from '../features/notifications/NotificationBell'
import { GlobalSearchDropdown } from '../components/GlobalSearchDropdown'
import { UserAvatar } from '../components/UserAvatar'
import './Layout.css'
import type { AppView } from '../views/viewTypes'
import type { Folder, Task } from '../lib/growtData'

type TopbarProps = {
  accountAvatarUrl?: string | null
  accountLabel: string
  contextLabel?: string
  folders: Folder[]
  tasks: Task[]
  onOpenFolder: (folderId: string) => void
  onSearchChange: (query: string) => void
  onNavigate: (view: AppView) => void
  onSignOut: () => void
  searchQuery: string
}

export function Topbar({ accountAvatarUrl, accountLabel, contextLabel, folders, tasks, onOpenFolder, onSearchChange, onNavigate, onSignOut, searchQuery }: TopbarProps) {
  return (
    <header className="topbar">
      {/* Mobile brand (hidden on desktop via sidebar) */}
      <a className="topbar-brand" href="#main-content" aria-label="GrowT dashboard">
        <span className="brand-mark topbar-brand__mark">
          <SproutIcon size={16} />
        </span>
        <strong className="topbar-brand__name">GrowT</strong>
      </a>

      {contextLabel && (
        <div className="topbar-context">
          {contextLabel}
        </div>
      )}

      <div className="topbar-center">
        <GlobalSearchDropdown folders={folders} tasks={tasks} onOpenFolder={onOpenFolder} onNavigate={onNavigate} value={searchQuery} onChange={onSearchChange} />
      </div>

      <div className="topbar-actions">
        <div className="realtime-indicator" aria-label="Realtime syncing active">
          <span className="realtime-pulse" />
          <span className="realtime-indicator__label">Live</span>
        </div>

        <div className="account-cluster">
          <NotificationBell onNavigate={onNavigate} />

          <span className="account-pill">
            <UserAvatar label={accountLabel} avatarUrl={accountAvatarUrl} className="account-avatar" />
            <span className="account-pill__name">{accountLabel}</span>
          </span>

          <button
            className="btn btn--ghost btn--icon topbar-signout"
            onClick={onSignOut}
            type="button"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
