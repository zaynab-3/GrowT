import { AlignLeft, ListChecks, Plus, Trash2 } from 'lucide-react'

type TaskDescriptionFieldsProps = {
  checklistItems: string[]
  compact?: boolean
  description: string
  descriptionPlaceholder?: string
  idPrefix: string
  onChecklistItemsChange: (items: string[]) => void
  onDescriptionChange: (description: string) => void
}

export function TaskDescriptionFields({
  checklistItems,
  compact = false,
  description,
  descriptionPlaceholder = 'Describe what needs to be done...',
  idPrefix,
  onChecklistItemsChange,
  onDescriptionChange,
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
      <div className="task-description-fields__section">
        <div className="task-description-fields__heading">
          <AlignLeft size={15} />
          Description
          <span>Optional</span>
        </div>
        <div className="task-description-fields__panel">
          <textarea
            id={`${idPrefix}-description`}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder={descriptionPlaceholder || 'Write a note, press Enter for another, or leave a blank line for a new paragraph...'}
            rows={compact ? 2 : 3}
            value={description}
          />
        </div>
        <p className="task-description-fields__hint">
          Enter adds a new note. A blank line starts a paragraph. Use <code>**bold**</code>,{' '}
          <code>*italic*</code>, <code>- lists</code>, or paste a link.
        </p>
      </div>

      <div className="task-description-fields__section">
        <div className="task-description-fields__heading">
          <ListChecks size={15} />
          Checklist
          <span>Optional</span>
        </div>
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
      </div>
    </div>
  )
}
