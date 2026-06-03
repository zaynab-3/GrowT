import type { Database } from '../../lib/database.types'
import type { GrowTClient } from '../../lib/growtData'

export type GrowTNotification = Database['public']['Tables']['notifications']['Row']

export async function listNotifications(client: GrowTClient) {
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) {
    throw error
  }

  return data
}

export async function markNotificationRead(client: GrowTClient, notificationId: string) {
  const { data, error } = await client
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('read_at', null)
    .select('*')
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function markAllNotificationsRead(client: GrowTClient) {
  const { data, error } = await client
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
    .select('*')

  if (error) {
    throw error
  }

  return data
}
