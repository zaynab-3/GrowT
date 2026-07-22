import { type FormEvent, useEffect, useState } from 'react'
import type { FolderCategory } from '../../lib/database.types'
import { categoryOptions, formatDateInputValue } from '../../lib/growtDisplay'
import type { Task, TaskLevel } from '../../lib/growtData'
import { formatCurrency, parseRecipientAmount } from '../../lib/recipient'
import { TaskDescriptionFields } from './TaskDescriptionFields'
import { getInitialChecklistItems, normalizeChecklistItems } from './taskDescriptionUtils'

export type TaskEditValues = {
  assignedUserId: string | null
  category: FolderCategory
  checklistItems: string[]
  description: string | null
  dueDate: string | null
  hasExportButton: boolean
  isActive: boolean
  recipientAmount: number
  title: string
}

type AssignableMember = {
  id: string
  label: string
}

type TaskEditFormProps = {
  assignableMembers: AssignableMember[]
  canEditRecipientAmount?: boolean
  forceExportButton?: boolean
  isSaving: boolean
  onCancel: () => void
  onSave: (values: TaskEditValues) => void
  task: Task
  taskLevels: TaskLevel[]
}

export function TaskEditForm({
  assignableMembers,
  canEditRecipientAmount = true,
  forceExportButton = false,
  isSaving,
  onCancel,
  onSave,
  task,
  taskLevels,
}: TaskEditFormProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [checklistItems, setChecklistItems] = useState<string[]>(
    getInitialChecklistItems(taskLevels.map((level) => level.title ?? level.description ?? '')),
  )
  const [category, setCategory] = useState<FolderCategory>(task.category)
  const [dueDate, setDueDate] = useState(formatDateInputValue(task.due_date))
  const [hasExportButton, setHasExportButton] = useState(task.has_export_button)
  const [isActive, setIsActive] = useState(task.is_active)
  const [assignedUserId, setAssignedUserId] = useState(task.assigned_user_id ?? '')
  const [recipientAmount, setRecipientAmount] = useState(String(task.recipient_amount ?? 0))

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description ?? '')
    setChecklistItems(getInitialChecklistItems(taskLevels.map((level) => level.title ?? level.description ?? '')))
    setCategory(task.category)
    setDueDate(formatDateInputValue(task.due_date))
    setHasExportButton(task.has_export_button)
    setIsActive(task.is_active)
    setAssignedUserId(task.assigned_user_id ?? '')
    setRecipientAmount(String(task.recipient_amount ?? 0))
  }, [task, taskLevels])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    onSave({
      assignedUserId: assignedUserId || null,
      category,
      checklistItems: normalizeChecklistItems(checklistItems),
      description: description.trim() || null,
      dueDate: dueDate || null,
      hasExportButton,
      isActive,
      recipientAmount: canEditRecipientAmount
        ? parseRecipientAmount(recipientAmount)
        : task.recipient_amount,
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
        onChecklistItemsChange={setChecklistItems}
        onDescriptionChange={setDescription}
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
      {canEditRecipientAmount && (
        <label htmlFor={`edit-task-recipient-${task.id}`}>
          Recipient amount
          <input
            id={`edit-task-recipient-${task.id}`}
            min="0"
            onChange={(event) => setRecipientAmount(event.target.value)}
            step="0.01"
            type="number"
            value={recipientAmount}
          />
          <span className="form-helper">
            Current task payout is {formatCurrency(parseRecipientAmount(recipientAmount))}.
          </span>
        </label>
      )}
      <label className="checkbox-row" htmlFor={`edit-task-active-${task.id}`}>
        <input
          checked={isActive}
          id={`edit-task-active-${task.id}`}
          onChange={(event) => setIsActive(event.target.checked)}
          type="checkbox"
        />
        Active task
      </label>
      {!forceExportButton && (
        <label className="checkbox-row" htmlFor={`edit-task-export-${task.id}`}>
          <input
            checked={hasExportButton}
            id={`edit-task-export-${task.id}`}
            onChange={(event) => setHasExportButton(event.target.checked)}
            type="checkbox"
          />
          Export video task
        </label>
      )}
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
