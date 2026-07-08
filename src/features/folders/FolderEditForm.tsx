import { type FormEvent, useEffect, useState } from 'react'
import type { FolderCategory } from '../../lib/database.types'
import { categoryOptions, formatDateInputValue } from '../../lib/growtDisplay'
import type { Folder } from '../../lib/growtData'
import { formatCurrency, parseRecipientAmount } from '../../lib/recipient'

export type FolderEditValues = {
  category: FolderCategory
  containsExportVideos: boolean
  description: string | null
  dueDate: string | null
  isActive: boolean
  recipientTaskAmount: number
  title: string
}

type FolderEditFormProps = {
  folder: Folder
  isSaving: boolean
  onCancel: () => void
  onSave: (values: FolderEditValues) => void
}

export function FolderEditForm({ folder, isSaving, onCancel, onSave }: FolderEditFormProps) {
  const [title, setTitle] = useState(folder.title)
  const [description, setDescription] = useState(folder.description ?? '')
  const [category, setCategory] = useState<FolderCategory>(folder.category)
  const [containsExportVideos, setContainsExportVideos] = useState(folder.contains_export_videos)
  const [recipientTaskAmount, setRecipientTaskAmount] = useState(String(folder.recipient_task_amount ?? 0))
  const [dueDate, setDueDate] = useState(formatDateInputValue(folder.due_date))
  const [isActive, setIsActive] = useState(folder.is_active)

  useEffect(() => {
    setTitle(folder.title)
    setDescription(folder.description ?? '')
    setCategory(folder.category)
    setContainsExportVideos(folder.contains_export_videos)
    setRecipientTaskAmount(String(folder.recipient_task_amount ?? 0))
    setDueDate(formatDateInputValue(folder.due_date))
    setIsActive(folder.is_active)
  }, [folder])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    onSave({
      category,
      containsExportVideos,
      description: description.trim() || null,
      dueDate: dueDate || null,
      isActive,
      recipientTaskAmount: parseRecipientAmount(recipientTaskAmount),
      title: title.trim(),
    })
  }

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <label htmlFor="edit-folder-title">Folder title</label>
      <input
        id="edit-folder-title"
        onChange={(event) => setTitle(event.target.value)}
        required
        value={title}
      />
      <label htmlFor="edit-folder-description">Description</label>
      <textarea
        id="edit-folder-description"
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        value={description}
      />
      <div className="form-grid">
        <label htmlFor="edit-folder-category">
          Category
          <select
            id="edit-folder-category"
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
        <label htmlFor="edit-folder-due">
          Due date
          <input
            id="edit-folder-due"
            onChange={(event) => setDueDate(event.target.value)}
            type="date"
            value={dueDate}
          />
        </label>
      </div>
      <label className="checkbox-row" htmlFor="edit-folder-active">
        <input
          checked={isActive}
          id="edit-folder-active"
          onChange={(event) => setIsActive(event.target.checked)}
          type="checkbox"
        />
        Active folder
      </label>
      <label className="checkbox-row" htmlFor="edit-folder-export-videos">
        <input
          checked={containsExportVideos}
          id="edit-folder-export-videos"
          onChange={(event) => setContainsExportVideos(event.target.checked)}
          type="checkbox"
        />
        Contains export videos
      </label>
      <label htmlFor="edit-folder-recipient-inline">
        Default recipient amount per task
        <input
          id="edit-folder-recipient-inline"
          min="0"
          onChange={(event) => setRecipientTaskAmount(event.target.value)}
          step="0.01"
          type="number"
          value={recipientTaskAmount}
        />
        <span className="text-xs text-on-surface-variant">
          New tasks start at {formatCurrency(parseRecipientAmount(recipientTaskAmount))}.
        </span>
      </label>
      <div className="form-actions">
        <button className="button button--secondary" disabled={isSaving} onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="button button--primary" disabled={isSaving} type="submit">
          {isSaving ? 'Saving' : 'Save folder'}
        </button>
      </div>
    </form>
  )
}
