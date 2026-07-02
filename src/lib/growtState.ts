import type { TaskProgressStatus } from './database.types'
import type { Folder, Task, TaskMember, TaskStatusAction } from './growtData'

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
  return `${action.task_id}:${action.task_level_id ?? 'root'}:${action.user_id}`
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

export type FinalTaskStateCounts = {
  ongoing: number
  half_done: number
  completed: number
  not_started: number
}

export type MemberCountsMap = Map<string, Record<TaskProgressStatus, number>>

export function calculateFolderProgress(
  tasks: Task[],
  contributionsByTask: Map<string, Record<TaskProgressStatus, StatusContribution[]>>
) {
  const finalCounts: FinalTaskStateCounts = {
    ongoing: 0,
    half_done: 0,
    completed: 0,
    not_started: 0,
  }

  tasks.forEach((task) => {
    if (!task.is_active) {
      finalCounts.completed += 1
      return
    }

    const tc = contributionsByTask.get(task.id)
    if (!tc) {
      finalCounts.not_started += 1
      return
    }

    if (tc.completed.length > 0) {
      finalCounts.completed += 1
    } else if (tc.half_done.length > 0) {
      finalCounts.half_done += 1
    } else if (tc.ongoing.length > 0) {
      finalCounts.ongoing += 1
    } else {
      finalCounts.not_started += 1
    }
  })

  const memberCounts: MemberCountsMap = new Map()

  tasks.forEach((task) => {
    const tc = contributionsByTask.get(task.id)
    if (!tc) return

    const stages: TaskProgressStatus[] = ['completed', 'half_done', 'ongoing']
    stages.forEach((stage) => {
      tc[stage].forEach((contrib) => {
        const userId = contrib.userId
        if (!memberCounts.has(userId)) {
          memberCounts.set(userId, { ongoing: 0, half_done: 0, completed: 0 })
        }
        memberCounts.get(userId)![stage] += 1
      })
    })
  })

  return {
    finalCounts,
    memberCounts,
  }
}

export type UserProgressResult = {
  byTaskId: Record<string, TaskProgressStatus | 'not_started'>
  completed: number
  half_done: number
  ongoing: number
  totalTouched: number
}

export function calculateUserProgress(
  tasks: Task[],
  actions: TaskStatusAction[],
  userId: string
): UserProgressResult {
  const byTaskId: Record<string, TaskProgressStatus | 'not_started'> = {}
  const totals = { ongoing: 0, half_done: 0, completed: 0 }
  const taskIdsSet = new Set(tasks.map((t) => t.id))

  // Initialize all tasks as 'not_started'
  tasks.forEach((t) => {
    byTaskId[t.id] = 'not_started'
  })

  // Filter actions for this user and active tasks
  const userActions = actions.filter(
    (action) =>
      !action.is_undone &&
      action.task_level_id === null &&
      action.user_id === userId &&
      taskIdsSet.has(action.task_id)
  )

  // Sort descending by created_at to process the latest action first
  const sortedActions = [...userActions].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
  )

  const seenTasks = new Set<string>()
  for (const action of sortedActions) {
    if (seenTasks.has(action.task_id)) {
      continue
    }
    seenTasks.add(action.task_id)
    byTaskId[action.task_id] = action.new_status

    if (action.new_status === 'ongoing' || action.new_status === 'half_done' || action.new_status === 'completed') {
      totals[action.new_status] += 1
    }
  }

  const totalTouched = totals.ongoing + totals.half_done + totals.completed

  return {
    byTaskId,
    completed: totals.completed,
    half_done: totals.half_done,
    ongoing: totals.ongoing,
    totalTouched,
  }
}
