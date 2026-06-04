import { NotificationPanel } from '../features/notifications/NotificationPanel'
import { useNotifications } from '../features/notifications/useNotifications'
import { ViewHeader } from './ViewHeader'

export function NotificationsView() {
  const {
    isBusy,
    markAllRead,
    markRead,
    message,
    notifications,
    unreadCount,
  } = useNotifications()

  return (
    <section className="view-stack">
      <ViewHeader
        description="Review realtime GrowT updates, mark one notification read, or clear the unread queue."
        label="Notifications"
        title="Inbox"
      />
      <NotificationPanel
        className="notification-panel--page"
        isBusy={isBusy}
        notifications={notifications}
        onMarkAllRead={() => void markAllRead()}
        onMarkRead={(notificationId) => void markRead(notificationId)}
        unreadCount={unreadCount}
      />
      {message ? <p className="notification-bell__message notification-bell__message--page">{message}</p> : null}
    </section>
  )
}
