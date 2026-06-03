import type { Database } from '../../lib/database.types'
import type { GrowTClient } from '../../lib/growtData'
import {
  acceptAcquaintanceRequest,
  cancelAcquaintanceRequest,
  listAcquaintances,
  rejectAcquaintanceRequest,
  sendAcquaintanceRequest,
} from '../acquaintances/acquaintanceApi'

export type MemberPickerProfile =
  Database['public']['Functions']['search_profiles_with_relationship']['Returns'][number]
export type MemberPickerAcquaintance =
  Database['public']['Functions']['list_acquaintances']['Returns'][number]

export {
  acceptAcquaintanceRequest,
  cancelAcquaintanceRequest,
  listAcquaintances,
  rejectAcquaintanceRequest,
  sendAcquaintanceRequest,
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
