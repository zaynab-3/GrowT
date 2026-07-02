import { Check } from 'lucide-react'
import type { TaskLevel } from '../../lib/growtData'

type TaskChecklistProps = {
  completedLevelIds: Set<string>
  disabled?: boolean
  levels: TaskLevel[]
  onToggle: (levelId: string, checked: boolean) => void
  pendingAction: string | null
}

export function TaskChecklist({
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

  return (
    <div className={`task-checklist ${allCompleted ? 'task-checklist--complete' : ''}`}>
      <div className="task-checklist__summary">
        <span>{completedCount}/{levels.length} done</span>
      </div>

      <div className="task-checklist__items">
        {levels.map((level, index) => {
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
              <span className="task-checklist__index">{index + 1}.</span>
              <span className="task-checklist__label">{label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
