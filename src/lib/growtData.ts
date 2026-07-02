import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AvatarChoice,
  ColorPalette,
  Database,
  FolderCategory,
  ThemeMode,
  TaskProgressStatus,
  InviteResourceType,
  ReorderDirection,
} from './database.types'

export type GrowTClient = SupabaseClient<Database>
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileSummary = Pick<Profile, 'avatar_choice' | 'avatar_url' | 'display_name' | 'id' | 'username'>
export type Folder = Database['public']['Tables']['folders']['Row']
export type FolderMember = Database['public']['Tables']['folder_members']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskLevel = Database['public']['Tables']['task_levels']['Row']
export type TaskMember = Database['public']['Tables']['task_members']['Row']
export type TaskProgress = Database['public']['Tables']['task_progress']['Row']
export type TaskStatusAction = Database['public']['Tables']['task_status_actions']['Row']
export type Invite = Database['public']['Tables']['invites']['Row']

export const PROFILE_SUMMARY_SELECT = 'id, username, display_name, avatar_url, avatar_choice'

type FunctionName = keyof Database['public']['Functions']
type FunctionArgs<Name extends FunctionName> = Database['public']['Functions'][Name]['Args']

type PositionedRow = {
  created_at: string
  id: string
  position: number
}

type PositionedUpdate = PositionedRow & {
  nextPosition: number
}

async function getCurrentUserId(client: GrowTClient) {
  const { data, error } = await client.auth.getUser()

  if (error) {
    throw error
  }

  const userId = data.user?.id
  if (!userId) {
    throw new Error('Authentication required.')
  }

  return userId
}

function compareTasksForOrder(first: PositionedRow, second: PositionedRow) {
  if (first.position !== second.position) {
    return first.position - second.position
  }

  const createdAtDiff = Date.parse(first.created_at) - Date.parse(second.created_at)
  if (createdAtDiff !== 0) {
    return createdAtDiff
  }

  return first.id.localeCompare(second.id)
}

function compareFoldersForOrder(
  first: PositionedRow & { updated_at: string },
  second: PositionedRow & { updated_at: string },
) {
  if (first.position !== second.position) {
    return first.position - second.position
  }

  const updatedAtDiff = Date.parse(second.updated_at) - Date.parse(first.updated_at)
  if (updatedAtDiff !== 0) {
    return updatedAtDiff
  }

  const createdAtDiff = Date.parse(first.created_at) - Date.parse(second.created_at)
  if (createdAtDiff !== 0) {
    return createdAtDiff
  }

  return first.id.localeCompare(second.id)
}

function movePositionedRows<T extends PositionedRow>(
  rows: T[],
  rowId: string,
  direction: ReorderDirection,
  compareRows: (first: T, second: T) => number,
  scopedRowIds?: string[],
): PositionedUpdate[] {
  const sortedRows = [...rows].sort(compareRows)
  const scopedIdSet = scopedRowIds?.length ? new Set(scopedRowIds) : null
  const movableRows = scopedIdSet
    ? sortedRows.filter((row) => scopedIdSet.has(row.id))
    : sortedRows
  const currentIndex = movableRows.findIndex((row) => row.id === rowId)
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= movableRows.length) {
    return sortedRows.map((row, index) => ({ ...row, nextPosition: index }))
  }

  const nextMovableRows = [...movableRows]
  const currentRow = nextMovableRows[currentIndex]
  nextMovableRows[currentIndex] = nextMovableRows[targetIndex]
  nextMovableRows[targetIndex] = currentRow

  if (!scopedIdSet) {
    return nextMovableRows.map((row, index) => ({ ...row, nextPosition: index }))
  }

  let movableIndex = 0
  const nextRows = sortedRows.map((row) => {
    if (!scopedIdSet.has(row.id)) {
      return row
    }

    const nextRow = nextMovableRows[movableIndex]
    movableIndex += 1
    return nextRow
  })

  return nextRows.map((row, index) => ({ ...row, nextPosition: index }))
}

