import { getCategoryLabel, isSharedFolder } from '../../lib/growtDisplay'
import type { Folder } from '../../lib/growtData'

type FolderCardProps = {
  folder: Folder
  isSelected: boolean
  onSelect: (folderId: string) => void
}

export function FolderCard({ folder, isSelected, onSelect }: FolderCardProps) {
  return (
    <button
      className={`folder-row ${isSelected ? 'folder-row--selected' : ''}`}
      onClick={() => onSelect(folder.id)}
      type="button"
    >
      <strong>{folder.title}</strong>
      <span>
        {getCategoryLabel(folder.category)} · {isSharedFolder(folder) ? 'Shared' : 'Private'}
      </span>
      <span>{folder.description || 'No description yet'}</span>
    </button>
  )
}
