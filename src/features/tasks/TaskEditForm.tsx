import { type FormEvent, useEffect, useState } from 'react'
import type { FolderCategory } from '../../lib/database.types'
import { categoryOptions, formatDateInputValue } from '../../lib/growtDisplay'
import type { Task, TaskLevel } from '../../lib/growtData'
import { TaskDescriptionFields } from './TaskDescriptionFields'
import { getInitialChecklistItems, normalizeChecklistItems, type TaskDescriptionMode } from './taskDescriptionUtils'

export type TaskEditValues = {
  assignedUserId: string | null
  category: FolderCategory
  checklistItems: string[]
  description: string | null
  descriptionMode: TaskDescriptionMode
  dueDate: string | null
  isActive: boolean
  title: string
}

type AssignableMember = {
  id: string
  label: string
}

type TaskEditFormProps = {
  assignableMembers: AssignableMember[]
  isSaving: boolean
  onCancel: () => void
  onSave: (values: TaskEditValues) => void
  task: Task
  taskLevels: TaskLevel[]
}

export function TaskEditForm({
  assignableMembers,
  isSaving,
  onCancel,
  onSave,
  task,
  taskLevels,
}: TaskEditFormProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [descriptionMode, setDescriptionMode] = useState<TaskDescriptionMode>(
    taskLevels.length ? 'checklist' : 'description',
  )
  const [checklistItems, setChecklistItems] = useState<string[]>(
    getInitialChecklistItems(taskLevels.map((level) => level.title ?? level.description ?? '')),
  )
  const [category, setCategory] = useState<FolderCategory>(task.category)
  const [dueDate, setDueDate] = useState(formatDateInputValue(task.due_date))
  const [isActive, setIsActive] = useState(task.is_active)
  const [assignedUserId, setAssignedUserId] = useState(task.assigned_user_id ?? '')

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description ?? '')
    setDescriptionMode(taskLevels.length ? 'checklist' : 'description')
    setChecklistItems(getInitialChecklistItems(taskLevels.map((level) => level.title ?? level.description ?? '')))
    setCategory(task.category)
    setDueDate(formatDateInputValue(task.due_date))
    setIsActive(task.is_active)
    setAssignedUserId(task.assigned_user_id ?? '')
  }, [task, taskLevels])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    onSave({
      assignedUserId: assignedUserId || null,
      category,
      checklistItems: descriptionMode === 'checklist' ? normalizeChecklistItems(checklistItems) : [],
      description: descriptionMode === 'description' ? description.trim() || null : null,
      descriptionMode,
      dueDate: dueDate || null,
      isActive,
      title: title.trim(),
    })
  }

  return (
    <form className="edit-form edit-form--task" onSubmit={handleSubmit}>
      <label htmlFor={`edit-task-title-${task.id}`}>Task title</label>
      <input
        id={`edit-task-title-${task.id}`}
        onChange={(event) => setTitle(event.target.value)}
        required
        value={title}
      />
      <label>Description</label>
      <TaskDescriptionFields
        checklistItems={checklistItems}
        description={description}
        idPrefix={`edit-task-${task.id}`}
        mode={descriptionMode}
        onChecklistItemsChange={setChecklistItems}
        onDescriptionChange={setDescription}
        onModeChange={setDescriptionMode}
      />
      <div className="text-xs text-on-surface-variant mt-1.5 mb-3 flex flex-wrap gap-1 items-center" style={{ lineHeight: 1.4 }}>
        Want to transfer files for this task? Upload them at <a href="https://www.swisstransfer.com/en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">SwissTransfer</a> and paste the link here.
      </div>
      <div className="form-grid">
        <label htmlFor={`edit-task-category-${task.id}`}>
          Category
          <select
            id={`edit-task-category-${task.id}`}
            onChange={(event) => setCategory(event.target.value as FolderCategory)}
            value={category}
          >
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`edit-task-due-${task.id}`}>
          Due date
          <input
            id={`edit-task-due-${task.id}`}
            onChange={(event) => setDueDate(event.target.value)}
            type="date"
            value={dueDate}
          />
        </label>
        <label htmlFor={`edit-task-assignee-${task.id}`}>
          Assignee
          <select
            id={`edit-task-assignee-${task.id}`}
            onChange={(event) => setAssignedUserId(event.target.value)}
            value={assignedUserId}
          >
            <option value="">Unassigned</option>
            {assignableMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="checkbox-row" htmlFor={`edit-task-active-${task.id}`}>
        <input
          checked={isActive}
          id={`edit-task-active-${task.id}`}
          onChange={(event) => setIsActive(event.target.checked)}
          type="checkbox"
        />
        Active task
      </label>
      <div className="form-actions">
        <button className="button button--secondary" disabled={isSaving} onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="button button--primary" disabled={isSaving} type="submit">
          {isSaving ? 'Saving' : 'Save task'}
        </button>
      </div>
    </form>
  )
}
