import { type FormEvent, useEffect, useState } from 'react'
import type { FolderCategory } from '../../lib/database.types'
import { categoryOptions } from '../../lib/growtDisplay'
import { TaskDescriptionFields } from './TaskDescriptionFields'
import { getInitialChecklistItems, normalizeChecklistItems, type TaskDescriptionMode } from './taskDescriptionUtils'

export type TaskCreateValues = {
  category: FolderCategory
  checklistItems: string[]
  description: string | null
  descriptionMode: TaskDescriptionMode
  hasExportButton: boolean
  title: string
  inviteUsernames?: string[]
}

type TaskFormProps = {
  defaultCategory: FolderCategory
  forceExportButton?: boolean
  isSaving: boolean
  onCreate: (values: TaskCreateValues) => void
  showCategory?: boolean
  submitLabel?: string
}

export function TaskForm({
  defaultCategory,
  forceExportButton = false,
  isSaving,
  onCreate,
  showCategory = false,
  submitLabel = 'Add task',
}: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [descriptionMode, setDescriptionMode] = useState<TaskDescriptionMode>('description')
  const [checklistItems, setChecklistItems] = useState<string[]>([''])
  const [category, setCategory] = useState<FolderCategory>(defaultCategory)
  const [hasExportButton, setHasExportButton] = useState(false)

  useEffect(() => {
    setCategory(defaultCategory)
  }, [defaultCategory])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    onCreate({
      category,
      checklistItems: descriptionMode === 'checklist' ? normalizeChecklistItems(checklistItems) : [],
      description: descriptionMode === 'description' ? description.trim() || null : null,
      descriptionMode,
      hasExportButton,
      title: title.trim(),
    })
    setTitle('')
    setDescription('')
    setDescriptionMode('description')
    setChecklistItems(getInitialChecklistItems([]))
    setHasExportButton(false)
    setCategory(defaultCategory)
  }

  return (
    <form className={`task-form ${showCategory ? 'task-form--with-category' : ''}`} onSubmit={handleSubmit}>
      <div className="task-form__primary-row">
        <input
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Task title"
          required
          value={title}
        />
        {showCategory ? (
          <select
            aria-label="Task category"
            onChange={(event) => setCategory(event.target.value as FolderCategory)}
            value={category}
          >
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}
        <button className="button button--primary" disabled={isSaving} type="submit">
          {submitLabel}
        </button>
      </div>

      <TaskDescriptionFields
        checklistItems={checklistItems}
        compact
        description={description}
        descriptionPlaceholder="Optional details..."
        idPrefix="quick-task"
        mode={descriptionMode}
        onChecklistItemsChange={setChecklistItems}
        onDescriptionChange={setDescription}
        onModeChange={setDescriptionMode}
      />

      {!forceExportButton && (
        <label className="checkbox-row" htmlFor="quick-task-export-button">
          <input
            checked={hasExportButton}
            id="quick-task-export-button"
            onChange={(event) => setHasExportButton(event.target.checked)}
            type="checkbox"
          />
          Export video task
        </label>
      )}
    </form>
  )
}
