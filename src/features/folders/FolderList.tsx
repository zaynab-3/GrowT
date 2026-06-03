import { EmptyState } from '../../components/EmptyState'
import type { Folder } from '../../lib/growtData'
import { FolderCard } from './FolderCard'

type FolderListProps = {
  activeFolderId: string | null
  emptyMessage: string
  folders: Folder[]
  onSelectFolder: (folderId: string) => void
}

export function FolderList({
  activeFolderId,
  emptyMessage,
  folders,
  onSelectFolder,
}: FolderListProps) {
  return (
    <div className="folder-list" aria-label="GrowT folders">
      {folders.map((folder) => (
        <FolderCard
          folder={folder}
          isSelected={folder.id === activeFolderId}
          key={folder.id}
          onSelect={onSelectFolder}
        />
      ))}
      {!folders.length ? <EmptyState>{emptyMessage}</EmptyState> : null}
    </div>
  )
}
