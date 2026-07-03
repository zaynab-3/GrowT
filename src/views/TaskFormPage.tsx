import { type FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, Calendar } from 'lucide-react'
import type { FolderCategory } from '../lib/database.types'
import { formatDateInputValue, getCategoryLabel } from '../lib/growtDisplay'
import type { Task, TaskLevel } from '../lib/growtData'
import type { TaskCreateValues } from '../features/tasks/TaskForm'
import type { TaskEditValues } from '../features/tasks/TaskEditForm'
import { TaskDescriptionFields } from '../features/tasks/TaskDescriptionFields'
import {
  getInitialChecklistItems,
  normalizeChecklistItems,
  type TaskDescriptionMode,
} from '../features/tasks/taskDescriptionUtils'
import type { MemberPickerProfile } from '../features/members/memberPickerApi'
import { CategoryPillToggle } from '../components/CategoryPillToggle'
import { UserAvatar } from '../components/UserAvatar'
import { UserSearchDropdown } from '../components/UserSearchDropdown'
import '../styles/forms.css'
import '../styles/components.css'

type AssignableMember = { id: string; label: string }

type TaskFormPageProps = {
  assignableMembers: AssignableMember[]
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
  const [createDescMode, setCreateDescMode] = useState<TaskDescriptionMode>('description')
  const [createChecklistItems, setCreateChecklistItems] = useState<string[]>([''])
  const [createCategory, setCreateCategory] = useState<FolderCategory>(defaultCategory)
  const [createHasExportButton, setCreateHasExportButton] = useState(false)

  // Edit mode
  const [editTitle, setEditTitle] = useState(task?.title ?? '')
  const [editDesc, setEditDesc] = useState(task?.description ?? '')
  const [editDescMode, setEditDescMode] = useState<TaskDescriptionMode>(taskLevels.length ? 'checklist' : 'description')
  const [editChecklistItems, setEditChecklistItems] = useState<string[]>(
    getInitialChecklistItems(taskLevels.map((level) => level.title ?? level.description ?? '')),
  )
  const [editCategory, setEditCategory] = useState<FolderCategory>(task?.category ?? defaultCategory)
  const [editDueDate, setEditDueDate] = useState(formatDateInputValue(task?.due_date ?? null))
  const [editHasExportButton, setEditHasExportButton] = useState(task?.has_export_button ?? false)
  const [editIsActive, setEditIsActive] = useState(task?.is_active ?? true)
  const [editAssignedUserId, setEditAssignedUserId] = useState(task?.assigned_user_id ?? '')
  const [inviteUsernames, setInviteUsernames] = useState<string[]>([])
  const [inviteProfilesByUsername, setInviteProfilesByUsername] = useState<Record<string, MemberPickerProfile>>({})
  const [memberUsername, setMemberUsername] = useState('')

  const isEdit = mode === 'edit'

  useEffect(() => {
    if (!task) {
      return
    }

    setEditTitle(task.title)
    setEditDesc(task.description ?? '')
    setEditDescMode(taskLevels.length ? 'checklist' : 'description')
    setEditChecklistItems(getInitialChecklistItems(taskLevels.map((level) => level.title ?? level.description ?? '')))
    setEditCategory(task.category)
    setEditDueDate(formatDateInputValue(task.due_date))
    setEditHasExportButton(task.has_export_button)
    setEditIsActive(task.is_active)
    setEditAssignedUserId(task.assigned_user_id ?? '')
  }, [task, taskLevels])

  function handleCreateSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!createTitle.trim() || !onCreateTask) return
    onCreateTask({
      category: createCategory,
      checklistItems: createDescMode === 'checklist' ? normalizeChecklistItems(createChecklistItems) : [],
      description: createDescMode === 'description' ? createDesc.trim() || null : null,
      descriptionMode: createDescMode,
      hasExportButton: createHasExportButton,
      title: createTitle.trim(),
      inviteUsernames: inviteUsernames.length > 0 ? inviteUsernames : undefined,
    })
    setCreateTitle('')
    setCreateDesc('')
    setCreateDescMode('description')
    setCreateChecklistItems([''])
    setCreateHasExportButton(false)
    setInviteUsernames([])
    setInviteProfilesByUsername({})
  }

  function handleEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTitle.trim() || !onUpdateTask) return
    onUpdateTask({
      assignedUserId: editAssignedUserId || null,
      category: editCategory,
      checklistItems: editDescMode === 'checklist' ? normalizeChecklistItems(editChecklistItems) : [],
      description: editDescMode === 'description' ? editDesc.trim() || null : null,
      descriptionMode: editDescMode,
      dueDate: editDueDate || null,
      hasExportButton: editHasExportButton,
      isActive: editIsActive,
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
    <div className="form-page">
      <nav className="breadcrumb">
        <div className="breadcrumb__item">
          <button className="breadcrumb__link" onClick={onBack} type="button">
            <ArrowLeft size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            {folderTitle ?? 'Tasks'}
          </button>
          <span className="breadcrumb__sep">/</span>
        </div>
        <span className="breadcrumb__current">{isEdit ? 'Edit Task' : 'New Task'}</span>
      </nav>

      <div className="workspace-layout-cols mt-4">
        {/* Left Column: Form Card */}
        <div className="workspace-main-col">
          <div className="form-card">
            <div className="form-card__header">
              <span className="text-primary text-[11px] font-bold tracking-wider uppercase mb-1 block">
                {isEdit ? 'Edit Task' : folderTitle ? `Workspace: ${folderTitle}` : 'Standalone Task'}
              </span>
              <h2 className="text-2xl">{isEdit ? `Edit: ${task?.title}` : 'New Task'}</h2>
              <p className="mt-1">{isEdit ? "Update this task's details and settings." : 'Add a new task to track your work and progress.'}</p>
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
                      mode={editDescMode}
                      onChecklistItemsChange={setEditChecklistItems}
                      onDescriptionChange={setEditDesc}
                      onModeChange={setEditDescMode}
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
                      mode={createDescMode}
                      onChecklistItemsChange={setCreateChecklistItems}
                      onDescriptionChange={setCreateDesc}
                      onModeChange={setCreateDescMode}
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

        {/* Right Column: Live Task Preview & Guidelines */}
        <div className="workspace-side-col">
          <div className="workspace-preview-panel">
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>Live Task Preview</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-3)', lineHeight: 1.4 }}>
              Here is how this task card will appear inside its workspace.
            </p>

            {/* Simulated Task Card */}
            <div className="task-card" style={{ pointerEvents: 'none', width: '100%', margin: '8px 0 0', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="folder-card__badge" style={{ alignSelf: 'flex-start', fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  {isEdit ? getCategoryLabel(editCategory) : getCategoryLabel(createCategory)}
                </span>
                <h4 style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                  {isEdit ? (editTitle || 'Untitled Task') : (createTitle || 'Untitled Task')}
                </h4>
                {(isEdit ? editDescMode : createDescMode) === 'checklist' ? (
                  <ol className="task-preview-checklist">
                    {(isEdit ? editChecklistItems : createChecklistItems)
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    {!normalizeChecklistItems(isEdit ? editChecklistItems : createChecklistItems).length ? (
                      <li>No checklist items yet.</li>
                    ) : null}
                  </ol>
                ) : (
                  <p style={{ fontSize: '12.5px', color: 'var(--ink-2)', margin: '4px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '36px', lineHeight: 1.4 }}>
                    {isEdit ? (editDesc || 'No details provided yet.') : (createDesc || 'No details provided yet.')}
                  </p>
                )}
                
                {isEdit && editDueDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--danger-color)', marginTop: '4px', fontWeight: 600 }}>
                    <Calendar size={13} />
                    Due: {editDueDate}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="workspace-preview-panel" style={{ background: 'var(--surface-soft)' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>Task Quick Guide</h3>
            <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12.5px', color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.4 }}>
              <li>
                <strong>Assignee:</strong> You can assign tasks to yourself or coworkers in shared workspaces.
              </li>
              <li>
                <strong>Checklist:</strong> In the task detail page, you can break down the task into checklist subtasks.
              </li>
              <li>
                <strong>Status Updates:</strong> Move tasks from Ongoing to Half Done or Completed as they progress.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
