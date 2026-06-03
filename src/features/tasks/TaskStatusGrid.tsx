import type { TaskProgressStatus } from '../../lib/database.types'
import { statusColumns } from '../../lib/growtDisplay'
import type { TaskStatusAction } from '../../lib/growtData'

type StatusContribution = {
  action: TaskStatusAction
  userId: string
}

type TaskStatusGridProps = {
  contributions?: Record<TaskProgressStatus, StatusContribution[]>
  currentUserId: string
  getProfileLabel: (userId: string) => string
  isUndoPending: (action: TaskStatusAction) => boolean
  onUndo: (action: TaskStatusAction) => void
}

export function TaskStatusGrid({
  contributions,
  currentUserId,
  getProfileLabel,
  isUndoPending,
  onUndo,
}: TaskStatusGridProps) {
  return (
    <div className="task-status-grid">
      {statusColumns.map((status) => {
        const rows = contributions?.[status.id] ?? []

        return (
          <div className="task-status-column" key={status.id}>
            <span className={`status-heading status-heading--${status.id}`}>
              {status.label}
            </span>
            <div className="contributor-list">
              {rows.map((row) => {
                const canUndo = row.userId === currentUserId

                return (
                  <span className="contributor-chip" key={row.action.id}>
                    {getProfileLabel(row.userId)}
                    {canUndo ? (
                      <button
                        disabled={isUndoPending(row.action)}
                        onClick={() => onUndo(row.action)}
                        type="button"
                      >
                        Undo
                      </button>
                    ) : null}
                  </span>
                )
              })}
              {!rows.length ? <span className="empty-chip">No one yet</span> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
