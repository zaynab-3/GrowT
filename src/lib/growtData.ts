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

export async function createFolder(
  client: GrowTClient,
  ownerId: string,
  title: string,
  description: string | null,
  category: FolderCategory,
) {
  const { data, error } = await client
    .from('folders')
    .insert({
      owner_id: ownerId,
      title,
      description,
      category,
      is_shared: category === 'shared',
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  const { error: memberError } = await client
    .from('folder_members')
    .upsert(
      { folder_id: data.id, user_id: ownerId, role: 'owner' },
      { onConflict: 'folder_id,user_id', ignoreDuplicates: true },
    )

  if (memberError) {
    throw memberError
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
  const { data, error } = await client
    .from('tasks')
    .select('*')
    .eq('folder_id', folderId)
    .is('deleted_at', null)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export async function createTask(
  client: GrowTClient,
  task: {
    folderId: string
    ownerId: string
    title: string
    description: string | null
    category: FolderCategory
  },
) {
  const { data, error } = await client
    .from('tasks')
    .insert({
      folder_id: task.folderId,
      owner_id: task.ownerId,
      title: task.title,
      description: task.description,
      category: task.category,
    })
    .select('*')
    .single()

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
