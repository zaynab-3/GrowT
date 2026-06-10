import type { Database, MemberRelationshipStatus } from '../../lib/database.types'
import type { GrowTClient } from '../../lib/growtData'
import {
  acceptAcquaintanceRequest,
  cancelAcquaintanceRequest,
  listAcquaintances,
  rejectAcquaintanceRequest,
  sendAcquaintanceRequest,
  type AcquaintanceListItem,
} from '../acquaintances/acquaintanceApi'

export type MemberPickerProfile = Omit<
  Database['public']['Functions']['search_profiles_with_relationship']['Returns'][number],
  'request_id' | 'relationship_status'
> & { request_id: string | null; relationship_status: MemberRelationshipStatus }
export type MemberPickerAcquaintance = AcquaintanceListItem

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

  return data as unknown as MemberPickerProfile[]
}
