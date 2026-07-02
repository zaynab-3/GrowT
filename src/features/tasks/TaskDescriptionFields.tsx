import { AlignLeft, ListChecks, Plus, Trash2 } from 'lucide-react'
import type { TaskDescriptionMode } from './taskDescriptionUtils'

type TaskDescriptionFieldsProps = {
  checklistItems: string[]
  compact?: boolean
  description: string
  descriptionPlaceholder?: string
  idPrefix: string
  mode: TaskDescriptionMode
  onChecklistItemsChange: (items: string[]) => void
  onDescriptionChange: (description: string) => void
  onModeChange: (mode: TaskDescriptionMode) => void
}

export function TaskDescriptionFields({
  checklistItems,
  compact = false,
  description,
  descriptionPlaceholder = 'Describe what needs to be done...',
  idPrefix,
  mode,
  onChecklistItemsChange,
  onDescriptionChange,
  onModeChange,
}: TaskDescriptionFieldsProps) {
  const visibleChecklistItems = checklistItems.length ? checklistItems : ['']

  function updateChecklistItem(index: number, value: string) {
    onChecklistItemsChange(
      visibleChecklistItems.map((item, itemIndex) => (itemIndex === index ? value : item)),
    )
  }

  function addChecklistItem() {
    onChecklistItemsChange([...visibleChecklistItems, ''])
  }

  function removeChecklistItem(index: number) {
    const nextItems = visibleChecklistItems.filter((_, itemIndex) => itemIndex !== index)
    onChecklistItemsChange(nextItems.length ? nextItems : [''])
  }

  return (
    <div className={`task-description-fields ${compact ? 'task-description-fields--compact' : ''}`}>
      <div className="task-mode-toggle" aria-label="Task content type" role="group">
        <button
          aria-pressed={mode === 'description'}
          className={`task-mode-toggle__button ${mode === 'description' ? 'task-mode-toggle__button--active' : ''}`}
          onClick={() => onModeChange('description')}
          type="button"
        >
          <AlignLeft size={15} />
          Description
        </button>
        <button
          aria-pressed={mode === 'checklist'}
          className={`task-mode-toggle__button ${mode === 'checklist' ? 'task-mode-toggle__button--active' : ''}`}
          onClick={() => onModeChange('checklist')}
          type="button"
        >
          <ListChecks size={15} />
          Checklist
        </button>
      </div>

      {mode === 'description' ? (
        <div className="task-description-fields__panel">
          <textarea
            id={`${idPrefix}-description`}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder={descriptionPlaceholder}
            rows={compact ? 2 : 3}
            value={description}
          />
        </div>
      ) : (
        <div className="task-description-fields__panel task-checklist-editor">
          {visibleChecklistItems.map((item, index) => (
            <div className="task-checklist-editor__row" key={`${idPrefix}-item-${index}`}>
              <span className="task-checklist-editor__index">{index + 1}</span>
              <input
                aria-label={`Checklist item ${index + 1}`}
                onChange={(event) => updateChecklistItem(index, event.target.value)}
                placeholder={index === 0 ? 'First step to complete' : 'Next step'}
                value={item}
              />
              <button
                aria-label={`Remove checklist item ${index + 1}`}
                className="task-checklist-editor__remove"
                disabled={visibleChecklistItems.length === 1}
                onClick={() => removeChecklistItem(index)}
                type="button"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button className="task-checklist-editor__add" onClick={addChecklistItem} type="button">
            <Plus size={14} />
            Add item
          </button>
        </div>
      )}
    </div>
  )
}
