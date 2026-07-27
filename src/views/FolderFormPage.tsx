import { type FormEvent, useState } from 'react'
import { ArrowLeft, FolderPen, FolderPlus } from 'lucide-react'
import type { FolderCategory } from '../lib/database.types'
import { formatDateInputValue, getCategoryLabel } from '../lib/growtDisplay'
import type { Folder } from '../lib/growtData'
import { formatCurrency, parseRecipientAmount } from '../lib/recipient'
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
  folderContainsExportVideos?: boolean
  folderDescription?: string
  folderRecipientTaskAmount?: string
  folderTitle?: string
  isSaving: boolean
  mode: 'create' | 'edit'
  onBack: () => void
  onCreateFolder?: (event: FormEvent<HTMLFormElement>, inviteUsernames?: string[]) => void
  onFolderCategoryChange?: (category: FolderCategory) => void
  onFolderContainsExportVideosChange?: (containsExportVideos: boolean) => void
  onFolderDescriptionChange?: (description: string) => void
  onFolderRecipientTaskAmountChange?: (amount: string) => void
  onFolderTitleChange?: (title: string) => void
  onUpdateFolder?: (values: FolderEditValues) => void
  // For editing
  folder?: Folder
}

export function FolderFormPage({
  folderCategory,
  folderContainsExportVideos,
  folderDescription,
  folderRecipientTaskAmount,
  folderTitle,
  isSaving,
  mode,
  onBack,
  onCreateFolder,
  onFolderCategoryChange,
  onFolderContainsExportVideosChange,
  onFolderDescriptionChange,
  onFolderRecipientTaskAmountChange,
  onFolderTitleChange,
  onUpdateFolder,
  folder,
}: FolderFormPageProps) {
  // Edit mode local state
  const [editTitle, setEditTitle] = useState(folder?.title ?? '')
  const [editDesc, setEditDesc] = useState(folder?.description ?? '')
  const [editCategory, setEditCategory] = useState<FolderCategory>(folder?.category ?? 'personal')
  const [editContainsExportVideos, setEditContainsExportVideos] = useState(folder?.contains_export_videos ?? false)
  const [editRecipientTaskAmount, setEditRecipientTaskAmount] = useState(String(folder?.recipient_task_amount ?? 0))
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
      containsExportVideos: editContainsExportVideos,
      description: editDesc.trim() || null,
      dueDate: editDueDate || null,
      isActive: editIsActive,
      recipientTaskAmount: parseRecipientAmount(editRecipientTaskAmount),
      title: editTitle.trim(),
    })
    setInviteUsernames([])
    setInviteProfilesByUsername({})
  }

  const isEdit = mode === 'edit'

  return (
    <div className="form-page folder-form-page growt-page">
      <nav className="breadcrumb">
        <div className="breadcrumb__item">
          <button className="breadcrumb__link" onClick={onBack} type="button">
            <ArrowLeft aria-hidden="true" size={14} />
            <span>{isEdit ? 'Folder' : 'Folders'}</span>
          </button>
          <span className="breadcrumb__sep">/</span>
        </div>
        <span className="breadcrumb__current">{isEdit ? 'Edit Folder' : 'New Folder'}</span>
      </nav>
      <div className={`workspace-layout-cols gap-6 ${(!isEdit && folderCategory === 'shared') ? 'lg:!grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(300px,0.8fr)]' : 'md:!grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]'} !grid-cols-1`}>
        {/* Column 1: Folder Overview */}
        <div className="workspace-main-col">
          <div className="form-card h-full">
            <div className="form-card__header form-card__titlebar">
              <span className="form-card__title-icon">
                {isEdit ? <FolderPen aria-hidden="true" size={22} /> : <FolderPlus aria-hidden="true" size={22} />}
              </span>
              <div>
                <span className="form-card__context">{isEdit ? 'Workspace settings' : 'New workspace'}</span>
                <h2>{isEdit ? (folder?.title || 'Edit folder') : 'Create folder'}</h2>
              </div>
            </div>

            {isEdit ? (
              <form onSubmit={handleEditSubmit} className="flex flex-col h-[calc(100%-70px)]">
                <div className="form-card__body flex-1">
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

                  <label className="checkbox-row" htmlFor="edit-folder-export-videos-page">
                    <input
                      checked={editContainsExportVideos}
                      id="edit-folder-export-videos-page"
                      onChange={(e) => setEditContainsExportVideos(e.target.checked)}
                      type="checkbox"
                    />
                    Contains export videos
                  </label>

                  <div className="form-field">
                    <label htmlFor="edit-folder-recipient-amount">Default recipient amount per task</label>
                    <input
                      id="edit-folder-recipient-amount"
                      min="0"
                      onChange={(e) => setEditRecipientTaskAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      value={editRecipientTaskAmount}
                    />
                    <p className="m-0 text-xs font-semibold text-on-surface-variant">
                      New tasks in this folder start at {formatCurrency(parseRecipientAmount(editRecipientTaskAmount))}.
                    </p>
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

                <div className="form-card__footer mt-auto">
                  <button className="btn btn--secondary" disabled={isSaving} onClick={onBack} type="button">
                    Cancel
                  </button>
                  <button className="btn btn--primary" disabled={isSaving} type="submit">
                    {isSaving ? 'Saving…' : 'Save Folder'}
                  </button>
                </div>
              </form>
            ) : (
              <form id="new-folder-form" onSubmit={(e) => {
                e.preventDefault()
                onCreateFolder?.(e, inviteUsernames)
              }} className="flex flex-col h-[calc(100%-70px)]">
                <div className="form-card__body flex-1">
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

                  <label className="checkbox-row" htmlFor="new-folder-export-videos">
                    <input
                      checked={folderContainsExportVideos ?? false}
                      id="new-folder-export-videos"
                      onChange={(e) => onFolderContainsExportVideosChange?.(e.target.checked)}
                      type="checkbox"
                    />
                    Contains export videos
                  </label>

                  <div className="form-field">
                    <label htmlFor="new-folder-recipient-amount">Default recipient amount per task</label>
                    <input
                      id="new-folder-recipient-amount"
                      min="0"
                      onChange={(e) => onFolderRecipientTaskAmountChange?.(e.target.value)}
                      placeholder="12.00"
                      step="0.01"
                      type="number"
                      value={folderRecipientTaskAmount ?? ''}
                    />
                    <p className="m-0 text-xs font-semibold text-on-surface-variant">
                      Each new task starts at {formatCurrency(parseRecipientAmount(folderRecipientTaskAmount ?? '0'))}.
                    </p>
                  </div>
                </div>

                {(!(!isEdit && folderCategory === 'shared')) && (
                  <div className="form-card__footer mt-auto">
                    <button className="btn btn--secondary" onClick={onBack} type="button">
                      Cancel
                    </button>
                    <button className="btn btn--primary" disabled={isSaving} type="submit" form="new-folder-form">
                      {isSaving ? 'Creating…' : 'Create Folder'}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Column 2: Workspace Details & Live Card Preview */}
        <div className="workspace-side-col flex flex-col gap-5">
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

        {/* Column 3: Invite Collaborators (Only shown for new shared folders) */}
        {(!isEdit && folderCategory === 'shared') && (
          <div className="workspace-main-col">
            <div className="form-card h-full flex flex-col">
              <div className="form-card__header">
                <h2>Invite Collaborators</h2>
                <p>Add members to this shared workspace right away.</p>
              </div>

              <div className="form-card__body flex-1">
                {inviteUsernames.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {inviteUsernames.map(username => (
                      <div key={username} className="flex items-center gap-2 bg-primary/10 text-primary px-2.5 py-1.5 rounded-full text-xs font-bold">
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

              <div className="form-card__footer mt-auto">
                <button className="btn btn--secondary" onClick={onBack} type="button">
                  Cancel
                </button>
                <button className="btn btn--primary" disabled={isSaving} type="submit" form="new-folder-form">
                  {isSaving ? 'Creating…' : 'Create Folder'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
