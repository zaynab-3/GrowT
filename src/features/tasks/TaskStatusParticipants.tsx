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
}

export function TaskStatusParticipants({
  rows,
  getProfileAvatar,
  getProfileLabel,
}: TaskStatusParticipantsProps) {
  if (!rows.length) {
    return null
  }

  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
      {rows.map((row) => {
        const label = getProfileLabel(row.userId)

        return (
          <span
            className="inline-flex max-w-full items-center gap-1 rounded-full border border-outline-variant/40 bg-white/70 px-1.5 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-on-surface shadow-sm dark:bg-white/10 dark:text-white"
            key={`${row.action.id}:${row.userId}`}
            title={label}
          >
            <UserAvatar
              label={label}
              avatarUrl={getProfileAvatar(row.userId)}
              className="h-4 w-4 shrink-0 text-[9px]"
            />
            <span className="max-w-[7rem] truncate">{label}</span>
          </span>
        )
      })}
    </span>
  )
}

export type TaskStatusContributions = Record<TaskProgressStatus, StatusContribution[]>
