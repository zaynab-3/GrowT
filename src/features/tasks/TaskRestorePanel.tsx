import { formatDateTime, formatRestoreWindow, getCategoryLabel } from '../../lib/growtDisplay'
import type { Task } from '../../lib/growtData'

type TaskRestorePanelProps = {
  getFolderLabel: (folderId: string | null) => string
  isSaving: boolean
  onRestore: (task: Task) => void
  tasks: Task[]
}

export function TaskRestorePanel({
  getFolderLabel,
  isSaving,
  onRestore,
  tasks,
}: TaskRestorePanelProps) {
  if (!tasks.length) {
    return null
  }

  return (
    <section className="restore-panel" aria-label="Deleted tasks">
      <div className="restore-panel__heading">
        <span className="section-label">Deleted tasks</span>
        <strong>{tasks.length}</strong>
      </div>
      <div className="restore-list">
        {tasks.map((task) => (
          <div className="restore-row" key={task.id}>
            <div>
              <strong>{task.title}</strong>
              <span>
                {getCategoryLabel(task.category)} · {getFolderLabel(task.folder_id)} · Deleted{' '}
                {formatDateTime(task.deleted_at)}
              </span>
              <span>{formatRestoreWindow(task.deleted_at)}</span>
            </div>
            <button
              className="button button--secondary"
              disabled={isSaving}
              onClick={() => onRestore(task)}
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
