import { Check } from 'lucide-react'
import type { TaskLevel } from '../../lib/growtData'

type TaskChecklistProps = {
  compact?: boolean
  completedLevelIds: Set<string>
  disabled?: boolean
  levels: TaskLevel[]
  onToggle: (levelId: string, checked: boolean) => void
  pendingAction: string | null
}

export function TaskChecklist({
  compact = false,
  completedLevelIds,
  disabled = false,
  levels,
  onToggle,
  pendingAction,
}: TaskChecklistProps) {
  if (!levels.length) {
    return null
  }

  const completedCount = levels.filter((level) => completedLevelIds.has(level.id)).length
  const allCompleted = completedCount === levels.length
  const visibleLevels = compact ? levels.slice(0, 2) : levels
  const hiddenCount = levels.length - visibleLevels.length
  const progressPercent = Math.round((completedCount / levels.length) * 100)

  if (compact) {
    return (
      <div
        className={`task-checklist task-checklist--compact${
          allCompleted ? ' task-checklist--complete' : ''
        }`}
      >
        <div className="task-checklist__summary">
          <span className="task-checklist__heading">Checklist</span>
          <strong>
            {completedCount} / {levels.length} complete
          </strong>
        </div>

        <div className="task-checklist__timeline">
          {visibleLevels.map((level, index) => {
            const checked = completedLevelIds.has(level.id)
            const isPending = pendingAction === `level:${level.id}`
            const label = level.title?.trim() || level.description?.trim() || `Item ${index + 1}`

            return (
              <label
                className={`task-checklist__timeline-item${
                  checked ? ' task-checklist__timeline-item--checked' : ''
                }`}
                key={level.id}
                onClick={(event) => event.stopPropagation()}
              >
                <span className="task-checklist__timeline-control">
                  <input
                    checked={checked}
                    disabled={disabled || isPending}
                    onChange={(event) => onToggle(level.id, event.target.checked)}
                    type="checkbox"
                  />
                  <span aria-hidden="true" className="task-checklist__timeline-node">
                    {checked ? <Check size={14} strokeWidth={2.8} /> : null}
                  </span>
                </span>
                <span className="task-checklist__timeline-label">{label}</span>
              </label>
            )
          })}

          {hiddenCount > 0 ? (
            <span className="task-checklist__timeline-more">
              <span aria-hidden="true" className="task-checklist__timeline-more-node">
                <Check size={11} />
              </span>
              {hiddenCount} more
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className={`task-checklist${allCompleted ? ' task-checklist--complete' : ''}`}>
      <div className="task-checklist__summary">
        <span className="task-checklist__heading">Checklist</span>
        <strong>{completedCount}/{levels.length}</strong>
      </div>
      <span className="task-checklist__progress" aria-label={`${progressPercent}% complete`}>
        <span style={{ width: `${progressPercent}%` }} />
      </span>

      <div className="task-checklist__items">
        {visibleLevels.map((level, index) => {
          const checked = completedLevelIds.has(level.id)
          const isPending = pendingAction === `level:${level.id}`
          const label = level.title?.trim() || level.description?.trim() || `Item ${index + 1}`

          return (
            <label
              className={`task-checklist__item ${checked ? 'task-checklist__item--checked' : ''}`}
              key={level.id}
              onClick={(event) => event.stopPropagation()}
            >
              <span className="task-checklist__box">
                <input
                  checked={checked}
                  disabled={disabled || isPending}
                  onChange={(event) => onToggle(level.id, event.target.checked)}
                  type="checkbox"
                />
                <Check className="task-checklist__check" size={13} />
              </span>
              {!compact ? <span className="task-checklist__index">{index + 1}.</span> : null}
              <span className="task-checklist__label">{label}</span>
            </label>
          )
        })}
        {hiddenCount > 0 ? (
          <span className="task-checklist__more">+{hiddenCount} more in task details</span>
        ) : null}
      </div>
    </div>
  )
}
