import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
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

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-6">
      <div className="workspace-header-compact">
        <span className="page-header__eyebrow" style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>
          Archive
        </span>
        <h1>Archive & Recovery</h1>
        <p className="page-header__desc" style={{ margin: '4px 0 0', color: 'var(--ink-3)', fontSize: '14px' }}>
          Recover recently deleted folders and tasks while the seven-day restore window is still open.
        </p>
      </div>

      {hasDeletedItems ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start" style={{ paddingBottom: '48px' }}>
          {folderRestorePanel}
          {taskRestorePanel}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-surface dark:bg-dark-card rounded-2xl border border-surface-variant/50 max-w-md mx-auto w-full mt-4">
          <div className="w-20 h-20 bg-surface-soft dark:bg-surface-container rounded-full flex items-center justify-center mb-4 shadow-inner">
            <RotateCcw size={40} className="text-primary/60" />
          </div>
          <h4 className="font-title-lg text-title-lg text-on-surface mb-2">Trash is empty</h4>
          <p className="font-body-md text-body-md text-on-surface-variant">
            No deleted folders or tasks are currently waiting for restore.
          </p>
        </div>
      )}
    </div>
  )
}
