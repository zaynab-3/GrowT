import type { Database } from '../../lib/database.types'
import { PROFILE_SUMMARY_SELECT, type GrowTClient, type ProfileSummary } from '../../lib/growtData'

export type GrowTNotification = Database['public']['Tables']['notifications']['Row'] & {
  actor?: ProfileSummary | null
}

async function withActorProfiles(client: GrowTClient, notifications: Database['public']['Tables']['notifications']['Row'][]) {
  const actorIds = Array.from(
    new Set(notifications.map((notification) => notification.actor_id).filter((actorId): actorId is string => Boolean(actorId))),
  )

  if (!actorIds.length) {
    return notifications.map((notification) => ({ ...notification, actor: null }))
  }

  const { data: profiles, error } = await client
    .from('profiles')
    .select(PROFILE_SUMMARY_SELECT)
    .in('id', actorIds)

  if (error) {
    throw error
  }

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))

  return notifications.map((notification) => ({
    ...notification,
    actor: notification.actor_id ? profilesById.get(notification.actor_id) ?? null : null,
  }))
}

export async function listNotifications(client: GrowTClient) {
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) {
    throw error
  }

  return withActorProfiles(client, data)
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

  return data ? (await withActorProfiles(client, [data]))[0] : null
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

  return withActorProfiles(client, data)
}
