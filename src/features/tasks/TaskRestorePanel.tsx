import { formatDateTime, formatRestoreWindow, getCategoryLabel } from '../../lib/growtDisplay'
import type { Task } from '../../lib/growtData'
import { RotateCcw, Trash2 } from 'lucide-react'

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
    <section className="stitch-panel restore-panel">
      <div className="stitch-panel__header restore-panel__header">
        <h3 className="stitch-panel__title">Deleted Tasks</h3>
        <span className="stitch-count-badge">{tasks.length}</span>
      </div>
      <div className="stitch-panel__body restore-panel__body">
        <div className="restore-list">
          {tasks.map((task) => (
            <div className="restore-row" key={task.id}>
              <div className="restore-row__content">
                <strong className="restore-row__title">{task.title}</strong>
                <span className="restore-row__meta">
                  {getCategoryLabel(task.category)} · {getFolderLabel(task.folder_id)} · Deleted {formatDateTime(task.deleted_at)}
                </span>
                <span className="restore-row__window">{formatRestoreWindow(task.deleted_at)}</span>
              </div>
              <div className="restore-row__actions">
                <button
                  aria-label={`Restore ${task.title}`}
                  className="restore-row__button restore-row__button--restore"
                  disabled={isSaving}
                  onClick={() => onRestore(task)}
                  title="Restore task"
                  type="button"
                >
                  <RotateCcw size={15} />
                </button>
                {onHardDelete && (
                  <button
                    aria-label={`Delete ${task.title} permanently`}
                    className="restore-row__button restore-row__button--delete"
                    disabled={isSaving}
                    onClick={() => onHardDelete(task)}
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
