import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  FolderCategory,
  TaskProgressStatus,
} from './database.types'

export type GrowTClient = SupabaseClient<Database>
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Folder = Database['public']['Tables']['folders']['Row']
export type FolderMember = Database['public']['Tables']['folder_members']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskMember = Database['public']['Tables']['task_members']['Row']
export type TaskProgress = Database['public']['Tables']['task_progress']['Row']
export type TaskStatusAction = Database['public']['Tables']['task_status_actions']['Row']

export async function ensureProfile(
  client: GrowTClient,
  userId: string,
  displayName: string | null,
) {
  const { data, error } = await client
    .from('profiles')
    .upsert(
      { id: userId, display_name: displayName },
      { onConflict: 'id', ignoreDuplicates: true },
    )
    .select('*')
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    return data
  }

  const { data: existingProfile, error: selectError } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (selectError) {
    throw selectError
  }

  return existingProfile
}

export async function updateProfile(
  client: GrowTClient,
  userId: string,
  profile: { displayName: string | null; username: string | null },
) {
  const { data, error } = await client
    .from('profiles')
    .update({
      display_name: profile.displayName,
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
    .select('*')
    .in('id', uniqueIds)

  if (error) {
    throw error
  }

  return data
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

  return data
}

export async function listDeletedFolders(client: GrowTClient) {
  const { data, error } = await client.rpc('list_deleted_folders', {})

  if (error) {
    throw error
  }

  return data
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
  })

  if (error) {
    throw error
  }

  return data
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
  })

  if (error) {
    throw error
  }

  return data
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

export async function restoreFolder(client: GrowTClient, folderId: string) {
  const { data, error } = await client.rpc('restore_folder', {
    folder_id: folderId,
  })

  if (error) {
    throw error
  }

  return data
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
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  if (!profile) {
    throw new Error('No GrowT user found with that username.')
  }

  const { data, error } = await client
    .from('folder_members')
    .upsert(
      { folder_id: folderId, user_id: profile.id, role: 'member' },
      { onConflict: 'folder_id,user_id', ignoreDuplicates: true },
    )
    .select('*')
    .maybeSingle()

  if (error) {
    throw error
  }

  return { member: data, profile }
}

export async function listTasks(client: GrowTClient, folderId: string) {
  const { data, error } = await client.rpc('list_folder_tasks', {
    folder_id: folderId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function listStandaloneTasks(client: GrowTClient) {
  const { data, error } = await client.rpc('list_standalone_tasks', {})

  if (error) {
    throw error
  }

  return data
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
    .select('*')
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
  })

  if (error) {
    throw error
  }

  return data
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
  })

  if (error) {
    throw error
  }

  return data
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
  })

  if (error) {
    throw error
  }

  return data
}

export async function listDeletedTasks(client: GrowTClient) {
  const { data, error } = await client.rpc('list_deleted_tasks', {})

  if (error) {
    throw error
  }

  return data
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

export async function restoreTask(client: GrowTClient, taskId: string) {
  const { data, error } = await client.rpc('restore_task', {
    task_id: taskId,
  })

  if (error) {
    throw error
  }

  return data
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
  })

  if (error) {
    throw error
  }

  return data
}

export async function undoLatestTaskProgress(
  client: GrowTClient,
  taskId: string,
  taskLevelId: string | null,
) {
  const { data, error } = await client.rpc('undo_latest_task_progress', {
    task_id: taskId,
    task_level_id: taskLevelId,
  })

  if (error) {
    throw error
  }

  return data
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
