import { formatDateTime } from '../../lib/growtDisplay'
import type { GrowTNotification } from './notificationApi'
import { Check, CheckCheck, ArrowRight, BellOff } from 'lucide-react'
import { SwipeActions } from '../../components/SwipeActions'
import { UserAvatar } from '../../components/UserAvatar'

type NotificationPanelProps = {
  className?: string
  isBusy: boolean
  notifications: GrowTNotification[]
  onMarkAllRead: () => void
  onMarkRead: (notificationId: string) => void
  onNotificationClick?: (notification: GrowTNotification) => void
  unreadCount: number
  variant?: 'page' | 'popover'
}

export function NotificationPanel({
  className,
  isBusy,
  notifications,
  onMarkAllRead,
  onMarkRead,
  onNotificationClick,
  unreadCount,
  variant = 'popover',
}: NotificationPanelProps) {
  return (
    <section
      aria-label="Notifications"
      className={`stitch-panel notification-panel notification-panel--${variant}${className ? ` ${className}` : ''}`}
      role={variant === 'popover' ? 'dialog' : 'region'}
    >
      <div className="stitch-panel__header notification-panel__header">
        <h3 className="stitch-panel__title notification-panel__title">
          Notifications
          <span className="stitch-count-badge">{notifications.length}</span>
        </h3>
        <button
          className="notification-panel__mark-all"
          disabled={isBusy || unreadCount === 0}
          onClick={onMarkAllRead}
          type="button"
        >
          Mark all read
        </button>
      </div>

      <div className="stitch-panel__body notification-panel__body">
        <div className="flex flex-col">
          {notifications.map((notification) => {
            const isUnread = !notification.read_at
            const isRequest = notification.type === 'acquaintance_request'
            const content = (
              <>
                <strong className="notification-row__title">{notification.title}</strong>
                <span className="notification-row__message">{notification.message}</span>
                <span className="notification-row__meta">
                  <time dateTime={notification.created_at}>{formatDateTime(notification.created_at)}</time>
                  {isRequest ? (
                    <span className="notification-row__link">
                      View request <ArrowRight size={12} />
                    </span>
                  ) : null}
                </span>
              </>
            )

            return (
              <SwipeActions
                key={notification.id}
                leftAction={
                  isUnread ? (
                    <div className="flex items-center gap-2 font-bold">
                      <Check size={20} /> Mark read
                    </div>
                  ) : undefined
                }
                leftActionCallback={() => isUnread && onMarkRead(notification.id)}
              >
                <div
                  className={`notification-row ${isUnread ? 'notification-row--unread' : 'notification-row--read'}`}
                >
                  {notification.actor ? (
                    <UserAvatar
                      label={notification.actor.display_name ?? notification.actor.username ?? notification.title}
                      avatarChoice={notification.actor.avatar_choice}
                      avatarUrl={notification.actor.avatar_url}
                      className="notification-row__avatar"
                    />
                  ) : (
                    <span aria-hidden="true" className="notification-row__avatar notification-row__avatar--empty" />
                  )}
                  {isRequest ? (
                    <button
                      className="notification-row__content notification-row__content--action"
                      onClick={() => onNotificationClick?.(notification)}
                      type="button"
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="notification-row__content">{content}</div>
                  )}
                  <div className="notification-row__state">
                    {isUnread ? (
                      <button
                        aria-label={`Mark ${notification.title} as read`}
                        className="notification-row__read-button"
                        disabled={isBusy}
                        onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
                        title="Mark as read"
                        type="button"
                      >
                        <Check size={15} />
                      </button>
                    ) : (
                      <span aria-label="Read" className="notification-row__read-state" title="Read">
                        <CheckCheck size={13} />
                      </span>
                    )}
                  </div>
                </div>
              </SwipeActions>
            )
          })}

          {!notifications.length ? (
            <div className="notification-panel__empty">
              <BellOff size={24} />
              <div>
                <strong>All clear</strong>
                <span>No notifications yet.</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
