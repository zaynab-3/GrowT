import { type ReactNode } from 'react'
import './Layout.css'
import { NotificationProvider } from '../features/notifications/useNotifications'
import { Topbar } from './Topbar'
import type { AppView } from '../views/viewTypes'
import type { Folder, Task } from '../lib/growtData'

type AppShellProps = {
  accountAvatarUrl?: string | null
  accountLabel: string
  children: ReactNode
  confirmDialog?: ReactNode
  contextLabel?: string
  message: string
  folders: Folder[]
  tasks: Task[]
  onOpenFolder: (folderId: string) => void
  onSearchChange: (query: string) => void
  onNavigate: (view: AppView) => void
  onSignOut: () => void
  searchQuery: string
  sidebar: ReactNode
  userId: string
}

export function AppShell({
  accountAvatarUrl,
  accountLabel,
  children,
  contextLabel,
  confirmDialog,
  message,
  folders,
  tasks,
  onOpenFolder,
  onSearchChange,
  onNavigate,
  onSignOut,
  searchQuery,
  sidebar,
  userId,
}: AppShellProps) {
  return (
    <main className="app-shell">
      <NotificationProvider userId={userId}>
        <div className="app-frame">
          {sidebar}
          <section className="app-main" id="main-content">
              <Topbar
                accountAvatarUrl={accountAvatarUrl}
                accountLabel={accountLabel}
                contextLabel={contextLabel}
                folders={folders}
                tasks={tasks}
                onOpenFolder={onOpenFolder}
                onSearchChange={onSearchChange}
                onNavigate={onNavigate}
                onSignOut={onSignOut}
                searchQuery={searchQuery}
              />
            <div className="app-content">
              <div className="app-canvas">{children}</div>
            </div>
          </section>
        </div>

        {message ? <p className="toast" role="status">{message}</p> : null}
        {confirmDialog}
      </NotificationProvider>
    </main>
  )
}
