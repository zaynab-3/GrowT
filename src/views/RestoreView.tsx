import type { ReactNode } from 'react'
import { EmptyState } from '../components/EmptyState'
import { ViewHeader } from './ViewHeader'

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
    <section className="view-stack">
      <ViewHeader
        description="Recover recently deleted folders and tasks while the seven-day restore window is still open."
        label="Restore"
        title="Archive and recovery"
      />
      <div className="view-grid view-grid--two">
        <section className="view-panel">{folderRestorePanel}</section>
        <section className="view-panel">{taskRestorePanel}</section>
      </div>
      {!hasDeletedItems ? <EmptyState>No deleted folders or tasks are waiting for restore.</EmptyState> : null}
    </section>
  )
}
