import type { SupabaseClient } from '@supabase/supabase-js'
import type { CheckpointStatus, Database } from './database.types'

export type GrowTClient = SupabaseClient<Database>
export type Workspace = Database['public']['Tables']['growt_workspaces']['Row']
export type Checkpoint = Database['public']['Tables']['growt_checkpoints']['Row']

export async function ensureProfile(
  client: GrowTClient,
  userId: string,
  displayName: string | null,
) {
  const { error } = await client
    .from('growt_profiles')
    .upsert({ id: userId, display_name: displayName }, { onConflict: 'id' })

  if (error) {
    throw error
  }
}

export async function listWorkspaces(client: GrowTClient, userId: string) {
  const { data, error } = await client
    .from('growt_workspaces')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function createWorkspace(
  client: GrowTClient,
  ownerId: string,
  name: string,
  description: string | null,
) {
  const { data, error } = await client
    .from('growt_workspaces')
    .insert({ owner_id: ownerId, name, description })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function listCheckpoints(client: GrowTClient, workspaceId: string) {
  const { data, error } = await client
    .from('growt_checkpoints')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export async function createCheckpoint(
  client: GrowTClient,
  checkpoint: {
    workspaceId: string
    ownerId: string
    title: string
    dueOn: string | null
  },
) {
  const { data, error } = await client
    .from('growt_checkpoints')
    .insert({
      workspace_id: checkpoint.workspaceId,
      owner_id: checkpoint.ownerId,
      title: checkpoint.title,
      due_on: checkpoint.dueOn,
      status: 'active',
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateCheckpointStatus(
  client: GrowTClient,
  checkpointId: string,
  status: CheckpointStatus,
) {
  const { data, error } = await client
    .from('growt_checkpoints')
    .update({ status })
    .eq('id', checkpointId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}
