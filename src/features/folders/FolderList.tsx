import { EmptyState } from '../../components/EmptyState'
import type { ReorderDirection } from '../../lib/database.types'
import type { Folder } from '../../lib/growtData'
import { FolderCard } from './FolderCard'

type FolderListProps = {
  activeFolderId: string | null
  currentUserId: string
  emptyMessage: string
  folders: Folder[]
  isSaving: boolean
  onMoveFolder: (folder: Folder, direction: ReorderDirection) => void
  onSelectFolder: (folderId: string) => void
}

export function FolderList({
  activeFolderId,
  currentUserId,
  emptyMessage,
  folders,
  isSaving,
  onMoveFolder,
  onSelectFolder,
}: FolderListProps) {
  const reorderableFolderIds = folders
    .filter((folder) => folder.owner_id === currentUserId)
    .map((folder) => folder.id)

  return (
    <div className="folder-list" aria-label="GrowT folders">
      {folders.map((folder) => (
        <FolderCard
          canReorder={folder.owner_id === currentUserId}
          folder={folder}
          isSelected={folder.id === activeFolderId}
          isFirst={reorderableFolderIds[0] === folder.id}
          isLast={reorderableFolderIds[reorderableFolderIds.length - 1] === folder.id}
          isSaving={isSaving}
          key={folder.id}
          onMoveFolder={onMoveFolder}
          onSelect={onSelectFolder}
        />
      ))}
      {!folders.length ? <EmptyState>{emptyMessage}</EmptyState> : null}
    </div>
  )
}
