import type { Database, MemberRelationshipStatus } from '../../lib/database.types'
import { PROFILE_SUMMARY_SELECT, type GrowTClient } from '../../lib/growtData'

export type ProfileSearchResult =
  Database['public']['Functions']['search_profiles_by_username']['Returns'][number]
export type ProfileRelationshipSearchResult = Omit<
  Database['public']['Functions']['search_profiles_with_relationship']['Returns'][number],
  'request_id' | 'relationship_status'
> & { request_id: string | null; relationship_status: MemberRelationshipStatus }
export type AcquaintanceListItem =
  Database['public']['Functions']['list_acquaintances']['Returns'][number] & { avatar_choice?: string | null }
export type AcquaintanceRequestItem =
  Database['public']['Functions']['list_acquaintance_requests']['Returns'][number] & {
    receiver_avatar_choice?: string | null
    sender_avatar_choice?: string | null
  }

export async function searchProfilesByUsername(client: GrowTClient, query: string) {
  const { data, error } = await client.rpc('search_profiles_by_username', {
    query_text: query,
  })

  if (error) {
    throw error
  }

  return data
}

export async function searchProfilesWithRelationship(client: GrowTClient, query: string) {
  const { data, error } = await client.rpc('search_profiles_with_relationship', {
    query_text: query,
  })

  if (error) {
    throw error
  }

  return data as unknown as ProfileRelationshipSearchResult[]
}

export async function sendAcquaintanceRequest(client: GrowTClient, username: string) {
  const { data, error } = await client.rpc('send_acquaintance_request', {
    username,
  })

  if (error) {
    throw error
  }

  return data
}

export async function cancelAcquaintanceRequest(client: GrowTClient, requestId: string) {
  const { data, error } = await client.rpc('cancel_acquaintance_request', {
    request_id: requestId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function acceptAcquaintanceRequest(client: GrowTClient, requestId: string) {
  const { data, error } = await client.rpc('accept_acquaintance_request', {
    request_id: requestId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function rejectAcquaintanceRequest(client: GrowTClient, requestId: string) {
  const { data, error } = await client.rpc('reject_acquaintance_request', {
    request_id: requestId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function removeAcquaintance(client: GrowTClient, userId: string) {
  const { data, error } = await client.rpc('remove_acquaintance', {
    user_id: userId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function listAcquaintances(client: GrowTClient) {
  const { data, error } = await client.rpc('list_acquaintances')

  if (error) {
    throw error
  }

  const userIds = Array.from(new Set(data.map((item) => item.user_id).filter(Boolean)))

  if (!userIds.length) {
    return data as AcquaintanceListItem[]
  }

  const { data: profiles, error: profileError } = await client
    .from('profiles')
    .select(PROFILE_SUMMARY_SELECT)
    .in('id', userIds)

  if (profileError) {
    throw profileError
  }

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))

  return data.map((item) => ({
    ...item,
    avatar_choice: profilesById.get(item.user_id)?.avatar_choice ?? null,
    avatar_url: item.avatar_url ?? profilesById.get(item.user_id)?.avatar_url ?? null,
    display_name: item.display_name ?? profilesById.get(item.user_id)?.display_name ?? null,
    username: item.username ?? profilesById.get(item.user_id)?.username ?? null,
  })) as AcquaintanceListItem[]
}

export async function listAcquaintanceRequests(client: GrowTClient) {
  const { data, error } = await client.rpc('list_acquaintance_requests')

  if (error) {
    throw error
  }

  const userIds = Array.from(
    new Set(data.flatMap((item) => [item.receiver_id, item.sender_id]).filter(Boolean)),
  )

  if (!userIds.length) {
    return data as AcquaintanceRequestItem[]
  }

  const { data: profiles, error: profileError } = await client
    .from('profiles')
    .select(PROFILE_SUMMARY_SELECT)
    .in('id', userIds)

  if (profileError) {
    throw profileError
  }

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))

  return data.map((item) => {
    const receiverProfile = profilesById.get(item.receiver_id)
    const senderProfile = profilesById.get(item.sender_id)

    return {
      ...item,
      receiver_avatar_choice: receiverProfile?.avatar_choice ?? null,
      receiver_avatar_url: item.receiver_avatar_url ?? receiverProfile?.avatar_url ?? null,
      receiver_display_name: item.receiver_display_name ?? receiverProfile?.display_name ?? null,
      receiver_username: item.receiver_username ?? receiverProfile?.username ?? null,
      sender_avatar_choice: senderProfile?.avatar_choice ?? null,
      sender_avatar_url: item.sender_avatar_url ?? senderProfile?.avatar_url ?? null,
      sender_display_name: item.sender_display_name ?? senderProfile?.display_name ?? null,
      sender_username: item.sender_username ?? senderProfile?.username ?? null,
    }
  }) as AcquaintanceRequestItem[]
}
