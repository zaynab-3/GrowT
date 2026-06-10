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
}

export function NotificationPanel({
  className,
  isBusy,
  notifications,
  onMarkAllRead,
  onMarkRead,
  onNotificationClick,
  unreadCount,
}: NotificationPanelProps) {
  return (
    <div className={`stitch-panel${className ? ` ${className}` : ''}`} role="dialog" aria-label="Notifications">
      <div className="stitch-panel__header flex justify-between items-center px-4 py-3 border-b border-surface-variant/50">
        <h3 className="stitch-panel__title m-0 text-sm font-bold uppercase tracking-wider text-primary">Notifications</h3>
        <button
          className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
          disabled={isBusy || unreadCount === 0}
          onClick={onMarkAllRead}
          type="button"
        >
          Mark all read
        </button>
      </div>

      <div className="stitch-panel__body p-0 max-h-[60vh] overflow-y-auto">
        <div className="flex flex-col">
          {notifications.map((notification) => {
            const isUnread = !notification.read_at

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
                  className={`p-4 border-b border-surface-variant/50 flex flex-col sm:flex-row gap-4 transition-colors ${isUnread ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-surface-soft dark:hover:bg-surface-container'}`}
                >
                  {notification.actor ? (
                    <UserAvatar
                      label={notification.actor.display_name ?? notification.actor.username ?? notification.title}
                      avatarChoice={notification.actor.avatar_choice}
                      avatarUrl={notification.actor.avatar_url}
                      className="w-9 h-9 text-xs shrink-0"
                    />
                  ) : null}
                  <div 
                    className={`flex-1 flex flex-col ${notification.type === 'acquaintance_request' ? 'cursor-pointer group' : ''}`}
                    onClick={() => {
                      if (notification.type === 'acquaintance_request') {
                        onNotificationClick?.(notification)
                      }
                    }}
                  >
                    <strong className="text-on-surface text-sm font-bold mb-1">{notification.title}</strong>
                    <span className="text-on-surface-variant text-sm mb-2 leading-relaxed">{notification.message}</span>
                    <small className="text-on-surface-variant/70 text-xs font-medium">{formatDateTime(notification.created_at)}</small>
                    {notification.type === 'acquaintance_request' && (
                      <div className="mt-3 text-xs font-bold text-primary flex items-center gap-1 group-hover:text-primary-container transition-colors">
                        Click to view request <ArrowRight size={14} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-start sm:items-center justify-end min-w-[100px]">
                    {isUnread ? (
                      <button
                        className="btn btn--secondary btn--sm w-full sm:w-auto flex items-center justify-center gap-1"
                        disabled={isBusy}
                        onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
                        type="button"
                      >
                        <Check size={14} />
                        Mark read
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider px-2 py-1 bg-surface-variant/30 rounded-full flex items-center gap-1">
                        <CheckCheck size={14} />
                        Read
                      </span>
                    )}
                  </div>
                </div>
              </SwipeActions>
            )
          })}

          {!notifications.length ? <div className="p-8 text-center text-on-surface-variant font-medium text-sm flex flex-col items-center gap-2">
            <BellOff size={32} className="opacity-20" />
            No notifications yet.
          </div> : null}
        </div>
      </div>
    </div>
  )
}
