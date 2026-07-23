import { UserAvatar } from '../../components/UserAvatar'
import type { TaskProgressStatus } from '../../lib/database.types'
import type { TaskStatusAction } from '../../lib/growtData'

export type StatusContribution = {
  action: TaskStatusAction
  userId: string
}

type TaskStatusParticipantsProps = {
  rows: StatusContribution[]
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  showEmpty?: boolean
}

export function TaskStatusParticipants({
  rows,
  getProfileAvatar,
  getProfileLabel,
  showEmpty = false,
}: TaskStatusParticipantsProps) {
  if (!rows.length) {
    return showEmpty ? <span className="task-status-participants task-status-participants--empty">—</span> : null
  }

  return (
    <span className="task-status-participants">
      {rows.map((row) => {
        const label = getProfileLabel(row.userId)

        return (
          <span
            className="task-status-person"
            key={`${row.action.id}:${row.userId}`}
            title={label}
          >
            <UserAvatar
              label={label}
              avatarUrl={getProfileAvatar(row.userId)}
              className="task-status-person__avatar"
            />
            <span className="task-status-person__name">{label}</span>
          </span>
        )
      })}
    </span>
  )
}

export type TaskStatusContributions = Record<TaskProgressStatus, StatusContribution[]>
