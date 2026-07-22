import { NotificationPanel } from '../features/notifications/NotificationPanel'
import { useNotifications } from '../features/notifications/useNotifications'
import type { AppView } from './viewTypes'
import './UtilityViews.css'

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
    <div className="utility-view utility-view--notifications">
      <header className="utility-view__header">
        <span className="utility-view__eyebrow">Inbox</span>
        <div className="utility-view__title-row">
          <h1>Notifications</h1>
          {unreadCount > 0 ? <span className="utility-view__count">{unreadCount} unread</span> : null}
        </div>
        <p>Updates from folders, tasks and people.</p>
      </header>

      <div className="workspace-layout-cols utility-view__layout">
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
            variant="page"
          />
        </div>

        <aside className="workspace-side-col utility-view__side">
          <div className="workspace-preview-panel utility-summary">
            <h3>Inbox</h3>
            <div className="utility-summary__stats">
              <div className="utility-summary__stat">
                <span>
                  <span className="utility-summary__dot utility-summary__dot--primary" />
                  Unread
                </span>
                <strong>{unreadCount}</strong>
              </div>
              <div className="utility-summary__stat">
                <span>
                  <span className="utility-summary__dot" />
                  Read
                </span>
                <strong>{readCount}</strong>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                className="btn btn--primary btn--sm utility-summary__button"
                disabled={isBusy}
                onClick={() => void markAllRead()}
                type="button"
              >
                Mark All as Read
              </button>
            )}
          </div>

          <div className="workspace-preview-panel utility-note">
            <strong>Quick tip</strong>
            <p>Tap the check beside an update—or swipe it—to mark it read.</p>
          </div>
        </aside>
      </div>

      {message && (
        <div className="stitch-toast utility-view__message">
          {message}
        </div>
      )}
    </div>
  )
}
