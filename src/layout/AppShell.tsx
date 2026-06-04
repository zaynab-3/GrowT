import type { ReactNode } from 'react'
import { NotificationProvider } from '../features/notifications/useNotifications'
import { Topbar } from './Topbar'

type AppShellProps = {
  accountLabel: string
  children: ReactNode
  confirmDialog?: ReactNode
  message: string
  onSearchChange: (query: string) => void
  onSignOut: () => void
  searchQuery: string
  sidebar: ReactNode
  userId: string
}

export function AppShell({
  accountLabel,
  children,
  confirmDialog,
  message,
  onSearchChange,
  onSignOut,
  searchQuery,
  sidebar,
  userId,
}: AppShellProps) {
  return (
    <main className="app-shell">
      <NotificationProvider userId={userId}>
        <Topbar
          accountLabel={accountLabel}
          onSearchChange={onSearchChange}
          onSignOut={onSignOut}
          searchQuery={searchQuery}
        />

        <section className="workspace-grid">
          {sidebar}
          <section className="main-panel workspace-stack">{children}</section>
        </section>

        {message ? <p className="toast">{message}</p> : null}
        {confirmDialog}
      </NotificationProvider>
    </main>
  )
}
