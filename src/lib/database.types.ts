export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acquaintance_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      acquaintances: {
        Row: {
          acquaintance_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          acquaintance_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          acquaintance_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      folder_members: {
        Row: {
          created_at: string
          folder_id: string
          id: string
          joined_at: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id: string
          id?: string
          joined_at?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string
          id?: string
          joined_at?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_members_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_share_links: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          folder_id: string
          id: string
          revoked_at: string | null
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          folder_id: string
          id?: string
          revoked_at?: string | null
          token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          folder_id?: string
          id?: string
          revoked_at?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_share_links_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          category: FolderCategory
          created_at: string
          deleted_at: string | null
          description: string | null
          contains_export_videos: boolean
          due_date: string | null
          id: string
          is_active: boolean
          is_shared: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: FolderCategory
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          contains_export_videos?: boolean
          due_date?: string | null
          id?: string
          is_active?: boolean
          is_shared?: boolean
          owner_id: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: FolderCategory
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          contains_export_videos?: boolean
          due_date?: string | null
          id?: string
          is_active?: boolean
          is_shared?: boolean
          owner_id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      growt_checkpoints: {
        Row: {
          created_at: string
          due_on: string | null
          id: string
          owner_id: string
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          due_on?: string | null
          id?: string
          owner_id: string
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          due_on?: string | null
          id?: string
          owner_id?: string
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growt_checkpoints_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "growt_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      growt_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      growt_workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          resource_id: string
          resource_type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          resource_id: string
          resource_type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          resource_id?: string
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          folder_id: string | null
          id: string
          message: string
          read_at: string | null
          task_id: string | null
          task_level_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          message: string
          read_at?: string | null
          task_id?: string | null
          task_level_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          message?: string
          read_at?: string | null
          task_id?: string | null
          task_level_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_level_id_fkey"
            columns: ["task_level_id"]
            isOneToOne: false
            referencedRelation: "task_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_choice: AvatarChoice
          avatar_url: string | null
          color_palette: ColorPalette
          created_at: string
          display_name: string | null
          id: string
          theme_mode: ThemeMode
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_choice?: AvatarChoice
          avatar_url?: string | null
          color_palette?: ColorPalette
          created_at?: string
          display_name?: string | null
          id: string
          theme_mode?: ThemeMode
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_choice?: AvatarChoice
          avatar_url?: string | null
          color_palette?: ColorPalette
          created_at?: string
          display_name?: string | null
          id?: string
          theme_mode?: ThemeMode
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      task_levels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          position: number
          task_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          task_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          task_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_levels_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          role: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          role?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          role?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_members_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_progress: {
        Row: {
          created_at: string
          id: string
          status: TaskProgressStatus
          task_id: string
          task_level_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status: TaskProgressStatus
          task_id: string
          task_level_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: TaskProgressStatus
          task_id?: string
          task_level_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_progress_task_level_id_fkey"
            columns: ["task_level_id"]
            isOneToOne: false
            referencedRelation: "task_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      task_status_actions: {
        Row: {
          created_at: string
          id: string
          is_undone: boolean
          new_status: TaskProgressStatus
          old_status: TaskProgressStatus | null
          task_id: string
          task_level_id: string | null
          undone_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_undone?: boolean
          new_status: TaskProgressStatus
          old_status?: TaskProgressStatus | null
          task_id: string
          task_level_id?: string | null
          undone_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_undone?: boolean
          new_status?: TaskProgressStatus
          old_status?: TaskProgressStatus | null
          task_id?: string
          task_level_id?: string | null
          undone_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_status_actions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_status_actions_task_level_id_fkey"
            columns: ["task_level_id"]
            isOneToOne: false
            referencedRelation: "task_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_user_id: string | null
          category: FolderCategory
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          folder_id: string | null
          has_export_button: boolean
          id: string
          is_active: boolean
          is_exported: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          assigned_user_id?: string | null
          category?: FolderCategory
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          folder_id?: string | null
          has_export_button?: boolean
          id?: string
          is_active?: boolean
          is_exported?: boolean
          owner_id: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          assigned_user_id?: string | null
          category?: FolderCategory
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          folder_id?: string | null
          has_export_button?: boolean
          id?: string
          is_active?: boolean
          is_exported?: boolean
          owner_id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_acquaintance_request: {
        Args: { request_id: string }
        Returns: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        
        SetofOptions: {
          from: "*"
          to: "acquaintance_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      accept_invite: { Args: { p_invite_id: string }; Returns: Json }
      add_folder_member: {
        Args: { folder_id: string; username: string }
        Returns: {
          created_at: string
          folder_id: string
          id: string
          joined_at: string
          role: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "folder_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hard_delete_task: {
        Args: { task_id: string }
        Returns: string
      }      
      hard_delete_folder: {
        Args: { folder_id: string }
        Returns: string
      }
      add_task_member: {
        Args: { task_id: string; username: string }
        Returns: {
          created_at: string
          id: string
          joined_at: string
          role: string
          task_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "task_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_acquaintance_request: {
        Args: { request_id: string }
        Returns: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "acquaintance_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_folder: {
        Args: { category: string; contains_export_videos?: boolean; description: string; title: string }
        Returns: {
          category: string
          contains_export_videos: boolean
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_active: boolean
          is_shared: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "folders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_standalone_task: {
        Args: {
          assigned_user_id?: string
          category?: string
          description?: string
          due_date?: string
          has_export_button?: boolean
          title: string
        }
        Returns: {
          assigned_user_id: string | null
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          folder_id: string | null
          has_export_button: boolean
          id: string
          is_active: boolean
          is_exported: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_task: {
        Args: {
          assigned_user_id?: string
          category?: string
          description?: string
          due_date?: string
          folder_id: string
          has_export_button?: boolean
          title: string
        }
        Returns: {
          assigned_user_id: string | null
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          folder_id: string | null
          has_export_button: boolean
          id: string
          is_active: boolean
          is_exported: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      list_acquaintance_requests: {
        Args: never
        Returns: {
          created_at: string
          direction: string
          receiver_avatar_url: string
          receiver_display_name: string
          receiver_id: string
          receiver_username: string
          request_id: string
          sender_avatar_url: string
          sender_display_name: string
          sender_id: string
          sender_username: string
          status: string
          updated_at: string
        }[]
      }
      list_acquaintances: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          relationship_id: string
          user_id: string
          username: string
        }[]
      }
      list_deleted_folders: {
        Args: never
        Returns: {
          category: string
          contains_export_videos: boolean
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_active: boolean
          is_shared: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "folders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_deleted_tasks: {
        Args: never
        Returns: {
          assigned_user_id: string | null
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          folder_id: string | null
          has_export_button: boolean
          id: string
          is_active: boolean
          is_exported: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_folder_tasks: {
        Args: { folder_id: string }
        Returns: {
          assigned_user_id: string | null
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          folder_id: string | null
          has_export_button: boolean
          id: string
          is_active: boolean
          is_exported: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_standalone_tasks: {
        Args: never
        Returns: {
          assigned_user_id: string | null
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          folder_id: string | null
          has_export_button: boolean
          id: string
          is_active: boolean
          is_exported: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_task_members: {
        Args: { task_id: string }
        Returns: {
          created_at: string
          id: string
          joined_at: string
          role: string
          task_id: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "task_members"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_visible_standalone_tasks: {
        Args: never
        Returns: {
          assigned_user_id: string | null
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          folder_id: string | null
          has_export_button: boolean
          id: string
          is_active: boolean
          is_exported: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      reject_acquaintance_request: {
        Args: { request_id: string }
        Returns: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "acquaintance_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      remove_acquaintance: { Args: { user_id: string }; Returns: string }
      remove_task_member: {
        Args: { task_id: string; user_id: string }
        Returns: {
          created_at: string
          id: string
          joined_at: string
          role: string
          task_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "task_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reorder_folder: {
        Args: { direction: string; folder_id: string }
        Returns: {
          category: string
          contains_export_videos: boolean
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_active: boolean
          is_shared: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "folders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      reorder_task: {
        Args: { direction: string; task_id: string }
        Returns: {
          assigned_user_id: string | null
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          folder_id: string | null
          has_export_button: boolean
          id: string
          is_active: boolean
          is_exported: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      resolve_login_email: { Args: { identifier: string }; Returns: string }
      restore_folder: {
        Args: { folder_id: string }
        Returns: {
          category: string
          contains_export_videos: boolean
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_active: boolean
          is_shared: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "folders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      restore_task: {
        Args: { task_id: string }
        Returns: {
          assigned_user_id: string | null
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          folder_id: string | null
          has_export_button: boolean
          id: string
          is_active: boolean
          is_exported: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      search_profiles_by_username: {
        Args: { query_text: string }
        Returns: {
          avatar_url: string
          display_name: string
          profile_id: string
          username: string
        }[]
      }
      search_profiles_with_relationship: {
        Args: { query_text: string }
        Returns: {
          avatar_choice: string
          avatar_url: string
          display_name: string
          relationship_status: string
          request_id: string
          user_id: string
          username: string
        }[]
      }
      send_acquaintance_request: {
        Args: { username: string }
        Returns: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "acquaintance_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_task_progress: {
        Args: { new_status: string; task_id: string; task_level_id: string }
        Returns: {
          created_at: string
          id: string
          is_undone: boolean
          new_status: string
          old_status: string | null
          task_id: string
          task_level_id: string | null
          undone_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "task_status_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_folder: {
        Args: { folder_id: string }
        Returns: {
          category: string
          contains_export_videos: boolean
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_active: boolean
          is_shared: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "folders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_task: {
        Args: { task_id: string }
        Returns: {
          assigned_user_id: string | null
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          folder_id: string | null
          has_export_button: boolean
          id: string
          is_active: boolean
          is_exported: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      undo_latest_task_progress: {
        Args: { task_id: string; task_level_id: string }
        Returns: {
          created_at: string
          id: string
          is_undone: boolean
          new_status: string
          old_status: string | null
          task_id: string
          task_level_id: string | null
          undone_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "task_status_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      undo_task_status_action: {
        Args: { action_id: string }
        Returns: {
          created_at: string
          id: string
          is_undone: boolean
          new_status: string
          old_status: string | null
          task_id: string
          task_level_id: string | null
          undone_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "task_status_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_folder: {
        Args: {
          category?: string
          contains_export_videos?: boolean
          description?: string
          due_date?: string
          folder_id: string
          is_active?: boolean
          title: string
        }
        Returns: {
          category: string
          contains_export_videos: boolean
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_active: boolean
          is_shared: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "folders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_task: {
        Args: {
          assigned_user_id?: string
          category?: string
          description?: string
          due_date?: string
          has_export_button?: boolean
          is_active?: boolean
          task_id: string
          title: string
        }
        Returns: {
          assigned_user_id: string | null
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          folder_id: string | null
          has_export_button: boolean
          id: string
          is_active: boolean
          is_exported: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_task_exported: {
        Args: { is_exported?: boolean; task_id: string }
        Returns: {
          assigned_user_id: string | null
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          folder_id: string | null
          has_export_button: boolean
          id: string
          is_active: boolean
          is_exported: boolean
          owner_id: string
          position: number
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type AvatarChoice = 'default' | 'duck' | 'penguin' | 'sprout'
export type ColorPalette = 'sage' | 'duck' | 'penguin' | 'sprout' | 'rose' | 'lavender'
export type ThemeMode = 'system' | 'light' | 'dark'
export type FolderCategory = 'work' | 'personal' | 'shared'
export type TaskProgressStatus = 'ongoing' | 'half_done' | 'completed'
export type InviteResourceType = 'folder' | 'task'
export type ReorderDirection = 'up' | 'down'
export type MemberRelationshipStatus =
  | 'acquaintance'
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'none'
