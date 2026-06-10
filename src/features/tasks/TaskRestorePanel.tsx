import { formatDateTime, formatRestoreWindow, getCategoryLabel } from '../../lib/growtDisplay'
import type { Task } from '../../lib/growtData'

type TaskRestorePanelProps = {
  getFolderLabel: (folderId: string | null) => string
  isSaving: boolean
  onRestore: (task: Task) => void
  onHardDelete?: (task: Task) => void
  tasks: Task[]
}

export function TaskRestorePanel({
  getFolderLabel,
  isSaving,
  onRestore,
  onHardDelete,
  tasks,
}: TaskRestorePanelProps) {
  if (!tasks.length) {
    return null
  }

  return (
    <div className="stitch-panel">
      <div className="stitch-panel__header">
        <h3 className="stitch-panel__title">Deleted Tasks</h3>
        <span className="stitch-count-badge">{tasks.length}</span>
      </div>
      <div className="stitch-panel__body" style={{ padding: 0 }}>
        <div className="stitch-member-list" style={{ gap: 0 }}>
          {tasks.map((task) => (
            <div className="stitch-member-row" key={task.id} style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid var(--border)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                <span className="stitch-member-name">{task.title}</span>
                <span style={{ fontSize: '13px', color: 'var(--ink-2)' }}>
                  {getCategoryLabel(task.category)} · {getFolderLabel(task.folder_id)} · Deleted {formatDateTime(task.deleted_at)}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{formatRestoreWindow(task.deleted_at)}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                <button
                  className="btn btn--secondary btn--sm"
                  disabled={isSaving}
                  onClick={() => onRestore(task)}
                  type="button"
                >
                  Restore
                </button>
                {onHardDelete && (
                  <button
                    className="btn btn--secondary btn--sm"
                    disabled={isSaving}
                    onClick={() => onHardDelete(task)}
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
