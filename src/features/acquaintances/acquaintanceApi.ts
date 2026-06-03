import type { Database } from '../../lib/database.types'
import type { GrowTClient } from '../../lib/growtData'

export type ProfileSearchResult =
  Database['public']['Functions']['search_profiles_by_username']['Returns'][number]
export type ProfileRelationshipSearchResult =
  Database['public']['Functions']['search_profiles_with_relationship']['Returns'][number]
export type AcquaintanceListItem =
  Database['public']['Functions']['list_acquaintances']['Returns'][number]
export type AcquaintanceRequestItem =
  Database['public']['Functions']['list_acquaintance_requests']['Returns'][number]

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

  return data
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
  const { data, error } = await client.rpc('list_acquaintances', {})

  if (error) {
    throw error
  }

  return data
}

export async function listAcquaintanceRequests(client: GrowTClient) {
  const { data, error } = await client.rpc('list_acquaintance_requests', {})

  if (error) {
    throw error
  }

  return data
}
