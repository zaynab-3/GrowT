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
export type TaskMemberRole = 'owner' | 'member' | 'viewer'
export type TaskProgressStatus = 'ongoing' | 'half_done' | 'completed'
export type ReorderDirection = 'up' | 'down'
export type AcquaintanceRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'
export type MemberRelationshipStatus =
  | 'acquaintance'
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'none'

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

export type TaskMemberRow = {
  id: string
  task_id: string
  user_id: string
  role: TaskMemberRole
  joined_at: string
  created_at: string
  updated_at: string
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

type TaskMemberInsert = {
  id?: string
  task_id: string
  user_id: string
  role?: TaskMemberRole
  joined_at?: string
  created_at?: string
  updated_at?: string
}

type TaskMemberUpdate = Partial<TaskMemberInsert>

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

export type ProfileSearchResultRow = {
  profile_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export type ProfileRelationshipSearchRow = {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  relationship_status: MemberRelationshipStatus
  request_id: string | null
}

export type AcquaintanceListRow = {
  relationship_id: string
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export type AcquaintanceRequestListRow = {
  request_id: string
  direction: 'incoming' | 'outgoing'
  sender_id: string
  receiver_id: string
  status: AcquaintanceRequestStatus
  sender_username: string
  sender_display_name: string | null
  sender_avatar_url: string | null
  receiver_username: string
  receiver_display_name: string | null
  receiver_avatar_url: string | null
  created_at: string
  updated_at: string
}

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
      task_members: TableDefinition<TaskMemberRow, TaskMemberInsert, TaskMemberUpdate>
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
      accept_acquaintance_request: {
        Args: {
          request_id: string
        }
        Returns: AcquaintanceRequestRow
      }
      cancel_acquaintance_request: {
        Args: {
          request_id: string
        }
        Returns: AcquaintanceRequestRow
      }
      create_folder: {
        Args: {
          title: string
          description: string | null
          category: FolderCategory
        }
        Returns: FolderRow
      }
      add_task_member: {
        Args: {
          task_id: string
          username: string
        }
        Returns: TaskMemberRow
      }
      add_folder_member: {
        Args: {
          folder_id: string
          username: string
        }
        Returns: FolderMemberRow
      }
      create_standalone_task: {
        Args: {
          title: string
          description: string | null
          category: FolderCategory
          assigned_user_id: string | null
          due_date: string | null
        }
        Returns: TaskRow
      }
      create_task: {
        Args: {
          folder_id: string
          title: string
          description: string | null
          category: FolderCategory | null
          assigned_user_id: string | null
          due_date: string | null
        }
        Returns: TaskRow
      }
      list_deleted_folders: {
        Args: Record<string, never>
        Returns: FolderRow[]
      }
      list_deleted_tasks: {
        Args: Record<string, never>
        Returns: TaskRow[]
      }
      list_acquaintance_requests: {
        Args: Record<string, never>
        Returns: AcquaintanceRequestListRow[]
      }
      list_acquaintances: {
        Args: Record<string, never>
        Returns: AcquaintanceListRow[]
      }
      list_folder_tasks: {
        Args: {
          folder_id: string
        }
        Returns: TaskRow[]
      }
      list_standalone_tasks: {
        Args: Record<string, never>
        Returns: TaskRow[]
      }
      list_task_members: {
        Args: {
          task_id: string
        }
        Returns: TaskMemberRow[]
      }
      list_visible_standalone_tasks: {
        Args: Record<string, never>
        Returns: TaskRow[]
      }
      remove_task_member: {
        Args: {
          task_id: string
          user_id: string
        }
        Returns: TaskMemberRow
      }
      resolve_login_email: {
        Args: {
          identifier: string
        }
        Returns: string | null
      }
      reject_acquaintance_request: {
        Args: {
          request_id: string
        }
        Returns: AcquaintanceRequestRow
      }
      remove_acquaintance: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      reorder_folder: {
        Args: {
          folder_id: string
          direction: ReorderDirection
        }
        Returns: FolderRow[]
      }
      reorder_task: {
        Args: {
          task_id: string
          direction: ReorderDirection
        }
        Returns: TaskRow[]
      }
      restore_folder: {
        Args: {
          folder_id: string
        }
        Returns: FolderRow
      }
      restore_task: {
        Args: {
          task_id: string
        }
        Returns: TaskRow
      }
      soft_delete_folder: {
        Args: {
          folder_id: string
        }
        Returns: FolderRow
      }
      soft_delete_task: {
        Args: {
          task_id: string
        }
        Returns: TaskRow
      }
      set_task_progress: {
        Args: {
          task_id: string
          task_level_id: string | null
          new_status: TaskProgressStatus
        }
        Returns: TaskStatusActionRow
      }
      search_profiles_by_username: {
        Args: {
          query_text: string
        }
        Returns: ProfileSearchResultRow[]
      }
      search_profiles_with_relationship: {
        Args: {
          query_text: string
        }
        Returns: ProfileRelationshipSearchRow[]
      }
      send_acquaintance_request: {
        Args: {
          username: string
        }
        Returns: AcquaintanceRequestRow
      }
      update_folder: {
        Args: {
          folder_id: string
          title: string
          description: string | null
          category: FolderCategory
          due_date: string | null
          is_active: boolean
        }
        Returns: FolderRow
      }
      update_task: {
        Args: {
          task_id: string
          title: string
          description: string | null
          category: FolderCategory
          due_date: string | null
          is_active: boolean
          assigned_user_id: string | null
        }
        Returns: TaskRow
      }
      undo_latest_task_progress: {
        Args: {
          task_id: string
          task_level_id: string | null
        }
        Returns: TaskStatusActionRow
      }
      undo_task_status_action: {
        Args: {
          action_id: string
        }
        Returns: TaskStatusActionRow
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
