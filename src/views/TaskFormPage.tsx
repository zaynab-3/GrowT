import { type FormEvent, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  CircleCheckBig,
  CircleDot,
  CircleGauge,
  Edit2,
  FileOutput,
  ListPlus,
  MoreHorizontal,
  SquarePen,
  UserRoundPlus,
} from 'lucide-react'
import type { FolderCategory } from '../lib/database.types'
import { formatDateInputValue, getCategoryLabel } from '../lib/growtDisplay'
import type { Task, TaskLevel } from '../lib/growtData'
import { formatCurrency, parseRecipientAmount } from '../lib/recipient'
import type { TaskCreateValues } from '../features/tasks/TaskForm'
import type { TaskEditValues } from '../features/tasks/TaskEditForm'
import { TaskDescriptionFields } from '../features/tasks/TaskDescriptionFields'
import {
  getInitialChecklistItems,
  normalizeChecklistItems,
} from '../features/tasks/taskDescriptionUtils'
import type { MemberPickerProfile } from '../features/members/memberPickerApi'
import { CategoryPillToggle } from '../components/CategoryPillToggle'
import { RichDescription } from '../components/RichDescription'
import { UserAvatar } from '../components/UserAvatar'
import { UserSearchDropdown } from '../components/UserSearchDropdown'
import '../styles/forms.css'
import '../styles/components.css'

type AssignableMember = { id: string; label: string }

type TaskFormPageProps = {
  assignableMembers: AssignableMember[]
  canEditRecipientAmount?: boolean
  defaultRecipientAmount?: number
  folderTitle?: string
  isSaving: boolean
  forceExportButton?: boolean
  mode: 'create' | 'edit'
  onBack: () => void
  onCreateTask?: (values: TaskCreateValues) => void
  onUpdateTask?: (values: TaskEditValues) => void
  onAddTaskMember?: (username: string) => void
  task?: Task
  taskLevels?: TaskLevel[]
  defaultCategory?: FolderCategory
}

