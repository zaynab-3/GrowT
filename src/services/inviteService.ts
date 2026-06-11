import { acceptInvite as acceptInviteWithClient, createInviteWithUser as createInviteWithUserWithClient } from '../lib/growtData'
import type { InviteResourceType } from '../lib/database.types'
import { getSupabaseClient } from './clientService'

export function createInviteWithUser(resourceType: InviteResourceType, resourceId: string, userId: string) {
  return createInviteWithUserWithClient(getSupabaseClient(), resourceType, resourceId, userId)
}

export function acceptInvite(inviteId: string) {
  return acceptInviteWithClient(getSupabaseClient(), inviteId)
}
