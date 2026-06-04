import { useState } from 'react'
import { NotificationPanel } from './NotificationPanel'
import { useNotifications } from './useNotifications'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { isBusy, markAllRead, markRead, message, notifications, unreadCount } = useNotifications()

  return (
    <div className="notification-bell">
      <button
        className="notification-bell__button"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
        aria-expanded={isOpen}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
          <path
            d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h20l-2-2ZM9 20h6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        {unreadCount ? <span className="notification-bell__count">{unreadCount}</span> : null}
      </button>

      {isOpen ? (
        <NotificationPanel
          isBusy={isBusy}
          notifications={notifications}
          onMarkAllRead={() => void markAllRead()}
          onMarkRead={(notificationId) => void markRead(notificationId)}
          unreadCount={unreadCount}
        />
      ) : null}

      {message ? <p className="notification-bell__message">{message}</p> : null}
    </div>
  )
}
