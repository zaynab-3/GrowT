import { getCategoryLabel, isSharedFolder } from '../../lib/growtDisplay'
import type { Folder } from '../../lib/growtData'
import type { ReorderDirection } from '../../lib/database.types'

type FolderCardProps = {
  canReorder: boolean
  folder: Folder
  isSelected: boolean
  isFirst: boolean
  isLast: boolean
  isSaving: boolean
  onMoveFolder: (folder: Folder, direction: ReorderDirection) => void
  onSelect: (folderId: string) => void
}

export function FolderCard({
  canReorder,
  folder,
  isSelected,
  isFirst,
  isLast,
  isSaving,
  onMoveFolder,
  onSelect,
}: FolderCardProps) {
  return (
    <article className={`folder-row ${isSelected ? 'folder-row--selected' : ''}`}>
      <button className="folder-row__select" onClick={() => onSelect(folder.id)} type="button">
        <strong>{folder.title}</strong>
        <span>
          {getCategoryLabel(folder.category)} · {isSharedFolder(folder) ? 'Shared' : 'Private'}
        </span>
        <span>{folder.description || 'No description yet'}</span>
      </button>
      <div className="reorder-controls" aria-label={`Reorder ${folder.title}`}>
        <button
          className="button button--secondary reorder-button"
          disabled={isSaving || !canReorder || isFirst}
          onClick={() => onMoveFolder(folder, 'up')}
          title={canReorder ? 'Move folder up' : 'Only the folder owner can reorder this folder'}
          type="button"
        >
          Up
        </button>
        <button
          className="button button--secondary reorder-button"
          disabled={isSaving || !canReorder || isLast}
          onClick={() => onMoveFolder(folder, 'down')}
          title={canReorder ? 'Move folder down' : 'Only the folder owner can reorder this folder'}
          type="button"
        >
          Down
        </button>
      </div>
    </article>
  )
}
