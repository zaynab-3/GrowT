import { getSupabaseClient } from './clientService'

export async function listTasksInActiveFolders() {
  const client = getSupabaseClient()

  const { data: folderData, error: folderError } = await client
    .from('folders')
    .select('id')
    .eq('is_active', true)
    .is('deleted_at', null)

  if (folderError) {
    throw folderError
  }

  const activeFolderIds = new Set((folderData || []).map((folder) => folder.id))
  const { data, error } = await client.from('tasks').select('*').not('folder_id', 'is', null)

  if (error) {
    throw error
  }

  return (data || []).filter((task) => task.folder_id && activeFolderIds.has(task.folder_id))
}
