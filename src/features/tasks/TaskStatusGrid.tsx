import { statusColumns } from '../../lib/growtDisplay'
import { CircleCheckBig, CircleDot, CircleGauge } from 'lucide-react'
import { TaskStatusParticipants, type TaskStatusContributions } from './TaskStatusParticipants'

type TaskStatusGridProps = {
  contributions?: TaskStatusContributions
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
}

const statusIcons = {
  completed: CircleCheckBig,
  half_done: CircleGauge,
  ongoing: CircleDot,
} as const

export function TaskStatusGrid({
  contributions,
  getProfileAvatar,
  getProfileLabel,
}: TaskStatusGridProps) {
  return (
    <div className="task-activity-grid grid grid-cols-1 sm:grid-cols-3 gap-6">
      {statusColumns.map((status) => {
        const rows = contributions?.[status.id] ?? []
        const StatusIcon = statusIcons[status.id]

        return (
          <div className="task-activity-column flex flex-col gap-3 bg-surface-container-low dark:bg-black/20 p-4 rounded-2xl border border-outline-variant/30" key={status.id}>
            <span className={`task-activity-column__title font-title-lg text-title-lg font-bold pb-2 border-b ${
              status.id === 'ongoing' ? 'text-ongoing-color border-ongoing-color/30' :
              status.id === 'half_done' ? 'text-halfdone-color border-halfdone-color/30' :
              'text-done-color border-done-color/30'
            }`}>
              <StatusIcon aria-hidden="true" size={15} />
              <span>{status.label}</span>
            </span>
            <div className="task-activity-column__people flex flex-col gap-2">
              {rows.map((row) => {
                return (
                  <div className="task-activity-person flex items-center gap-3 rounded-lg border border-outline-variant/20 bg-white/50 p-2 px-3 dark:bg-white/5" key={row.action.id}>
                    <TaskStatusParticipants
                      rows={[row]}
                      getProfileAvatar={getProfileAvatar}
                      getProfileLabel={getProfileLabel}
                    />
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
