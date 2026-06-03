import type { FolderCategory, TaskProgressStatus } from './database.types'
import type { Folder } from './growtData'

export const categoryOptions: { id: FolderCategory; label: string }[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'work', label: 'Work' },
  { id: 'shared', label: 'Shared' },
]

export const statusColumns: { id: TaskProgressStatus; label: string }[] = [
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'half_done', label: 'Half Done' },
  { id: 'completed', label: 'Completed' },
]

export function isSharedFolder(folder: Folder) {
  return folder.category === 'shared' || folder.is_shared
}

export function getCategoryLabel(category: FolderCategory) {
  return categoryOptions.find((option) => option.id === category)?.label ?? category
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return 'None'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDateInputValue(value: string | null) {
  if (!value) {
    return ''
  }

  return value.slice(0, 10)
}

export function formatRestoreWindow(value: string | null) {
  if (!value) {
    return 'Restore window unavailable'
  }

  const restoreUntil = new Date(value).getTime() + 7 * 24 * 60 * 60 * 1000
  const remainingMs = restoreUntil - Date.now()

  if (remainingMs <= 0) {
    return 'Restore window expired'
  }

  const totalHours = Math.ceil(remainingMs / (60 * 60 * 1000))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24

  if (days > 0) {
    return `Restorable for ${days}d ${hours}h`
  }

  return `Restorable for ${hours}h`
}

export function normalizeUsername(username: string) {
  const nextUsername = username.trim().replace(/^@/, '').toLowerCase()
  return nextUsername.length ? nextUsername : null
}
