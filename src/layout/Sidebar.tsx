import type { FormEvent } from 'react'
import type { FolderCategory } from '../lib/database.types'
import { categoryOptions } from '../lib/growtDisplay'
import type { Folder } from '../lib/growtData'
import { FolderList } from '../features/folders/FolderList'
import { FolderRestorePanel } from '../features/folders/FolderRestorePanel'
import { SearchBar } from '../features/search/SearchBar'
import { SearchResults } from '../features/search/SearchResults'

type SidebarProps = {
  activeFolderId: string | null
  deletedFolders: Folder[]
  filteredFolders: Folder[]
  folderCategory: FolderCategory
  folderDescription: string
  folderTitle: string
  foldersCount: number
  isSaving: boolean
  normalizedSearchQuery: string
  onCreateFolder: (event: FormEvent<HTMLFormElement>) => void
  onFolderCategoryChange: (category: FolderCategory) => void
  onFolderDescriptionChange: (description: string) => void
  onFolderTitleChange: (title: string) => void
  onProfileDisplayNameChange: (displayName: string) => void
  onProfileUsernameChange: (username: string) => void
  onRestoreFolder: (folder: Folder) => void
  onSaveProfile: (event: FormEvent<HTMLFormElement>) => void
  onSearchChange: (query: string) => void
  onSelectFolder: (folderId: string) => void
  profileDisplayName: string
  profileUsername: string
  searchQuery: string
}

export function Sidebar({
  activeFolderId,
  deletedFolders,
  filteredFolders,
  folderCategory,
  folderDescription,
  folderTitle,
  foldersCount,
  isSaving,
  normalizedSearchQuery,
  onCreateFolder,
  onFolderCategoryChange,
  onFolderDescriptionChange,
  onFolderTitleChange,
  onProfileDisplayNameChange,
  onProfileUsernameChange,
  onRestoreFolder,
  onSaveProfile,
  onSearchChange,
  onSelectFolder,
  profileDisplayName,
  profileUsername,
  searchQuery,
}: SidebarProps) {
  return (
    <aside className="side-panel">
      <div className="panel-heading">
        <h2>Folders</h2>
        <SearchResults
          hasQuery={Boolean(normalizedSearchQuery)}
          totalCount={foldersCount}
          visibleCount={filteredFolders.length}
        />
      </div>

      <SearchBar onChange={onSearchChange} value={searchQuery} />

      <FolderList
        activeFolderId={activeFolderId}
        emptyMessage={normalizedSearchQuery ? 'No folders match this search.' : 'No folders yet.'}
        folders={filteredFolders}
        onSelectFolder={onSelectFolder}
      />

      <FolderRestorePanel folders={deletedFolders} isSaving={isSaving} onRestore={onRestoreFolder} />

      <form className="stack-form" onSubmit={onCreateFolder}>
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

      <form className="stack-form profile-form" onSubmit={onSaveProfile}>
        <label htmlFor="profile-name">Profile</label>
        <input
          id="profile-name"
          onChange={(event) => onProfileDisplayNameChange(event.target.value)}
          placeholder="Display name"
          value={profileDisplayName}
        />
        <input
          aria-label="Username"
          onChange={(event) => onProfileUsernameChange(event.target.value)}
          placeholder="username"
          value={profileUsername}
        />
        <button className="button button--secondary" disabled={isSaving} type="submit">
          Save profile
        </button>
      </form>
    </aside>
  )
}
