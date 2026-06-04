import { formatDateTime } from '../../lib/growtDisplay'
import type { GrowTNotification } from './notificationApi'

type NotificationPanelProps = {
  className?: string
  isBusy: boolean
  notifications: GrowTNotification[]
  onMarkAllRead: () => void
  onMarkRead: (notificationId: string) => void
  unreadCount: number
}

export function NotificationPanel({
  className,
  isBusy,
  notifications,
  onMarkAllRead,
  onMarkRead,
  unreadCount,
}: NotificationPanelProps) {
  return (
    <div className={`notification-panel${className ? ` ${className}` : ''}`} role="dialog" aria-label="Notifications">
      <div className="notification-panel__heading">
        <span className="section-label">Notifications</span>
        <button
          className="chip-button"
          disabled={isBusy || unreadCount === 0}
          onClick={onMarkAllRead}
          type="button"
        >
          Mark all read
        </button>
      </div>

      <div className="notification-list">
        {notifications.map((notification) => {
          const isUnread = !notification.read_at

          return (
            <div
              className={`notification-row${isUnread ? ' notification-row--unread' : ''}`}
              key={notification.id}
            >
              <div>
                <strong>{notification.title}</strong>
                <span>{notification.message}</span>
                <small>{formatDateTime(notification.created_at)}</small>
              </div>
              {isUnread ? (
                <button
                  className="chip-button"
                  disabled={isBusy}
                  onClick={() => onMarkRead(notification.id)}
                  type="button"
                >
                  Mark read
                </button>
              ) : (
                <span className="empty-chip">Read</span>
              )}
            </div>
          )
        })}

        {!notifications.length ? <p className="empty-state">No notifications yet.</p> : null}
      </div>
    </div>
  )
}
