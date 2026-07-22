import { formatDateTime, formatRestoreWindow, getCategoryLabel } from '../../lib/growtDisplay'
import type { Folder } from '../../lib/growtData'
import { RotateCcw, Trash2 } from 'lucide-react'

type FolderRestorePanelProps = {
  folders: Folder[]
  isSaving: boolean
  onRestore: (folder: Folder) => void
  onHardDelete?: (folder: Folder) => void
}

export function FolderRestorePanel({ folders, isSaving, onRestore, onHardDelete }: FolderRestorePanelProps) {
  if (!folders.length) {
    return null
  }

  return (
    <section className="stitch-panel restore-panel">
      <div className="stitch-panel__header restore-panel__header">
        <h3 className="stitch-panel__title">Deleted Folders</h3>
        <span className="stitch-count-badge">{folders.length}</span>
      </div>
      <div className="stitch-panel__body restore-panel__body">
        <div className="restore-list">
          {folders.map((folder) => (
            <div className="restore-row" key={folder.id}>
              <div className="restore-row__content">
                <strong className="restore-row__title">{folder.title}</strong>
                <span className="restore-row__meta">
                  {getCategoryLabel(folder.category)} · Deleted {formatDateTime(folder.deleted_at)}
                </span>
                <span className="restore-row__window">{formatRestoreWindow(folder.deleted_at)}</span>
              </div>
              <div className="restore-row__actions">
                <button
                  aria-label={`Restore ${folder.title}`}
                  className="restore-row__button restore-row__button--restore"
                  disabled={isSaving}
                  onClick={() => onRestore(folder)}
                  title="Restore folder"
                  type="button"
                >
                  <RotateCcw size={15} />
                </button>
                {onHardDelete && (
                  <button
                    aria-label={`Delete ${folder.title} permanently`}
                    className="restore-row__button restore-row__button--delete"
                    disabled={isSaving}
                    onClick={() => onHardDelete(folder)}
                    title="Delete permanently"
                    type="button"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
