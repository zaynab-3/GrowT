import { type FormEvent, useEffect, useState } from 'react'
import type { FolderCategory } from '../../lib/database.types'
import { categoryOptions, formatDateInputValue } from '../../lib/growtDisplay'
import type { Task } from '../../lib/growtData'

export type TaskEditValues = {
  assignedUserId: string | null
  category: FolderCategory
  description: string | null
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
}

export function TaskEditForm({
  assignableMembers,
  isSaving,
  onCancel,
  onSave,
  task,
}: TaskEditFormProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [category, setCategory] = useState<FolderCategory>(task.category)
  const [dueDate, setDueDate] = useState(formatDateInputValue(task.due_date))
  const [isActive, setIsActive] = useState(task.is_active)
  const [assignedUserId, setAssignedUserId] = useState(task.assigned_user_id ?? '')

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description ?? '')
    setCategory(task.category)
    setDueDate(formatDateInputValue(task.due_date))
    setIsActive(task.is_active)
    setAssignedUserId(task.assigned_user_id ?? '')
  }, [task])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    onSave({
      assignedUserId: assignedUserId || null,
      category,
      description: description.trim() || null,
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
      <label htmlFor={`edit-task-description-${task.id}`}>Description</label>
      <textarea
        id={`edit-task-description-${task.id}`}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        value={description}
      />
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
