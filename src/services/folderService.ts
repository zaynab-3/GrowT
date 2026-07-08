import {
  addFolderMemberByUsername as addFolderMemberByUsernameWithClient,
  createFolder as createFolderWithClient,
  hardDeleteFolder as hardDeleteFolderWithClient,
  listDeletedFolders as listDeletedFoldersWithClient,
  listFolderMembers as listFolderMembersWithClient,
  listFolders as listFoldersWithClient,
  reorderFolder as reorderFolderWithClient,
  restoreFolder as restoreFolderWithClient,
  softDeleteFolder as softDeleteFolderWithClient,
  updateFolder as updateFolderWithClient,
} from '../lib/growtData'
import type { FolderCategory, ReorderDirection } from '../lib/database.types'
import { getSupabaseClient } from './clientService'

export function listFolders() {
  return listFoldersWithClient(getSupabaseClient())
}

export function listDeletedFolders() {
  return listDeletedFoldersWithClient(getSupabaseClient())
}

export function createFolder(
  title: string,
  description: string | null,
  category: FolderCategory,
  containsExportVideos: boolean,
  recipientTaskAmount: number,
) {
  return createFolderWithClient(
    getSupabaseClient(),
    title,
    description,
    category,
    containsExportVideos,
    recipientTaskAmount,
  )
}

export function updateFolder(folder: {
  id: string
  title: string
  description: string | null
  category: FolderCategory
  containsExportVideos: boolean
  dueDate: string | null
  isActive: boolean
  recipientTaskAmount: number
}) {
  return updateFolderWithClient(getSupabaseClient(), folder)
}

export function softDeleteFolder(folderId: string) {
  return softDeleteFolderWithClient(getSupabaseClient(), folderId)
}

export function hardDeleteFolder(folderId: string) {
  return hardDeleteFolderWithClient(getSupabaseClient(), folderId)
}

export function restoreFolder(folderId: string) {
  return restoreFolderWithClient(getSupabaseClient(), folderId)
}

export function reorderFolder(folderId: string, direction: ReorderDirection, scopedFolderIds?: string[]) {
  return reorderFolderWithClient(getSupabaseClient(), folderId, direction, scopedFolderIds)
}

export function listFolderMembers(folderId: string) {
  return listFolderMembersWithClient(getSupabaseClient(), folderId)
}

export function addFolderMemberByUsername(folderId: string, username: string) {
  return addFolderMemberByUsernameWithClient(getSupabaseClient(), folderId, username)
}
