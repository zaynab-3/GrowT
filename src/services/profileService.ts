import {
  ensureProfile as ensureProfileWithClient,
  listProfiles as listProfilesWithClient,
  resolveLoginEmail as resolveLoginEmailWithClient,
  updateProfile as updateProfileWithClient,
} from '../lib/growtData'
import type { AvatarChoice, ColorPalette, ThemeMode } from '../lib/database.types'
import { getSupabaseClient } from './clientService'

export function ensureProfile(userId: string, displayName: string | null, username?: string | null) {
  return ensureProfileWithClient(getSupabaseClient(), userId, displayName, username)
}

export function updateProfile(
  userId: string,
  profile: {
    avatarChoice: AvatarChoice
    colorPalette: ColorPalette
    displayName: string | null
    themeMode: ThemeMode
    username: string | null
  },
) {
  return updateProfileWithClient(getSupabaseClient(), userId, profile)
}

export function resolveLoginEmail(identifier: string) {
  return resolveLoginEmailWithClient(getSupabaseClient(), identifier)
}

export function listProfiles(userIds: string[]) {
  return listProfilesWithClient(getSupabaseClient(), userIds)
}
