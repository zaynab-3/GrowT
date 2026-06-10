import { formatDateTime, formatRestoreWindow, getCategoryLabel } from '../../lib/growtDisplay'
import type { Folder } from '../../lib/growtData'

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
    <div className="stitch-panel">
      <div className="stitch-panel__header">
        <h3 className="stitch-panel__title">Deleted Folders</h3>
        <span className="stitch-count-badge">{folders.length}</span>
      </div>
      <div className="stitch-panel__body" style={{ padding: 0 }}>
        <div className="stitch-member-list" style={{ gap: 0 }}>
          {folders.map((folder) => (
            <div className="stitch-member-row" key={folder.id} style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid var(--border)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                <span className="stitch-member-name">{folder.title}</span>
                <span style={{ fontSize: '13px', color: 'var(--ink-2)' }}>
                  {getCategoryLabel(folder.category)} · Deleted {formatDateTime(folder.deleted_at)}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{formatRestoreWindow(folder.deleted_at)}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                <button
                  className="btn btn--secondary btn--sm"
                  disabled={isSaving}
                  onClick={() => onRestore(folder)}
                  type="button"
                >
                  Restore
                </button>
                {onHardDelete && (
                  <button
                    className="btn btn--secondary btn--sm"
                    disabled={isSaving}
                    onClick={() => onHardDelete(folder)}
                    type="button"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
