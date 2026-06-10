import type { FormEvent } from 'react'
import type { FolderCategory } from '../../lib/database.types'
import { categoryOptions } from '../../lib/growtDisplay'

export type FolderCreateValues = {
  category: FolderCategory
  description: string | null
  title: string
  inviteUsernames?: string[]
}

type FolderCreateFormProps = {
  folderCategory: FolderCategory
  folderDescription: string
  folderTitle: string
  isSaving: boolean
  onCreateFolder: (event: FormEvent<HTMLFormElement>) => void
  onFolderCategoryChange: (category: FolderCategory) => void
  onFolderDescriptionChange: (description: string) => void
  onFolderTitleChange: (title: string) => void
}

export function FolderCreateForm({
  folderCategory,
  folderDescription,
  folderTitle,
  isSaving,
  onCreateFolder,
  onFolderCategoryChange,
  onFolderDescriptionChange,
  onFolderTitleChange,
}: FolderCreateFormProps) {
  return (
    <form className="stack-form folder-create-form" onSubmit={onCreateFolder}>
      <label htmlFor="folder-title">New folder</label>
      <input
        id="folder-title"
        onChange={(event) => onFolderTitleChange(event.target.value)}
        placeholder="Launch plan"
        required
        value={folderTitle}
      />
      <textarea
        onChange={(event) => onFolderDescriptionChange(event.target.value)}
        placeholder="What this folder is for"
        rows={3}
        value={folderDescription}
      />
      <select
        aria-label="Folder category"
        onChange={(event) => onFolderCategoryChange(event.target.value as FolderCategory)}
        value={folderCategory}
      >
        {categoryOptions.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label}
          </option>
        ))}
      </select>
      <button className="button button--primary" disabled={isSaving} type="submit">
        Create folder
      </button>
    </form>
  )
}
