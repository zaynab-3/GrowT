import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { NotificationPanel } from './NotificationPanel'
import { useNotifications } from './useNotifications'
import type { AppView } from '../../views/viewTypes'

type NotificationBellProps = {
  onNavigate?: (view: AppView) => void
}

export function NotificationBell({ onNavigate }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const { isBusy, markAllRead, markRead, message, notifications, unreadCount } = useNotifications()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={bellRef} className="relative flex items-center">
      <button
        className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary/50"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
        aria-expanded={isOpen}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell size={20} />
        {unreadCount ? <span className="absolute top-0 right-0 w-4 h-4 bg-error text-white font-label-md text-[10px] rounded-full flex items-center justify-center border-2 border-surface">{unreadCount}</span> : null}
      </button>

      {isOpen ? (
        <div className="absolute top-full right-0 mt-2 w-[420px] max-w-[calc(100vw-32px)] z-[200] origin-top-right animate-in fade-in slide-in-from-top-4 duration-200 shadow-2xl">
        <NotificationPanel
          isBusy={isBusy}
          notifications={notifications}
          onMarkAllRead={() => void markAllRead()}
          onMarkRead={(notificationId) => void markRead(notificationId)}
          onNotificationClick={(notification) => {
            if (notification.type === 'acquaintance_request' && onNavigate) {
              setIsOpen(false)
              onNavigate('acquaintances')
            }
          }}
          unreadCount={unreadCount}
        />
        </div>
      ) : null}

      {message ? <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded-full font-label-md shadow-lg">{message}</div> : null}
    </div>
  )
}