async function persistMovedPositions<T extends PositionedRow>(
  client: GrowTClient,
  table: 'folders' | 'tasks',
  nextRows: PositionedUpdate[],
  previousRows: T[],
) {
  const previousPositions = new Map(previousRows.map((row) => [row.id, row.position]))
  const changedRows = nextRows.filter((row) => previousPositions.get(row.id) !== row.nextPosition)

  for (const row of changedRows) {
    const { error } = await client
      .from(table)
      .update({ position: row.nextPosition } as never)
      .eq('id', row.id)

    if (error) {
      throw error
    }
  }
}

export async function ensureProfile(
  client: GrowTClient,
  userId: string,
  displayName: string | null,
  username?: string | null,
) {
  // First, check if the profile already exists (defensive check)
  const { data: existingProfile } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfile) {
    return existingProfile
  }

  // Base username derivation
  let baseUsername = (username || displayName || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
  if (!baseUsername) {
    baseUsername = 'user'
  }

  let attempt = 0
  const maxAttempts = 10
  let currentUsername = baseUsername
  const finalDisplayName = displayName || baseUsername

  while (attempt < maxAttempts) {
    const { data, error } = await client
      .from('profiles')
      .insert({
        id: userId,
        display_name: finalDisplayName,
        username: currentUsername,
      })
      .select('*')
      .maybeSingle()

    if (error) {
      // Postgres unique constraint violation error code is 23505
      if (error.code === '23505') {
        attempt++
        currentUsername = `${baseUsername}${attempt}`
        continue
      }
      throw error
    }

    if (data) {
      return data
    }

    // If data is null and no error, maybe check one more time if it exists now
    const { data: doubleCheck } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (doubleCheck) {
      return doubleCheck
    }

    attempt++
    currentUsername = `${baseUsername}${attempt}`
  }

  // Fallback if all attempts failed: try one last time with random suffix
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const finalUsername = `${baseUsername}_${randomSuffix}`
  const { data, error } = await client
    .from('profiles')
    .insert({
      id: userId,
      display_name: finalDisplayName,
      username: finalUsername,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }
  return data
}

export async function updateProfile(
  client: GrowTClient,
  userId: string,
  profile: {
    avatarChoice: AvatarChoice
    colorPalette: ColorPalette
    displayName: string | null
    themeMode: ThemeMode
    username: string | null
  },
) {
  const { data, error } = await client
    .from('profiles')
    .update({
      avatar_choice: profile.avatarChoice,
      color_palette: profile.colorPalette,
      display_name: profile.displayName,
      theme_mode: profile.themeMode,
      username: profile.username,
    })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function resolveLoginEmail(client: GrowTClient, identifier: string) {
  const { data, error } = await client.rpc('resolve_login_email', {
    identifier,
  })

  if (error) {
    throw error
  }

  return data
}

export async function listProfiles(client: GrowTClient, userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds)).filter(Boolean)

  if (!uniqueIds.length) {
    return []
  }

  const { data, error } = await client
    .from('profiles')
    .select(PROFILE_SUMMARY_SELECT)
    .in('id', uniqueIds)

  if (error) {
    throw error
  }

  return data as ProfileSummary[]
}

