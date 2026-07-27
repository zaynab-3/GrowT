import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import './UtilityViews.css'

type RestoreViewProps = {
  deletedFolderCount: number
  deletedTaskCount: number
  folderRestorePanel: ReactNode
  taskRestorePanel: ReactNode
}

export function RestoreView({
  deletedFolderCount,
  deletedTaskCount,
  folderRestorePanel,
  taskRestorePanel,
}: RestoreViewProps) {
  const hasDeletedItems = deletedFolderCount + deletedTaskCount > 0
  const deletedItemCount = deletedFolderCount + deletedTaskCount

  return (
    <div className="utility-view utility-view--restore">
      <header className="utility-view__header">
        <div className="utility-view__title-row gui-page-heading">
          <span className="gui-page-heading__icon"><RotateCcw aria-hidden="true" size={21} /></span>
          <h1>Restore</h1>
          {hasDeletedItems ? <span className="utility-view__count">{deletedItemCount} items</span> : null}
        </div>
      </header>

      {hasDeletedItems ? (
        <div className="restore-grid">
          {folderRestorePanel}
          {taskRestorePanel}
        </div>
      ) : (
        <section className="utility-empty-state" aria-label="Restore status">
          <div className="utility-empty-state__icon">
            <RotateCcw size={20} />
          </div>
          <div className="utility-empty-state__copy">
            <h4>Nothing to restore</h4>
            <p>Deleted folders and tasks will appear here.</p>
          </div>
        </section>
      )}
    </div>
  )
}
