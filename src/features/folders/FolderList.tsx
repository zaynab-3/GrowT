import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import type { ReorderDirection } from '../../lib/database.types'
import { isSharedFolder } from '../../lib/growtDisplay'
import type { Folder } from '../../lib/growtData'
import { FolderCard } from './FolderCard'

type FolderScope = 'all' | 'personal' | 'work' | 'shared'

type FolderListProps = {
  activeFolderId: string | null
  activeFolderStatusCounts?: { ongoing: number; half_done: number; completed: number }
  currentUserId: string
  emptyMessage: string
  folders: Folder[]
  isSaving: boolean
  onMoveFolder: (folder: Folder, direction: ReorderDirection) => void
  onSelectFolder: (folderId: string) => void
  taskCountByFolder?: Map<string, number>
}

export function FolderList({
  activeFolderId,
  activeFolderStatusCounts,
  currentUserId,
  emptyMessage,
  folders,
  isSaving,
  onMoveFolder,
  onSelectFolder,
  taskCountByFolder,
}: FolderListProps) {
  const [scope, setScope] = useState<FolderScope>('all')
  const personalCount = folders.filter((folder) => !isSharedFolder(folder) && folder.category === 'personal').length
  const workCount = folders.filter((folder) => !isSharedFolder(folder) && folder.category === 'work').length
  const sharedCount = folders.filter((folder) => isSharedFolder(folder)).length
  const hasMixedScopes = [personalCount, workCount, sharedCount].filter(Boolean).length > 1
  const visibleFolders = useMemo(
    () =>
      folders.filter((folder) => {
        if (scope === 'personal') {
          return !isSharedFolder(folder) && folder.category === 'personal'
        }

        if (scope === 'work') {
          return !isSharedFolder(folder) && folder.category === 'work'
        }

        if (scope === 'shared') {
          return isSharedFolder(folder)
        }

        return true
      }),
    [folders, scope],
  )
  const reorderableFolderIds = folders
    .filter((folder) => folder.owner_id === currentUserId)
    .map((folder) => folder.id)

  return (
    <div className="workflow-shelf" aria-label="GrowT folders">
      <div className="workflow-toolbar">
        <div>
          <span className="section-label">Folders</span>
          <strong>{visibleFolders.length}</strong>
        </div>
        {hasMixedScopes ? (
          <div className="workflow-filters" aria-label="Folder scope">
            {[
              ['all', `All ${folders.length}`],
              ['personal', `Personal ${personalCount}`],
              ['work', `Work ${workCount}`],
              ['shared', `Shared ${sharedCount}`],
            ].map(([nextScope, label]) => (
              <button
                className={`workflow-filter${scope === nextScope ? ' workflow-filter--active' : ''}`}
                key={nextScope}
                onClick={() => setScope(nextScope as FolderScope)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <span className="workflow-scope">{sharedCount ? 'Shared' : workCount ? 'Work' : 'Personal'}</span>
        )}
      </div>

      <div className="workflow-card-grid">
        {visibleFolders.map((folder, index) => (
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
            statusCounts={folder.id === activeFolderId ? activeFolderStatusCounts : undefined}
            taskCount={taskCountByFolder?.get(folder.id) ?? 0}
            tone={index % 3}
          />
        ))}
      </div>

      {!visibleFolders.length ? <EmptyState>{emptyMessage}</EmptyState> : null}
    </div>
  )
}
