import { type FormEvent, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { FolderCategory } from '../lib/database.types'
import { formatDateInputValue, getCategoryLabel } from '../lib/growtDisplay'
import type { Folder } from '../lib/growtData'
import type { FolderEditValues } from '../features/folders/FolderEditForm'
import type { MemberPickerProfile } from '../features/members/memberPickerApi'
import { CategoryPillToggle } from '../components/CategoryPillToggle'
import { UserAvatar } from '../components/UserAvatar'
import { UserSearchDropdown } from '../components/UserSearchDropdown'
import '../styles/forms.css'
import '../styles/components.css'

type FolderFormPageProps = {
  // For new folder
  folderCategory?: FolderCategory
  folderDescription?: string
  folderTitle?: string
  isSaving: boolean
  mode: 'create' | 'edit'
  onBack: () => void
  onCreateFolder?: (event: React.FormEvent, inviteUsernames?: string[]) => void
  onFolderCategoryChange?: (category: FolderCategory) => void
  onFolderDescriptionChange?: (description: string) => void
  onFolderTitleChange?: (title: string) => void
  onUpdateFolder?: (values: FolderEditValues) => void
  // For editing
  folder?: Folder
}

export function FolderFormPage({
  folderCategory,
  folderDescription,
  folderTitle,
  isSaving,
  mode,
  onBack,
  onCreateFolder,
  onFolderCategoryChange,
  onFolderDescriptionChange,
  onFolderTitleChange,
  onUpdateFolder,
  folder,
}: FolderFormPageProps) {
  // Edit mode local state
  const [editTitle, setEditTitle] = useState(folder?.title ?? '')
  const [editDesc, setEditDesc] = useState(folder?.description ?? '')
  const [editCategory, setEditCategory] = useState<FolderCategory>(folder?.category ?? 'personal')
  const [editDueDate, setEditDueDate] = useState(formatDateInputValue(folder?.due_date ?? null))
  const [editIsActive, setEditIsActive] = useState(folder?.is_active ?? true)
  const [inviteUsernames, setInviteUsernames] = useState<string[]>([])
  const [inviteProfilesByUsername, setInviteProfilesByUsername] = useState<Record<string, MemberPickerProfile>>({})
  const [memberUsername, setMemberUsername] = useState('')

  function handleEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTitle.trim() || !onUpdateFolder) return
    onUpdateFolder({
      category: editCategory,
      description: editDesc.trim() || null,
      dueDate: editDueDate || null,
      isActive: editIsActive,
      title: editTitle.trim(),
    })
    setInviteUsernames([])
    setInviteProfilesByUsername({})
  }

  const isEdit = mode === 'edit'

  return (
    <div className="form-page">
      <nav className="breadcrumb">
        <div className="breadcrumb__item">
          <button className="breadcrumb__link" onClick={onBack} type="button">
            <ArrowLeft size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            {isEdit ? 'Folder' : 'Folders'}
          </button>
          <span className="breadcrumb__sep">/</span>
        </div>
        <span className="breadcrumb__current">{isEdit ? 'Edit Folder' : 'New Folder'}</span>
      </nav>

      <div className="workspace-layout-cols mt-4">
        {/* Left Column: Form Card */}
        <div className="workspace-main-col">
          <div className="form-card">
            <div className="form-card__header">
              <span className="text-primary text-[11px] font-bold tracking-wider uppercase mb-1 block">
                {isEdit ? 'Edit Workspace' : 'Create Workspace'}
              </span>
              <h2 className="text-2xl">{isEdit ? `Edit: ${folder?.title}` : 'New Folder'}</h2>
              <p className="mt-1">{isEdit ? 'Update the folder details. Changes save immediately.' : 'Create a new folder to organize your tasks and collaborate with your team.'}</p>
            </div>

            {isEdit ? (
              <form onSubmit={handleEditSubmit}>
                <div className="form-card__body">
                  <div className="form-field">
                    <label htmlFor="edit-folder-title-page">Folder title</label>
                    <input
                      id="edit-folder-title-page"
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="My Project"
                      required
                      value={editTitle}
                    />
                  </div>

                  <div className="form-field">
  <label htmlFor="edit-folder-desc-page">Description</label>
  <textarea
    id="edit-folder-desc-page"
    onChange={(e) => setEditDesc(e.target.value)}
    placeholder="What this folder is about..."
    rows={3}
    value={editDesc}
  />
  <div className="text-xs text-on-surface-variant mt-1.5 flex flex-wrap gap-1 items-center">
    Want to transfer files for this folder? Upload them at{' '}
    <a
      href="https://www.swisstransfer.com/en"
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline font-medium"
    >
      SwissTransfer
    </a>{' '}
    and paste the link here.
  </div>
</div>

                  <div className="form-field">
                    <label>Category</label>
                    <CategoryPillToggle
                      id="edit-folder-cat-page"
                      onChange={setEditCategory}
                      value={editCategory}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="edit-folder-due-page">Due date</label>
                    <div className="date-input-wrapper">
                      <input
                        id="edit-folder-due-page"
                        onChange={(e) => setEditDueDate(e.target.value)}
                        type="date"
                        value={editDueDate}
                      />
                    </div>
                  </div>

                  <label className="checkbox-row" htmlFor="edit-folder-active-page">
                    <input
                      checked={editIsActive}
                      id="edit-folder-active-page"
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      type="checkbox"
                    />
                    Active folder
                  </label>
                </div>

                <div className="form-card__footer">
                  <button className="btn btn--secondary" disabled={isSaving} onClick={onBack} type="button">
                    Cancel
                  </button>
                  <button className="btn btn--primary" disabled={isSaving} type="submit">
                    {isSaving ? 'Saving…' : 'Save Folder'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault()
                onCreateFolder?.(e, inviteUsernames)
              }}>
                <div className="form-card__body">
                  <div className="form-field">
                    <label htmlFor="new-folder-title">Folder title</label>
                    <input
                      id="new-folder-title"
                      onChange={(e) => onFolderTitleChange?.(e.target.value)}
                      placeholder="Launch plan, Q4 goals…"
                      required
                      value={folderTitle ?? ''}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="new-folder-desc">Description</label>
                    <textarea
                      id="new-folder-desc"
                      onChange={(e) => onFolderDescriptionChange?.(e.target.value)}
                      placeholder="What is this folder for?"
                      rows={3}
                      value={folderDescription ?? ''}
                    />
                    <div className="text-xs text-on-surface-variant mt-1.5 flex flex-wrap gap-1 items-center">
                      Want to transfer files for this folder? Upload them at <a href="https://www.swisstransfer.com/en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">SwissTransfer</a> and paste the link here.
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Category</label>
                    <CategoryPillToggle
                      id="new-folder-cat"
                      onChange={(val) => onFolderCategoryChange?.(val)}
                      value={folderCategory ?? 'personal'}
                    />
                  </div>

                  {(folderCategory === 'shared') && (
                    <div className="form-field mt-4 pt-4 border-t border-surface-variant/30">
                      <label>Invite Collaborators</label>
                      <p className="text-[12px] text-on-surface-variant mb-3">Add members to this shared workspace right away.</p>
                      
                      {inviteUsernames.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {inviteUsernames.map(username => (
                            <div key={username} className="flex items-center gap-2 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-bold">
                              <UserAvatar
                                label={inviteProfilesByUsername[username]?.display_name || username}
                                avatarChoice={inviteProfilesByUsername[username]?.avatar_choice}
                                avatarUrl={inviteProfilesByUsername[username]?.avatar_url}
                                className="w-5 h-5 text-[10px]"
                              />
                              <span>@{username}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setInviteUsernames(curr => curr.filter(u => u !== username))
                                  setInviteProfilesByUsername(curr => {
                                    const next = { ...curr }
                                    delete next[username]
                                    return next
                                  })
                                }}
                                className="hover:text-error ml-0.5 opacity-70 hover:opacity-100"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="relative z-50">
                        <UserSearchDropdown
                          className="stitch-input"
                          value={memberUsername}
                          onChange={setMemberUsername}
                          placeholder="Search username to invite..."
                          excludeUsernames={inviteUsernames}
                          onSelect={(username, profile) => {
                            if (!inviteUsernames.includes(username)) {
                              setInviteUsernames(curr => [...curr, username])
                              setInviteProfilesByUsername(curr => ({ ...curr, [username]: profile }))
                            }
                            setMemberUsername('')
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-card__footer">
                  <button className="btn btn--secondary" onClick={onBack} type="button">
                    Cancel
                  </button>
                  <button className="btn btn--primary" disabled={isSaving} type="submit">
                    {isSaving ? 'Creating…' : 'Create Folder'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Live Card Preview & Guidelines */}
        <div className="workspace-side-col">
          <div className="workspace-preview-panel">
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>Live Workspace Preview</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-3)', lineHeight: 1.4 }}>
              Here is how this workspace card will appear in your Folders Dashboard.
            </p>

            {/* Simulated Folder Card */}
            <div className="folder-card folder-card--tone-0" style={{ pointerEvents: 'none', width: '100%', margin: '8px 0 0' }}>
              <div className="folder-card__body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <span className="folder-card__badge" style={{ alignSelf: 'flex-start' }}>
                    {isEdit 
                      ? (editCategory === 'shared' ? 'Shared' : getCategoryLabel(editCategory))
                      : (folderCategory === 'shared' ? 'Shared' : getCategoryLabel(folderCategory ?? 'personal'))
                    }
                  </span>
                  <h3 className="folder-card__title" style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 700 }}>
                    {isEdit ? (editTitle || 'Untitled Workspace') : (folderTitle || 'Untitled Workspace')}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--ink-2)', margin: '4px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '36px', lineHeight: 1.4 }}>
                    {isEdit ? (editDesc || 'No description provided yet.') : (folderDescription || 'No description provided yet.')}
                  </p>
                </div>
              </div>
              <div className="folder-card__footer" style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="folder-card__count" style={{ fontSize: '12px', color: 'var(--ink-3)' }}>0 items</span>
                <span className="btn btn--primary btn--sm" style={{ height: '24px', fontSize: '11px', padding: '0 8px', display: 'flex', alignItems: 'center' }}>Open</span>
              </div>
            </div>
          </div>

          <div className="workspace-preview-panel" style={{ background: 'var(--surface-soft)' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>Workspace Tips</h3>
            <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12.5px', color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.4 }}>
              <li>
                <strong>Categories:</strong> Personal workspaces are private. Shared workspaces allow adding coworkers.
              </li>
              <li>
                <strong>Progress bars:</strong> Tasks inside folders automatically contribute to the workspace completion percentages.
              </li>
              <li>
                <strong>Real-time Syncing:</strong> Real-time changes are synchronized instantly for shared folder members.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
