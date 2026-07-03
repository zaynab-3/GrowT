import {
  addTaskMemberByUsername as addTaskMemberByUsernameWithClient,
  createStandaloneTask as createStandaloneTaskWithClient,
  createTask as createTaskWithClient,
  hardDeleteTask as hardDeleteTaskWithClient,
  listDeletedTasks as listDeletedTasksWithClient,
  listStandaloneTasks as listStandaloneTasksWithClient,
  listTaskActionsForTasks as listTaskActionsForTasksWithClient,
  listTaskLevelsForTasks as listTaskLevelsForTasksWithClient,
  listTaskMembers as listTaskMembersWithClient,
  listTaskProgressForTasks as listTaskProgressForTasksWithClient,
  listTasks as listTasksWithClient,
  reorderTask as reorderTaskWithClient,
  removeTaskMember as removeTaskMemberWithClient,
  restoreTask as restoreTaskWithClient,
  setTaskExported as setTaskExportedWithClient,
  setTaskProgress as setTaskProgressWithClient,
  softDeleteTask as softDeleteTaskWithClient,
  syncTaskLevels as syncTaskLevelsWithClient,
  undoLatestTaskProgress as undoLatestTaskProgressWithClient,
  updateTask as updateTaskWithClient,
} from '../lib/growtData'
import type { FolderCategory, ReorderDirection, TaskProgressStatus } from '../lib/database.types'
import { getSupabaseClient } from './clientService'

export function listTasks(folderId: string) {
  return listTasksWithClient(getSupabaseClient(), folderId)
}

export function listStandaloneTasks() {
  return listStandaloneTasksWithClient(getSupabaseClient())
}

export function listDeletedTasks() {
  return listDeletedTasksWithClient(getSupabaseClient())
}

export function listTaskMembers(taskId: string) {
  return listTaskMembersWithClient(getSupabaseClient(), taskId)
}

export function listTaskLevelsForTasks(taskIds: string[]) {
  return listTaskLevelsForTasksWithClient(getSupabaseClient(), taskIds)
}

export function listTaskProgressForTasks(taskIds: string[]) {
  return listTaskProgressForTasksWithClient(getSupabaseClient(), taskIds)
}

export function listTaskActionsForTasks(taskIds: string[]) {
  return listTaskActionsForTasksWithClient(getSupabaseClient(), taskIds)
}

export function addTaskMemberByUsername(taskId: string, username: string) {
  return addTaskMemberByUsernameWithClient(getSupabaseClient(), taskId, username)
}

export function removeTaskMember(taskId: string, userId: string) {
  return removeTaskMemberWithClient(getSupabaseClient(), taskId, userId)
}

export function createTask(task: {
  folderId: string
  title: string
  description: string | null
  category: FolderCategory | null
  hasExportButton: boolean
}) {
  return createTaskWithClient(getSupabaseClient(), task)
}

export function createStandaloneTask(task: {
  title: string
  description: string | null
  category: FolderCategory
  assignedUserId: string | null
  dueDate: string | null
  hasExportButton: boolean
}) {
  return createStandaloneTaskWithClient(getSupabaseClient(), task)
}

export function updateTask(task: {
  id: string
  title: string
  description: string | null
  category: FolderCategory
  dueDate: string | null
  hasExportButton: boolean
  isActive: boolean
  assignedUserId: string | null
}) {
  return updateTaskWithClient(getSupabaseClient(), task)
}

export function syncTaskLevels(taskId: string, itemTitles: string[]) {
  return syncTaskLevelsWithClient(getSupabaseClient(), taskId, itemTitles)
}

export function softDeleteTask(taskId: string) {
  return softDeleteTaskWithClient(getSupabaseClient(), taskId)
}

export function hardDeleteTask(taskId: string) {
  return hardDeleteTaskWithClient(getSupabaseClient(), taskId)
}

export function restoreTask(taskId: string) {
  return restoreTaskWithClient(getSupabaseClient(), taskId)
}

export function reorderTask(taskId: string, direction: ReorderDirection, scopedTaskIds?: string[]) {
  return reorderTaskWithClient(getSupabaseClient(), taskId, direction, scopedTaskIds)
}

export function setTaskProgress(taskId: string, taskLevelId: string | null, status: TaskProgressStatus) {
  return setTaskProgressWithClient(getSupabaseClient(), taskId, taskLevelId, status)
}

export function setTaskExported(taskId: string, isExported = true) {
  return setTaskExportedWithClient(getSupabaseClient(), taskId, isExported)
}

export function undoLatestTaskProgress(taskId: string, taskLevelId: string | null) {
  return undoLatestTaskProgressWithClient(getSupabaseClient(), taskId, taskLevelId)
}
