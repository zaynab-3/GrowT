import type { ReactNode } from 'react'
import { Topbar } from './Topbar'

type AppShellProps = {
  accountLabel: string
  children: ReactNode
  confirmDialog?: ReactNode
  folderCount: number
  heroTitle: string
  message: string
  notificationCount: number
  onSignOut: () => void
  realtimeLabel: string
  sidebar: ReactNode
  taskCount: number
}

export function AppShell({
  accountLabel,
  children,
  confirmDialog,
  folderCount,
  heroTitle,
  message,
  notificationCount,
  onSignOut,
  realtimeLabel,
  sidebar,
  taskCount,
}: AppShellProps) {
  return (
    <main className="app-shell">
      <Topbar accountLabel={accountLabel} onSignOut={onSignOut} />

      <section className="workspace-hero" id="session">
        <div>
          <p className="section-label">Live session</p>
          <h1>{heroTitle}</h1>
          <p className="hero-text">
            Shared task status is written to Supabase and streamed back into this screen through Realtime.
          </p>
        </div>
        <div className="summary-grid">
          <div className="metric">
            <span>Folders</span>
            <strong>{folderCount}</strong>
          </div>
          <div className="metric metric--sky">
            <span>Tasks</span>
            <strong>{taskCount}</strong>
          </div>
          <div className="metric metric--sun">
            <span>Realtime</span>
            <strong>{realtimeLabel}</strong>
          </div>
        </div>
      </section>

      <section className="workspace-grid">
        {sidebar}
        <section className="main-panel workspace-stack">{children}</section>
      </section>

      {message ? <p className="toast">{message}</p> : null}
      {notificationCount ? (
        <p className="notification-badge" aria-live="polite">
          {notificationCount}
        </p>
      ) : null}
      {confirmDialog}
    </main>
  )
}
