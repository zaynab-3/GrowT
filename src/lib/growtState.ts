import type { TaskProgressStatus } from './database.types'
import type { Folder, TaskMember, TaskStatusAction } from './growtData'

export type ContributionCounts = Record<TaskProgressStatus, number>

export type StatusContribution = {
  action: TaskStatusAction
  userId: string
}

export type RealtimePayload<T extends { id: string }> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Partial<T>
  old: Partial<T>
}

export function sortByPositionAndCreatedAt<T extends { position: number; created_at: string }>(
  items: T[],
) {
  return [...items].sort((first, second) => {
    if (first.position !== second.position) {
      return first.position - second.position
    }

    return Date.parse(first.created_at) - Date.parse(second.created_at)
  })
}

export function sortFolders(folders: Folder[]) {
  return [...folders].sort((first, second) => {
    if (first.position !== second.position) {
      return first.position - second.position
    }

    return Date.parse(second.updated_at) - Date.parse(first.updated_at)
  })
}

export function sortActions(actions: TaskStatusAction[]) {
  return [...actions].sort((first, second) => {
    return Date.parse(second.created_at) - Date.parse(first.created_at)
  })
}

export function sortTaskMembers(members: TaskMember[]) {
  return [...members].sort((first, second) => {
    if (first.role === 'owner' && second.role !== 'owner') {
      return -1
    }

    if (first.role !== 'owner' && second.role === 'owner') {
      return 1
    }

    return Date.parse(first.created_at) - Date.parse(second.created_at)
  })
}

export function upsertById<T extends { id: string }>(items: T[], nextItem: T) {
  const exists = items.some((item) => item.id === nextItem.id)

  if (!exists) {
    return [nextItem, ...items]
  }

  return items.map((item) => (item.id === nextItem.id ? nextItem : item))
}

export function contributionKey(action: TaskStatusAction) {
  return `${action.task_id}:${action.task_level_id ?? 'root'}:${action.new_status}:${action.user_id}`
}

export function replaceRowsForTasks<T extends { task_id: string }>(
  currentRows: T[],
  taskIds: string[],
  nextRows: T[],
) {
  const taskIdSet = new Set(taskIds)
  return [...currentRows.filter((row) => !taskIdSet.has(row.task_id)), ...nextRows]
}

export function emptyStatusCounts(): ContributionCounts {
  return { ongoing: 0, half_done: 0, completed: 0 }
}

function isValidPassword(password: string) {
  return password.length >= 8 && /[a-z]/i.test(password) && /\d/.test(password)
}

export function getPasswordError(password: string, confirmPassword: string) {
  if (!isValidPassword(password)) {
    return 'Password must be at least 8 characters and include a letter and a number.'
  }

  if (password !== confirmPassword) {
    return 'Passwords must match.'
  }

  return null
}

export function matchesSearch(query: string, values: Array<string | null | undefined>) {
  if (!query) {
    return true
  }

  return values.some((value) => value?.toLowerCase().includes(query))
}
