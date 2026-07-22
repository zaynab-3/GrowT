import { statusColumns } from '../../lib/growtDisplay'
import type { TaskStatusAction } from '../../lib/growtData'
import { TaskStatusParticipants, type TaskStatusContributions } from './TaskStatusParticipants'

type TaskStatusGridProps = {
  contributions?: TaskStatusContributions
  currentContributions?: TaskStatusContributions
  currentUserId: string
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  isUndoPending: (action: TaskStatusAction) => boolean
  onUndo: (action: TaskStatusAction) => void
}

export function TaskStatusGrid({
  contributions,
  currentContributions,
  currentUserId,
  getProfileAvatar,
  getProfileLabel,
  isUndoPending,
  onUndo,
}: TaskStatusGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {statusColumns.map((status) => {
        const rows = contributions?.[status.id] ?? []
        const currentActionIds = new Set(
          (currentContributions?.[status.id] ?? rows).map((row) => row.action.id),
        )

        return (
          <div className="flex flex-col gap-3 bg-surface-container-low dark:bg-black/20 p-4 rounded-2xl border border-outline-variant/30" key={status.id}>
            <span className={`font-title-lg text-title-lg font-bold pb-2 border-b ${
              status.id === 'ongoing' ? 'text-ongoing-color border-ongoing-color/30' :
              status.id === 'half_done' ? 'text-halfdone-color border-halfdone-color/30' :
              'text-done-color border-done-color/30'
            }`}>
              {status.label}
            </span>
            <div className="flex flex-col gap-2">
              {rows.map((row) => {
                const canUndo = currentActionIds.has(row.action.id) && row.userId === currentUserId
                const participant = (
                  <TaskStatusParticipants
                    rows={[row]}
                    getProfileAvatar={getProfileAvatar}
                    getProfileLabel={getProfileLabel}
                  />
                )

                if (canUndo) {
                  return (
                    <button
                      aria-label={`Clear ${getProfileLabel(row.userId)}'s ${status.label.toLowerCase()} status`}
                      className="flex w-full items-center gap-3 rounded-lg border border-primary/30 bg-white/70 p-2 px-3 text-left transition-colors hover:bg-primary/5 disabled:opacity-50 dark:bg-white/5"
                      disabled={isUndoPending(row.action)}
                      key={row.action.id}
                      onClick={() => onUndo(row.action)}
                      title="Tap the active status again to clear it"
                      type="button"
                    >
                      {participant}
                    </button>
                  )
                }

                return (
                  <div className="flex items-center gap-3 rounded-lg border border-outline-variant/20 bg-white/50 p-2 px-3 dark:bg-white/5" key={row.action.id}>
                    {participant}
                  </div>
                )
              })}
              {!rows.length ? <span className="text-sm italic text-on-surface-variant/70 text-center py-2">No one yet</span> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