export function TaskFormPage({
  assignableMembers,
  canEditRecipientAmount = true,
  defaultRecipientAmount = 0,
  folderTitle,
  isSaving,
  forceExportButton = false,
  mode,
  onBack,
  onCreateTask,
  onUpdateTask,
  onAddTaskMember,
  task,
  taskLevels = [],
  defaultCategory = 'personal',
}: TaskFormPageProps) {
  // Create mode
  const [createTitle, setCreateTitle] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createChecklistItems, setCreateChecklistItems] = useState<string[]>([''])
  const [createCategory, setCreateCategory] = useState<FolderCategory>(defaultCategory)
  const [createHasExportButton, setCreateHasExportButton] = useState(false)
  const [createRecipientAmount, setCreateRecipientAmount] = useState(String(defaultRecipientAmount))

  // Edit mode
  const [editTitle, setEditTitle] = useState(task?.title ?? '')
  const [editDesc, setEditDesc] = useState(task?.description ?? '')
  const [editChecklistItems, setEditChecklistItems] = useState<string[]>(
    getInitialChecklistItems(taskLevels.map((level) => level.title ?? level.description ?? '')),
  )
  const [editCategory, setEditCategory] = useState<FolderCategory>(task?.category ?? defaultCategory)
  const [editDueDate, setEditDueDate] = useState(formatDateInputValue(task?.due_date ?? null))
  const [editHasExportButton, setEditHasExportButton] = useState(task?.has_export_button ?? false)
  const [editIsActive, setEditIsActive] = useState(task?.is_active ?? true)
  const [editAssignedUserId, setEditAssignedUserId] = useState(task?.assigned_user_id ?? '')
  const [editRecipientAmount, setEditRecipientAmount] = useState(String(task?.recipient_amount ?? 0))
  const [inviteUsernames, setInviteUsernames] = useState<string[]>([])
  const [inviteProfilesByUsername, setInviteProfilesByUsername] = useState<Record<string, MemberPickerProfile>>({})
  const [memberUsername, setMemberUsername] = useState('')

  const isEdit = mode === 'edit'
  const previewTitle = (isEdit ? editTitle : createTitle).trim() || 'Untitled task'
  const previewDescription = isEdit ? editDesc : createDesc
  const previewChecklist = normalizeChecklistItems(isEdit ? editChecklistItems : createChecklistItems)
  const previewCategory = isEdit ? editCategory : createCategory
  const previewDueDate = isEdit ? editDueDate : ''
  const previewAssignee = isEdit
    ? assignableMembers.find((member) => member.id === editAssignedUserId)?.label ?? null
    : null
  const previewHasExport = forceExportButton || (isEdit ? editHasExportButton : createHasExportButton)
  const previewRecipientAmount = parseRecipientAmount(isEdit ? editRecipientAmount : createRecipientAmount)

  useEffect(() => {
    setCreateRecipientAmount(String(defaultRecipientAmount))
  }, [defaultRecipientAmount])

  useEffect(() => {
    if (!task) {
      return
    }

    setEditTitle(task.title)
    setEditDesc(task.description ?? '')
    setEditChecklistItems(getInitialChecklistItems(taskLevels.map((level) => level.title ?? level.description ?? '')))
    setEditCategory(task.category)
    setEditDueDate(formatDateInputValue(task.due_date))
    setEditHasExportButton(task.has_export_button)
    setEditIsActive(task.is_active)
    setEditAssignedUserId(task.assigned_user_id ?? '')
    setEditRecipientAmount(String(task.recipient_amount ?? 0))
  }, [task, taskLevels])

  function handleCreateSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!createTitle.trim() || !onCreateTask) return
    onCreateTask({
      category: createCategory,
      checklistItems: normalizeChecklistItems(createChecklistItems),
      description: createDesc.trim() || null,
      hasExportButton: createHasExportButton,
      recipientAmount: parseRecipientAmount(createRecipientAmount),
      title: createTitle.trim(),
      inviteUsernames: inviteUsernames.length > 0 ? inviteUsernames : undefined,
    })
    setCreateTitle('')
    setCreateDesc('')
    setCreateChecklistItems([''])
    setCreateHasExportButton(false)
    setCreateRecipientAmount(String(defaultRecipientAmount))
    setInviteUsernames([])
    setInviteProfilesByUsername({})
  }

  function handleEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTitle.trim() || !onUpdateTask) return
    onUpdateTask({
      assignedUserId: editAssignedUserId || null,
      category: editCategory,
      checklistItems: normalizeChecklistItems(editChecklistItems),
      description: editDesc.trim() || null,
      dueDate: editDueDate || null,
      hasExportButton: editHasExportButton,
      isActive: editIsActive,
      recipientAmount: canEditRecipientAmount
        ? parseRecipientAmount(editRecipientAmount)
        : task?.recipient_amount ?? 0,
      title: editTitle.trim(),
    })
    
    if (onAddTaskMember && inviteUsernames.length > 0) {
      inviteUsernames.forEach((username) => {
        onAddTaskMember(username)
      })
    }
    
    setInviteUsernames([])
    setInviteProfilesByUsername({})
  }

  function removeInvite(username: string) {
    setInviteUsernames(curr => curr.filter(u => u !== username))
    setInviteProfilesByUsername(curr => {
      const next = { ...curr }
      delete next[username]
      return next
    })
  }

  function handleInviteSelect(username: string, profile: MemberPickerProfile) {
    if (!inviteUsernames.includes(username)) {
      setInviteUsernames(curr => [...curr, username])
      setInviteProfilesByUsername(curr => ({ ...curr, [username]: profile }))
    }
    setMemberUsername('')
  }

  function renderInviteChips() {
    if (!inviteUsernames.length) {
      return null
    }

    return (
      <div className="flex flex-wrap gap-2 mb-3">
        {inviteUsernames.map(username => {
          const profile = inviteProfilesByUsername[username]

          return (
            <div key={username} className="flex items-center gap-2 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-bold">
              <UserAvatar
                label={profile?.display_name || username}
                avatarChoice={profile?.avatar_choice}
                avatarUrl={profile?.avatar_url}
                className="w-5 h-5 text-[10px]"
              />
              <span>@{username}</span>
              <button type="button" onClick={() => removeInvite(username)} className="hover:text-error ml-0.5 opacity-70 hover:opacity-100">×</button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="form-page task-form-page growt-page">
      <nav className="breadcrumb">
        <div className="breadcrumb__item">
          <button className="breadcrumb__link" onClick={onBack} type="button">
            <ArrowLeft aria-hidden="true" size={14} />
            <span>{folderTitle ?? 'Tasks'}</span>
          </button>
          <span className="breadcrumb__sep">/</span>
        </div>
        <span className="breadcrumb__current">{isEdit ? 'Edit Task' : 'New Task'}</span>
      </nav>
      <div className="workspace-layout-cols task-form-layout">
        <div className="workspace-main-col">
          <div className="form-card">
            <div className="form-card__header form-card__titlebar">
              <span className="form-card__title-icon">
                {isEdit ? <SquarePen aria-hidden="true" size={22} /> : <ListPlus aria-hidden="true" size={22} />}
              </span>
              <div>
                <span className="form-card__context">
                  {isEdit ? 'Task settings' : folderTitle ? folderTitle : 'Standalone'}
                </span>
                <h2>{isEdit ? (task?.title || 'Edit task') : 'Create task'}</h2>
              </div>
            </div>

            {isEdit ? (
              <form onSubmit={handleEditSubmit}>
                <div className="form-card__body">
                  <div className="form-field">
                    <label htmlFor="edit-task-title-page">Task title</label>
                    <input
                      id="edit-task-title-page"
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Task title"
                      required
                      value={editTitle}
                    />
                  </div>

                  <div className="form-field">
                    <label>Description</label>
                    <TaskDescriptionFields
                      checklistItems={editChecklistItems}
                      description={editDesc}
                      idPrefix="edit-task-page"
                      onChecklistItemsChange={setEditChecklistItems}
                      onDescriptionChange={setEditDesc}
                    />
                    <div className="text-xs text-on-surface-variant mt-1.5 flex flex-wrap gap-1 items-center">
                      Want to transfer files for this task? Upload them at <a href="https://www.swisstransfer.com/en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">SwissTransfer</a> and paste the link here.
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Category</label>
                    <CategoryPillToggle
                      id="edit-task-cat-page"
                      onChange={setEditCategory}
                      value={editCategory}
                    />
                  </div>

                  {!forceExportButton && (
                    <label className="checkbox-row" htmlFor="edit-task-export-page">
                      <input
                        checked={editHasExportButton}
                        id="edit-task-export-page"
                        onChange={(e) => setEditHasExportButton(e.target.checked)}
                        type="checkbox"
                      />
                      Export video task
                    </label>
                  )}

                  {canEditRecipientAmount && (
                    <div className="form-field">
                      <label htmlFor="edit-task-recipient-page">Recipient amount</label>
                      <input
                        id="edit-task-recipient-page"
                        min="0"
                        onChange={(e) => setEditRecipientAmount(e.target.value)}
                        step="0.01"
                        type="number"
                        value={editRecipientAmount}
                      />
                      <p className="text-xs text-on-surface-variant">
                        Current task payout is {formatCurrency(parseRecipientAmount(editRecipientAmount))}.
                      </p>
                    </div>
                  )}

                  <div className="form-field">
                    <label htmlFor="edit-task-due-page">Due date</label>
                    <div className="date-input-wrapper">
                      <input
                        id="edit-task-due-page"
                        onChange={(e) => setEditDueDate(e.target.value)}
                        type="date"
                        value={editDueDate}
                      />
                    </div>
                  </div>

                  {assignableMembers.length > 0 && (
                    <div className="form-field">
                      <label htmlFor="edit-task-assign-page">Assignee</label>
                      <select
                        id="edit-task-assign-page"
                        onChange={(e) => setEditAssignedUserId(e.target.value)}
                        value={editAssignedUserId}
                      >
                        <option value="">Unassigned</option>
                        {assignableMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {editCategory === 'shared' && (
                    <div className="form-field mt-4 pt-4 border-t border-surface-variant/30">
                      <label>Invite Collaborators</label>
                      <p className="text-[12px] text-on-surface-variant mb-3">Add new members to this shared task.</p>
                      
                      {renderInviteChips()}
                      
                      <div className="relative z-50">
                        <UserSearchDropdown
                          className="stitch-input"
                          value={memberUsername}
                          onChange={setMemberUsername}
                          placeholder="Search username to invite..."
                          excludeUsernames={inviteUsernames}
                          excludeUserIds={assignableMembers.map(m => m.id)}
                          onSelect={handleInviteSelect}
                        />
                      </div>
                    </div>
                  )}

                  <label className="checkbox-row" htmlFor="edit-task-active-page">
                    <input
                      checked={editIsActive}
                      id="edit-task-active-page"
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      type="checkbox"
                    />
                    Active task
                  </label>
                </div>

                <div className="form-card__footer">
                  <button className="btn btn--secondary" disabled={isSaving} onClick={onBack} type="button">
                    Cancel
                  </button>
                  <button className="btn btn--primary" disabled={isSaving} type="submit">
                    {isSaving ? 'Saving…' : 'Save Task'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateSubmit}>
                <div className="form-card__body">
                  <div className="form-field">
                    <label htmlFor="new-task-title">Task title</label>
                    <input
                      id="new-task-title"
                      onChange={(e) => setCreateTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      required
                      value={createTitle}
                    />
                  </div>

                  <div className="form-field">
                    <label>Description</label>
                    <TaskDescriptionFields
                      checklistItems={createChecklistItems}
                      description={createDesc}
                      descriptionPlaceholder="Optional details..."
                      idPrefix="new-task-page"
                      onChecklistItemsChange={setCreateChecklistItems}
                      onDescriptionChange={setCreateDesc}
                    />
                    <div className="text-xs text-on-surface-variant mt-1.5 flex flex-wrap gap-1 items-center">
                      Want to transfer files for this task? Upload them at{' '}
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
                      id="new-task-cat"
                      onChange={setCreateCategory}
                      value={createCategory}
                    />
                  </div>

                  {!forceExportButton && (
                    <label className="checkbox-row" htmlFor="new-task-export">
                      <input
                        checked={createHasExportButton}
                        id="new-task-export"
                        onChange={(e) => setCreateHasExportButton(e.target.checked)}
                        type="checkbox"
                      />
                      Export video task
                    </label>
                  )}

                  {canEditRecipientAmount && (
                    <div className="form-field">
                      <label htmlFor="new-task-recipient-page">Recipient amount</label>
                      <input
                        id="new-task-recipient-page"
                        min="0"
                        onChange={(e) => setCreateRecipientAmount(e.target.value)}
                        step="0.01"
                        type="number"
                        value={createRecipientAmount}
                      />
                      <p className="text-xs text-on-surface-variant">
                        This task starts at {formatCurrency(parseRecipientAmount(createRecipientAmount))}.
                      </p>
                    </div>
                  )}

                  {createCategory === 'shared' && (
                    <div className="form-field mt-4 pt-4 border-t border-surface-variant/30">
                      <label>Invite Collaborators</label>
                      <p className="text-[12px] text-on-surface-variant mb-3">Add members to this shared task right away.</p>
                      
                      {renderInviteChips()}
                      
                      <div className="relative z-50">
                        <UserSearchDropdown
                          className="stitch-input"
                          value={memberUsername}
                          onChange={setMemberUsername}
                          placeholder="Search username to invite..."
                          excludeUsernames={inviteUsernames}
                          excludeUserIds={assignableMembers.map(m => m.id)}
                          onSelect={handleInviteSelect}
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
                    {isSaving ? 'Creating…' : 'Create Task'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: real task-card preview */}
        <div className="workspace-side-col task-form-preview-column">
          <section className="workspace-preview-panel task-form-live-preview" aria-label="Live task preview">
            <header className="task-form-live-preview__header">
              <span className="task-form-live-preview__icon">
                <ListPlus aria-hidden="true" size={18} />
              </span>
              <span>
                <strong>Live task preview</strong>
                <small>Updates as you type</small>
              </span>
            </header>

            <article className={`task-work-card task-work-card--${previewCategory} task-form-live-card`}>
              <div className="task-row task-form-live-card__row">
                <div className="task-row__body">
                  <div className="task-row__header">
                    <div className={`task-row__category task-row__category--${previewCategory}`}>
                      <i aria-hidden="true" />
                      <span>{getCategoryLabel(previewCategory)}</span>
                    </div>

                    <div aria-hidden="true" className="task-row__actions task-form-live-card__actions">
                      {previewHasExport ? <FileOutput size={18} /> : null}
                      <Edit2 size={17} />
                      <MoreHorizontal size={19} />
                    </div>
                  </div>

                  <div className="task-row__title">
                    <h3>{previewTitle}</h3>
                  </div>

                  {previewDescription.trim() ? (
                    <RichDescription
                      className="task-row__description task-form-live-card__description"
                      collapsedNoteCount={4}
                      text={previewDescription}
                    />
                  ) : null}

                  {previewChecklist.length ? (
                    <section className="task-checklist task-checklist--compact task-form-live-checklist" aria-label="Checklist preview">
                      <div className="task-checklist__summary">
                        <span className="task-checklist__heading">Checklist</span>
                        <strong>0 / {previewChecklist.length} complete</strong>
                      </div>
                      <div className="task-checklist__timeline">
                        {previewChecklist.slice(0, 3).map((item, index) => (
                          <div className="task-checklist__timeline-item" key={`${item}-${index}`}>
                            <span className="task-checklist__timeline-control">
                              <i aria-hidden="true" className="task-checklist__timeline-node" />
                            </span>
                            <span className="task-checklist__timeline-label">{item}</span>
                          </div>
                        ))}
                        {previewChecklist.length > 3 ? (
                          <div className="task-checklist__timeline-more">
                            <span aria-hidden="true" className="task-checklist__timeline-more-node" />
                            <span>{previewChecklist.length - 3} more</span>
                          </div>
                        ) : null}
                      </div>
                    </section>
                  ) : null}

                  {!previewDescription.trim() && previewChecklist.length === 0 ? (
                    <p className="task-form-live-card__empty">Description and checklist will appear here.</p>
                  ) : null}

                  <div className="task-row__status-grid task-form-live-card__status-grid">
                    <div className="task-row-status task-row-status--ongoing">
                      <CircleDot aria-hidden="true" size={20} />
                      <span className="task-row-status__label">Ongoing</span>
                      <small>{previewAssignee ?? '—'}</small>
                    </div>
                    <div className="task-row-status task-row-status--half_done">
                      <CircleGauge aria-hidden="true" size={20} />
                      <span className="task-row-status__label">Half done</span>
                      <small>—</small>
                    </div>
                    <div className="task-row-status task-row-status--completed">
                      <CircleCheckBig aria-hidden="true" size={20} />
                      <span className="task-row-status__label">Completed</span>
                      <small>—</small>
                    </div>
                  </div>

                  <div className="task-row__meta task-form-live-card__meta">
                    <span className="task-row__assignee">
                      <UserRoundPlus aria-hidden="true" size={17} />
                      <span>{previewAssignee ?? 'Unassigned'}</span>
                    </span>
                    {previewDueDate ? (
                      <span className="task-row__due">
                        <Calendar aria-hidden="true" size={15} />
                        {previewDueDate}
                      </span>
                    ) : null}
                    <span className="task-form-live-card__recipient">
                      {formatCurrency(previewRecipientAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </section>
        </div>
      </div>
    </div>
  )
}
