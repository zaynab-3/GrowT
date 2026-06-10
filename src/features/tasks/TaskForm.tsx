import { type FormEvent, useEffect, useState } from 'react'
import type { FolderCategory } from '../../lib/database.types'
import { categoryOptions } from '../../lib/growtDisplay'

export type TaskCreateValues = {
  category: FolderCategory
  description: string | null
  title: string
  inviteUsernames?: string[]
}

type TaskFormProps = {
  defaultCategory: FolderCategory
  isSaving: boolean
  onCreate: (values: TaskCreateValues) => void
  showCategory?: boolean
  submitLabel?: string
}

export function TaskForm({
  defaultCategory,
  isSaving,
  onCreate,
  showCategory = false,
  submitLabel = 'Add task',
}: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<FolderCategory>(defaultCategory)

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
      description: description.trim() || null,
      title: title.trim(),
    })
    setTitle('')
    setDescription('')
    setCategory(defaultCategory)
  }

  return (
    <form className={`task-form ${showCategory ? 'task-form--with-category' : ''}`} onSubmit={handleSubmit}>
      <input
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Task title"
        required
        value={title}
      />
      <input
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description"
        value={description}
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
    </form>
  )
}
