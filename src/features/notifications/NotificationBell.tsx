import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type GrowTNotification,
} from './notificationApi'
import { NotificationPanel } from './NotificationPanel'

export function NotificationBell() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<GrowTNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState('')

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  )

  const loadNotificationData = useCallback(async () => {
    if (!supabase || !currentUserId) {
      return
    }

    try {
      const nextNotifications = await listNotifications(supabase)
      setNotifications(nextNotifications)
    } catch (error) {
      console.error('Notifications load failed', error)
      setMessage('Unable to load notifications.')
    }
  }, [currentUserId])

  useEffect(() => {
    if (!supabase) {
      return
    }

    let isActive = true

    void supabase.auth.getUser().then(({ data }) => {
      if (isActive) {
        setCurrentUserId(data.user?.id ?? null)
      }
    })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    void loadNotificationData()
  }, [loadNotificationData])

  useEffect(() => {
    if (!supabase || !currentUserId) {
      return
    }

    const client = supabase
    const channel = client
      .channel(`notifications:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        () => void loadNotificationData(),
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [currentUserId, loadNotificationData])

  async function handleMarkRead(notificationId: string) {
    if (!supabase) {
      return
    }

    setIsBusy(true)
    setMessage('')

    try {
      const notification = await markNotificationRead(supabase, notificationId)

      setNotifications((current) =>
        current.map((item) => (item.id === notificationId && notification ? notification : item)),
      )
      await loadNotificationData()
    } catch (error) {
      console.error('Notification mark read failed', error)
      setMessage('Unable to mark notification read.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleMarkAllRead() {
    if (!supabase) {
      return
    }

    setIsBusy(true)
    setMessage('')

    try {
      const updatedNotifications = await markAllNotificationsRead(supabase)
      const updatedById = new Map(updatedNotifications.map((notification) => [notification.id, notification]))

      setNotifications((current) =>
        current.map((notification) => updatedById.get(notification.id) ?? notification),
      )
      await loadNotificationData()
    } catch (error) {
      console.error('Notifications mark all read failed', error)
      setMessage('Unable to mark notifications read.')
    } finally {
      setIsBusy(false)
    }
  }

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
          onMarkAllRead={() => void handleMarkAllRead()}
          onMarkRead={(notificationId) => void handleMarkRead(notificationId)}
          unreadCount={unreadCount}
        />
      ) : null}

      {message ? <p className="notification-bell__message">{message}</p> : null}
    </div>
  )
}
