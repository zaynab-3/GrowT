import { NotificationPanel } from '../features/notifications/NotificationPanel'
import { useNotifications } from '../features/notifications/useNotifications'
import type { AppView } from './viewTypes'

type NotificationsViewProps = {
  onNavigate?: (view: AppView) => void
}

export function NotificationsView({ onNavigate }: NotificationsViewProps) {
  const {
    isBusy,
    markAllRead,
    markRead,
    message,
    notifications,
    unreadCount,
  } = useNotifications()

  const readCount = notifications.length - unreadCount

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-6">
      <div className="workspace-header-compact">
        <span className="page-header__eyebrow" style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>
          Inbox
        </span>
        <h1>Notifications</h1>
        <p className="page-header__desc" style={{ margin: '4px 0 0', color: 'var(--ink-3)', fontSize: '14px' }}>
          Review realtime GrowT updates, mark one notification read, or clear the unread queue.
        </p>
      </div>

      <div className="workspace-layout-cols">
        {/* Left Column: Inbox List */}
        <div className="workspace-main-col">
          <NotificationPanel
            isBusy={isBusy}
            notifications={notifications}
            onMarkAllRead={() => void markAllRead()}
            onMarkRead={(notificationId) => void markRead(notificationId)}
            onNotificationClick={(notification) => {
              if (notification.type === 'acquaintance_request' && onNavigate) {
                onNavigate('acquaintances')
              }
            }}
            unreadCount={unreadCount}
          />
        </div>

        {/* Right Column: Inbox Statistics and Info */}
        <div className="workspace-side-col">
          <div className="workspace-preview-panel">
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>Inbox Stats</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-3)', lineHeight: 1.4 }}>
              Status of your incoming real-time notifications.
            </p>

            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center justify-between p-3 bg-surface-soft dark:bg-surface-container rounded-xl border border-surface-variant/30">
                <span className="flex items-center gap-2 font-medium text-sm text-on-surface">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  Unread
                </span>
                <strong className="text-on-surface text-sm">{unreadCount}</strong>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-soft dark:bg-surface-container rounded-xl border border-surface-variant/30">
                <span className="flex items-center gap-2 font-medium text-sm text-on-surface">
                  <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                  Read
                </span>
                <strong className="text-on-surface text-sm">{readCount}</strong>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                className="w-full bg-primary text-white py-2.5 rounded-xl font-headline-md text-sm shadow-md hover:shadow-primary/20 transition-all mt-2"
                disabled={isBusy}
                onClick={() => void markAllRead()}
                type="button"
              >
                Mark All as Read
              </button>
            )}
          </div>

          <div className="workspace-preview-panel" style={{ background: 'var(--surface-soft)' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>Notification Guide</h3>
            <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12.5px', color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.4 }}>
              <li>
                <strong>Real-time updates:</strong> Notifications are generated instantly when coworkers invite you to folders, assign tasks, or complete work items.
              </li>
              <li>
                <strong>Quick Dismiss:</strong> Click the checkmark icon next to any notification to dismiss it.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {message && (
        <div className="stitch-toast" style={{ marginTop: '24px', padding: '12px 16px', background: 'var(--surface-soft)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--ink)' }}>
          {message}
        </div>
      )}
    </div>
  )
}
