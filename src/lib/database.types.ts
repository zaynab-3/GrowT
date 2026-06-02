export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type TableDefinition<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type CheckpointStatus = 'planned' | 'active' | 'paused' | 'complete'
export type FolderCategory = 'work' | 'personal' | 'shared'
export type FolderMemberRole = 'owner' | 'member' | 'viewer'
export type TaskProgressStatus = 'ongoing' | 'half_done' | 'completed'
export type AcquaintanceRequestStatus = 'pending' | 'accepted' | 'rejected'

export type ProfileRow = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type FolderRow = {
  id: string
  owner_id: string
  title: string
  description: string | null
  category: FolderCategory
  is_shared: boolean
  is_active: boolean
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type FolderMemberRow = {
  id: string
  folder_id: string
  user_id: string
  role: FolderMemberRole
  joined_at: string
  created_at: string
  updated_at: string
}

export type TaskRow = {
  id: string
  folder_id: string | null
  owner_id: string
  assigned_user_id: string | null
  title: string
  description: string | null
  category: FolderCategory
  is_active: boolean
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type TaskLevelRow = {
  id: string
  task_id: string
  title: string | null
  description: string | null
  position: number
  created_at: string
  updated_at: string
}

export type TaskProgressRow = {
  id: string
  task_id: string
  task_level_id: string | null
  user_id: string
  status: TaskProgressStatus
  created_at: string
  updated_at: string
}

export type TaskStatusActionRow = {
  id: string
  task_id: string
  task_level_id: string | null
  user_id: string
  old_status: TaskProgressStatus | null
  new_status: TaskProgressStatus
  is_undone: boolean
  undone_at: string | null
  created_at: string
  updated_at: string
}

export type NotificationRow = {
  id: string
  user_id: string
  actor_id: string | null
  type: string
  title: string
  message: string
  folder_id: string | null
  task_id: string | null
  task_level_id: string | null
  read_at: string | null
  created_at: string
}

type ProfileInsert = {
  id: string
  display_name?: string | null
  username?: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}

type ProfileUpdate = Partial<ProfileInsert>

type FolderInsert = {
  id?: string
  owner_id: string
  title: string
  description?: string | null
  category?: FolderCategory
  is_shared?: boolean
  is_active?: boolean
  due_date?: string | null
  position?: number
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

type FolderUpdate = Partial<FolderInsert>

type FolderMemberInsert = {
  id?: string
  folder_id: string
  user_id: string
  role?: FolderMemberRole
  joined_at?: string
  created_at?: string
  updated_at?: string
}

type FolderMemberUpdate = Partial<FolderMemberInsert>

type TaskInsert = {
  id?: string
  folder_id?: string | null
  owner_id: string
  assigned_user_id?: string | null
  title: string
  description?: string | null
  category?: FolderCategory
  is_active?: boolean
  due_date?: string | null
  position?: number
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

type TaskUpdate = Partial<TaskInsert>

type TaskLevelInsert = {
  id?: string
  task_id: string
  title?: string | null
  description?: string | null
  position?: number
  created_at?: string
  updated_at?: string
}

type TaskLevelUpdate = Partial<TaskLevelInsert>

type TaskProgressInsert = {
  id?: string
  task_id: string
  task_level_id?: string | null
  user_id: string
  status: TaskProgressStatus
  created_at?: string
  updated_at?: string
}

type TaskProgressUpdate = Partial<TaskProgressInsert>

type TaskStatusActionInsert = {
  id?: string
  task_id: string
  task_level_id?: string | null
  user_id: string
  old_status?: TaskProgressStatus | null
  new_status: TaskProgressStatus
  is_undone?: boolean
  undone_at?: string | null
  created_at?: string
  updated_at?: string
}

type TaskStatusActionUpdate = Partial<TaskStatusActionInsert>

type NotificationInsert = {
  id?: string
  user_id: string
  actor_id?: string | null
  type: string
  title: string
  message: string
  folder_id?: string | null
  task_id?: string | null
  task_level_id?: string | null
  read_at?: string | null
  created_at?: string
}

type NotificationUpdate = Partial<NotificationInsert>

type AcquaintanceRequestRow = {
  id: string
  sender_id: string
  receiver_id: string
  status: AcquaintanceRequestStatus
  created_at: string
  updated_at: string
}

type AcquaintanceRequestInsert = {
  id?: string
  sender_id: string
  receiver_id: string
  status?: AcquaintanceRequestStatus
  created_at?: string
  updated_at?: string
}

type AcquaintanceRequestUpdate = Partial<AcquaintanceRequestInsert>

type AcquaintanceRow = {
  id: string
  user_id: string
  acquaintance_id: string
  created_at: string
}

type AcquaintanceInsert = {
  id?: string
  user_id: string
  acquaintance_id: string
  created_at?: string
}

type AcquaintanceUpdate = Partial<AcquaintanceInsert>

type FolderShareLinkRow = {
  id: string
  folder_id: string
  token: string
  created_by: string
  expires_at: string | null
  revoked_at: string | null
  created_at: string
  updated_at: string
}

type FolderShareLinkInsert = {
  id?: string
  folder_id: string
  token?: string
  created_by: string
  expires_at?: string | null
  revoked_at?: string | null
  created_at?: string
  updated_at?: string
}

type FolderShareLinkUpdate = Partial<FolderShareLinkInsert>

type GrowTProfileRow = {
  id: string
  display_name: string | null
  created_at: string
  updated_at: string
}

type GrowTProfileInsert = {
  id: string
  display_name?: string | null
  created_at?: string
  updated_at?: string
}

type GrowTWorkspaceRow = {
  id: string
  owner_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

type GrowTWorkspaceInsert = {
  id?: string
  owner_id: string
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

type GrowTCheckpointRow = {
  id: string
  workspace_id: string
  owner_id: string
  title: string
  status: CheckpointStatus
  due_on: string | null
  created_at: string
  updated_at: string
}

type GrowTCheckpointInsert = {
  id?: string
  workspace_id: string
  owner_id: string
  title: string
  status?: CheckpointStatus
  due_on?: string | null
  created_at?: string
  updated_at?: string
}

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<ProfileRow, ProfileInsert, ProfileUpdate>
      acquaintance_requests: TableDefinition<
        AcquaintanceRequestRow,
        AcquaintanceRequestInsert,
        AcquaintanceRequestUpdate
      >
      acquaintances: TableDefinition<AcquaintanceRow, AcquaintanceInsert, AcquaintanceUpdate>
      folders: TableDefinition<FolderRow, FolderInsert, FolderUpdate>
      folder_members: TableDefinition<FolderMemberRow, FolderMemberInsert, FolderMemberUpdate>
      folder_share_links: TableDefinition<
        FolderShareLinkRow,
        FolderShareLinkInsert,
        FolderShareLinkUpdate
      >
      tasks: TableDefinition<TaskRow, TaskInsert, TaskUpdate>
      task_levels: TableDefinition<TaskLevelRow, TaskLevelInsert, TaskLevelUpdate>
      task_progress: TableDefinition<TaskProgressRow, TaskProgressInsert, TaskProgressUpdate>
      task_status_actions: TableDefinition<
        TaskStatusActionRow,
        TaskStatusActionInsert,
        TaskStatusActionUpdate
      >
      notifications: TableDefinition<NotificationRow, NotificationInsert, NotificationUpdate>
      growt_profiles: TableDefinition<
        GrowTProfileRow,
        GrowTProfileInsert,
        Partial<GrowTProfileInsert>
      >
      growt_workspaces: TableDefinition<
        GrowTWorkspaceRow,
        GrowTWorkspaceInsert,
        Partial<GrowTWorkspaceInsert>
      >
      growt_checkpoints: TableDefinition<
        GrowTCheckpointRow,
        GrowTCheckpointInsert,
        Partial<GrowTCheckpointInsert>
      >
    }
    Views: Record<string, never>
    Functions: {
      set_task_progress: {
        Args: {
          task_id: string
          task_level_id: string | null
          new_status: TaskProgressStatus
        }
        Returns: TaskStatusActionRow
      }
      undo_latest_task_progress: {
        Args: {
          task_id: string
          task_level_id: string | null
        }
        Returns: TaskStatusActionRow
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
