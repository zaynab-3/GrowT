import { formatDateTime, getCategoryLabel } from '../../lib/growtDisplay'
import type { Folder } from '../../lib/growtData'

type FolderRestorePanelProps = {
  folders: Folder[]
  isSaving: boolean
  onRestore: (folder: Folder) => void
}

export function FolderRestorePanel({ folders, isSaving, onRestore }: FolderRestorePanelProps) {
  if (!folders.length) {
    return null
  }

  return (
    <section className="restore-panel" aria-label="Deleted folders">
      <div className="restore-panel__heading">
        <span className="section-label">Deleted folders</span>
        <strong>{folders.length}</strong>
      </div>
      <div className="restore-list">
        {folders.map((folder) => (
          <div className="restore-row" key={folder.id}>
            <div>
              <strong>{folder.title}</strong>
              <span>
                {getCategoryLabel(folder.category)} · Deleted {formatDateTime(folder.deleted_at)}
              </span>
            </div>
            <button
              className="button button--secondary"
              disabled={isSaving}
              onClick={() => onRestore(folder)}
              type="button"
            >
              Restore
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
