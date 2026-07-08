import type { FormEvent } from 'react'
import type { FolderCategory } from '../../lib/database.types'
import { categoryOptions } from '../../lib/growtDisplay'
import { formatCurrency, parseRecipientAmount } from '../../lib/recipient'

export type FolderCreateValues = {
  category: FolderCategory
  containsExportVideos: boolean
  description: string | null
  recipientTaskAmount: number
  title: string
  inviteUsernames?: string[]
}

type FolderCreateFormProps = {
  folderCategory: FolderCategory
  folderContainsExportVideos: boolean
  folderDescription: string
  folderRecipientTaskAmount?: string
  folderTitle: string
  isSaving: boolean
  onCreateFolder: (event: FormEvent<HTMLFormElement>) => void
  onFolderCategoryChange: (category: FolderCategory) => void
  onFolderContainsExportVideosChange: (containsExportVideos: boolean) => void
  onFolderDescriptionChange: (description: string) => void
  onFolderRecipientTaskAmountChange?: (amount: string) => void
  onFolderTitleChange: (title: string) => void
}

export function FolderCreateForm({
  folderCategory,
  folderContainsExportVideos,
  folderDescription,
  folderRecipientTaskAmount = '',
  folderTitle,
  isSaving,
  onCreateFolder,
  onFolderCategoryChange,
  onFolderContainsExportVideosChange,
  onFolderDescriptionChange,
  onFolderRecipientTaskAmountChange,
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
      <label className="checkbox-row" htmlFor="folder-export-videos">
        <input
          checked={folderContainsExportVideos}
          id="folder-export-videos"
          onChange={(event) => onFolderContainsExportVideosChange(event.target.checked)}
          type="checkbox"
        />
        Contains export videos
      </label>
      <label htmlFor="folder-recipient-amount">
        Default recipient amount per task
        <input
          id="folder-recipient-amount"
          min="0"
          onChange={(event) => onFolderRecipientTaskAmountChange?.(event.target.value)}
          placeholder="12.00"
          step="0.01"
          type="number"
          value={folderRecipientTaskAmount}
        />
        <span className="form-helper">
          Each new task starts at {formatCurrency(parseRecipientAmount(folderRecipientTaskAmount || '0'))}.
        </span>
      </label>
      <button className="button button--primary" disabled={isSaving} type="submit">
        Create folder
      </button>
    </form>
  )
}
