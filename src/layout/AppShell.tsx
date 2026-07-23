import { type ReactNode, useEffect, useRef } from 'react'
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
  dashboardMode?: boolean
  message: string
  navigationKey: string
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
  dashboardMode = false,
  message,
  navigationKey,
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
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [navigationKey])

  return (
    <main className={`app-shell${dashboardMode ? ' app-shell--dashboard' : ''}`}>
      <NotificationProvider userId={userId}>
        <div className="app-frame">
          {sidebar}
          <section className="app-main" id="main-content">
              <Topbar
                accountAvatarUrl={accountAvatarUrl}
                accountLabel={accountLabel}
                contextLabel={contextLabel}
                dashboardMode={dashboardMode}
                folders={folders}
                tasks={tasks}
                onOpenFolder={onOpenFolder}
                onSearchChange={onSearchChange}
                onNavigate={onNavigate}
                onSignOut={onSignOut}
                searchQuery={searchQuery}
              />
            <div className="app-content" ref={contentRef}>
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
