import { createContext, createElement, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type GrowTNotification,
} from './notificationApi'

type NotificationContextValue = {
  isBusy: boolean
  markAllRead: () => Promise<void>
  markRead: (notificationId: string) => Promise<void>
  message: string
  notifications: GrowTNotification[]
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

function useNotificationStore(userId: string | null): NotificationContextValue {
  const [notifications, setNotifications] = useState<GrowTNotification[]>([])
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState('')
  const channelId = useId().replaceAll(':', '')

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  )

  const loadNotificationData = useCallback(async () => {
    if (!supabase || !userId) {
      return
    }

    try {
      const nextNotifications = await listNotifications(supabase)
      setNotifications(nextNotifications)
    } catch (error) {
      console.error('Notifications load failed', error)
      setMessage('Unable to load notifications.')
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      setMessage('')
      return
    }

    void loadNotificationData()
  }, [loadNotificationData, userId])

  useEffect(() => {
    if (!supabase || !userId) {
      return
    }

    const client = supabase
    const channel = client
      .channel(`notifications:${channelId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => void loadNotificationData(),
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [channelId, loadNotificationData, userId])

  const markRead = useCallback(
    async (notificationId: string) => {
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
    },
    [loadNotificationData],
  )

  const markAllRead = useCallback(async () => {
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
  }, [loadNotificationData])

  return {
    isBusy,
    markAllRead,
    markRead,
    message,
    notifications,
    unreadCount,
  }
}

export function NotificationProvider({ children, userId }: { children: ReactNode; userId: string | null }) {
  const value = useNotificationStore(userId)

  return createElement(NotificationContext.Provider, { value }, children)
}

export function useNotifications() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider.')
  }

  return context
}