export async function listFolders(client: GrowTClient) {
  const { data, error } = await client
    .from('folders')
    .select('*')
    .is('deleted_at', null)
    .order('position', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  // Deduplicate folders in case of any overlap between ownership and membership
  const uniqueFoldersMap = new Map<string, Folder>()
  for (const folder of data) {
    if (!uniqueFoldersMap.has(folder.id)) {
      uniqueFoldersMap.set(folder.id, folder)
    }
  }

  return Array.from(uniqueFoldersMap.values())
}

export async function listDeletedFolders(client: GrowTClient): Promise<Folder[]> {
  const { data, error } = await client.rpc('list_deleted_folders')

  if (error) {
    throw error
  }

  return data as unknown as Folder[]
}

export async function createFolder(
  client: GrowTClient,
  title: string,
  description: string | null,
  category: FolderCategory,
) {
  const { data, error } = await client.rpc('create_folder', {
    title,
    description,
    category,
  } as unknown as FunctionArgs<'create_folder'>)

  if (error) {
    throw error
  }

  return data as unknown as Folder
}

export async function updateFolder(
  client: GrowTClient,
  folder: {
    id: string
    title: string
    description: string | null
    category: FolderCategory
    dueDate: string | null
    isActive: boolean
  },
) {
  const { data, error } = await client.rpc('update_folder', {
    folder_id: folder.id,
    title: folder.title,
    description: folder.description,
    category: folder.category,
    due_date: folder.dueDate,
    is_active: folder.isActive,
  } as unknown as FunctionArgs<'update_folder'>)

  if (error) {
    throw error
  }

  return data as unknown as Folder
}

export async function softDeleteFolder(client: GrowTClient, folderId: string) {
  const { data, error } = await client.rpc('soft_delete_folder', {
    folder_id: folderId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function hardDeleteFolder(client: GrowTClient, folderId: string) {
  const { data, error } = await client.rpc('hard_delete_folder', {
    folder_id: folderId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function restoreFolder(client: GrowTClient, folderId: string) {
  const { data, error } = await client.rpc('restore_folder', {
    folder_id: folderId,
  })

  if (error) {
    throw error
  }

  return data as unknown as Folder
}

export async function reorderFolder(
  client: GrowTClient,
  folderId: string,
  direction: ReorderDirection,
  scopedFolderIds?: string[],
) {
  const userId = await getCurrentUserId(client)
  const { data: folder, error: folderError } = await client
    .from('folders')
    .select('*')
    .eq('id', folderId)
    .is('deleted_at', null)
    .single()

  if (folderError) {
    throw folderError
  }

  if (folder.owner_id !== userId) {
    throw new Error('Only the folder owner can reorder this folder.')
  }

  const { data: rows, error: rowsError } = await client
    .from('folders')
    .select('*')
    .eq('owner_id', userId)
    .is('deleted_at', null)

  if (rowsError) {
    throw rowsError
  }

  await persistMovedPositions(
    client,
    'folders',
    movePositionedRows(rows, folderId, direction, compareFoldersForOrder, scopedFolderIds),
    rows,
  )

  return listFolders(client)
}

export async function listFolderMembers(client: GrowTClient, folderId: string) {
  const { data, error } = await client
    .from('folder_members')
    .select('*')
    .eq('folder_id', folderId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export async function addFolderMemberByUsername(
  client: GrowTClient,
  folderId: string,
  username: string,
) {
  const { data, error } = await client.rpc('add_folder_member', {
    folder_id: folderId,
    username,
  })

  if (error) {
    throw error
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select(PROFILE_SUMMARY_SELECT)
    .eq('id', data.user_id)
    .single()

  if (profileError) {
    throw profileError
  }

  return { member: data, profile }
}

export async function listTasks(client: GrowTClient, folderId: string): Promise<Task[]> {
  const { data, error } = await client.rpc('list_folder_tasks', {
    folder_id: folderId,
  })

  if (error) {
    throw error
  }

  return data as unknown as Task[]
}

export async function listStandaloneTasks(client: GrowTClient): Promise<Task[]> {
  const { data, error } = await client.rpc('list_standalone_tasks')

  if (error) {
    throw error
  }

  return data as unknown as Task[]
}

export async function listTaskMembers(client: GrowTClient, taskId: string) {
  const { data, error } = await client.rpc('list_task_members', {
    task_id: taskId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function listTaskLevelsForTasks(client: GrowTClient, taskIds: string[]) {
  const uniqueTaskIds = Array.from(new Set(taskIds)).filter(Boolean)

  if (!uniqueTaskIds.length) {
    return []
  }

  const { data, error } = await client
    .from('task_levels')
    .select('*')
    .in('task_id', uniqueTaskIds)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export async function syncTaskLevels(
  client: GrowTClient,
  taskId: string,
  itemTitles: string[],
) {
  const nextTitles = itemTitles.map((item) => item.trim()).filter(Boolean)
  const existingLevels = await listTaskLevelsForTasks(client, [taskId])
  const levelsToDelete = existingLevels.slice(nextTitles.length)

  if (levelsToDelete.length) {
    const { error } = await client
      .from('task_levels')
      .delete()
      .in('id', levelsToDelete.map((level) => level.id))

    if (error) {
      throw error
    }
  }

  for (const [index, title] of nextTitles.entries()) {
    const existingLevel = existingLevels[index]

    if (!existingLevel) {
      const { error } = await client
        .from('task_levels')
        .insert({
          task_id: taskId,
          title,
          description: null,
          position: index,
        } as never)

      if (error) {
        throw error
      }

      continue
    }

    if (existingLevel.title !== title || existingLevel.position !== index || existingLevel.description !== null) {
      const { error } = await client
        .from('task_levels')
        .update({
          title,
          description: null,
          position: index,
        } as never)
        .eq('id', existingLevel.id)

      if (error) {
        throw error
      }
    }
  }

  return listTaskLevelsForTasks(client, [taskId])
}

export async function addTaskMemberByUsername(
  client: GrowTClient,
  taskId: string,
  username: string,
) {
  const { data, error } = await client.rpc('add_task_member', {
    task_id: taskId,
    username,
  })

  if (error) {
    throw error
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select(PROFILE_SUMMARY_SELECT)
    .eq('id', data.user_id)
    .single()

  if (profileError) {
    throw profileError
  }

  return { member: data, profile }
}

export async function removeTaskMember(
  client: GrowTClient,
  taskId: string,
  userId: string,
) {
  const { data, error } = await client.rpc('remove_task_member', {
    task_id: taskId,
    user_id: userId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function createTask(
  client: GrowTClient,
  task: {
    folderId: string
    title: string
    description: string | null
    category: FolderCategory | null
  },
) {
  const { data, error } = await client.rpc('create_task', {
    folder_id: task.folderId,
    title: task.title,
    description: task.description,
    category: task.category,
    assigned_user_id: null,
    due_date: null,
  } as unknown as FunctionArgs<'create_task'>)

  if (error) {
    throw error
  }

  return data as unknown as Task
}

export async function createStandaloneTask(
  client: GrowTClient,
  task: {
    title: string
    description: string | null
    category: FolderCategory
    assignedUserId: string | null
    dueDate: string | null
  },
) {
  const { data, error } = await client.rpc('create_standalone_task', {
    title: task.title,
    description: task.description,
    category: task.category,
    assigned_user_id: task.assignedUserId,
    due_date: task.dueDate,
  } as unknown as FunctionArgs<'create_standalone_task'>)

  if (error) {
    throw error
  }

  return data as unknown as Task
}

export async function updateTask(
  client: GrowTClient,
  task: {
    id: string
    title: string
    description: string | null
    category: FolderCategory
    dueDate: string | null
    isActive: boolean
    assignedUserId: string | null
  },
) {
  const { data, error } = await client.rpc('update_task', {
    task_id: task.id,
    title: task.title,
    description: task.description,
    category: task.category,
    due_date: task.dueDate,
    is_active: task.isActive,
    assigned_user_id: task.assignedUserId,
  } as unknown as FunctionArgs<'update_task'>)

  if (error) {
    throw error
  }

  return data as unknown as Task
}

export async function listDeletedTasks(client: GrowTClient): Promise<Task[]> {
  const { data, error } = await client.rpc('list_deleted_tasks')

  if (error) {
    throw error
  }

  return data as unknown as Task[]
}

export async function softDeleteTask(client: GrowTClient, taskId: string) {
  const { data, error } = await client.rpc('soft_delete_task', {
    task_id: taskId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function hardDeleteTask(client: GrowTClient, taskId: string) {
  const { data, error } = await client.rpc('hard_delete_task', {
    task_id: taskId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function restoreTask(client: GrowTClient, taskId: string) {
  const { data, error } = await client.rpc('restore_task', {
    task_id: taskId,
  })

  if (error) {
    throw error
  }

  return data as unknown as Task
}

export async function reorderTask(
  client: GrowTClient,
  taskId: string,
  direction: ReorderDirection,
  scopedTaskIds?: string[],
) {
  const userId = await getCurrentUserId(client)
  const { data: task, error: taskError } = await client
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .is('deleted_at', null)
    .single()

  if (taskError) {
    throw taskError
  }

  if (task.folder_id) {
    const { data: folder, error: folderError } = await client
      .from('folders')
      .select('owner_id')
      .eq('id', task.folder_id)
      .is('deleted_at', null)
      .single()

    if (folderError) {
      throw folderError
    }

    if (folder.owner_id !== userId) {
      throw new Error('Only the folder owner can reorder folder tasks.')
    }

    const { data: rows, error: rowsError } = await client
      .from('tasks')
      .select('*')
      .eq('folder_id', task.folder_id)
      .is('deleted_at', null)

    if (rowsError) {
      throw rowsError
    }

    await persistMovedPositions(
      client,
      'tasks',
      movePositionedRows(rows, taskId, direction, compareTasksForOrder, scopedTaskIds),
      rows,
    )

    return listTasks(client, task.folder_id)
  }

  if (task.owner_id !== userId) {
    throw new Error('Only the task owner can reorder standalone tasks.')
  }

  const { data: rows, error: rowsError } = await client
    .from('tasks')
    .select('*')
    .eq('owner_id', userId)
    .is('folder_id', null)
    .is('deleted_at', null)

  if (rowsError) {
    throw rowsError
  }

  await persistMovedPositions(
    client,
    'tasks',
    movePositionedRows(rows, taskId, direction, compareTasksForOrder, scopedTaskIds),
    rows,
  )

  return listStandaloneTasks(client)
}

export async function listTaskProgressForTasks(client: GrowTClient, taskIds: string[]) {
  if (!taskIds.length) {
    return []
  }

  const { data, error } = await client
    .from('task_progress')
    .select('*')
    .in('task_id', taskIds)
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function listTaskActionsForTasks(client: GrowTClient, taskIds: string[]) {
  if (!taskIds.length) {
    return []
  }

  const { data, error } = await client
    .from('task_status_actions')
    .select('*')
    .in('task_id', taskIds)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function setTaskProgress(
  client: GrowTClient,
  taskId: string,
  taskLevelId: string | null,
  status: TaskProgressStatus,
) {
  const { data, error } = await client.rpc('set_task_progress', {
    task_id: taskId,
    task_level_id: taskLevelId,
    new_status: status,
  } as unknown as FunctionArgs<'set_task_progress'>)

  if (error) {
    throw error
  }

  return data as unknown as TaskStatusAction
}

export async function undoLatestTaskProgress(
  client: GrowTClient,
  taskId: string,
  taskLevelId: string | null,
) {
  const { data, error } = await client.rpc('undo_latest_task_progress', {
    task_id: taskId,
    task_level_id: taskLevelId,
  } as unknown as FunctionArgs<'undo_latest_task_progress'>)

  if (error) {
    throw error
  }

  return data as unknown as TaskStatusAction
}

export async function undoTaskStatusAction(client: GrowTClient, actionId: string) {
  const { data, error } = await client.rpc('undo_task_status_action', {
    action_id: actionId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function createInviteWithUser(
  client: GrowTClient,
  resourceType: InviteResourceType,
  resourceId: string,
  userId: string,
) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  
  const { data, error } = await client
    .from('invites')
    .insert({
      resource_type: resourceType,
      resource_id: resourceId,
      expires_at: expiresAt.toISOString(),
      created_by: userId,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function acceptInvite(
  client: GrowTClient,
  inviteId: string,
) {
  const { data, error } = await client.rpc('accept_invite', {
    p_invite_id: inviteId,
  })

  if (error) {
    throw error
  }

  return data
}
