import { type FormEvent, useState } from 'react'
import { ArrowLeft, Edit2, Trash2, Plus, Users, CheckCircle, Info, X, BarChart2, Link } from 'lucide-react'
import { LinkifiedText } from '../components/LinkifiedText'
import { UserAvatar } from '../components/UserAvatar'
import type { FolderCategory, ReorderDirection, TaskProgressStatus } from '../lib/database.types'
import { isSharedFolder, getCategoryLabel, statusColumns, formatDateTime } from '../lib/growtDisplay'
import type { Folder, Task, TaskStatusAction } from '../lib/growtData'
import { calculateFolderProgress } from '../lib/growtState'

import { TaskList } from '../features/tasks/TaskList'
import { TaskForm, type TaskCreateValues } from '../features/tasks/TaskForm'
import type { TaskEditValues } from '../features/tasks/TaskEditForm'
import { UserSearchDropdown } from '../components/UserSearchDropdown'


type StatusContribution = { action: TaskStatusAction; userId: string }
type AssignableMember = { id: string; label: string }

type FolderDetailPageProps = {
  assignableMembers: AssignableMember[]
  canInviteMembers: boolean
  contributionsByTask: Map<string, Record<TaskProgressStatus, StatusContribution[]>>
  currentUserId: string
  editingTaskId: string | null
  folder: Folder
  folderMemberUserIds: string[]
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  memberUsername: string
  normalizedSearchQuery: string
  onAddTask: () => void
  onBack: () => void
  onCloseTaskEdit: () => void
  onCopyShareLink: (type: 'folder', id: string) => void
  onCreateFolderTask: (values: TaskCreateValues) => void
  onDeleteFolder: (folder: Folder) => void
  onDeleteTask: (task: Task) => void
  onEditFolder: () => void
  onEditTask: (taskId: string) => void
  onInviteMember: (event: FormEvent<HTMLFormElement>) => void
  onMemberUsernameChange: (username: string) => void
  onMoveTask: (task: Task, direction: ReorderDirection) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onUndoAction: (action: TaskStatusAction) => void
  onUpdateTask: (taskId: string, values: TaskEditValues) => void
  pendingAction: string | null
  statusHistoryByTask: Map<string, Record<TaskProgressStatus, StatusContribution[]>>
  tasks: Task[]
}

export function FolderDetailPage({
  assignableMembers,
  canInviteMembers,
  contributionsByTask,
  currentUserId,
  editingTaskId,
  folder,
  folderMemberUserIds,
  getProfileAvatar,
  getProfileLabel,
  isSaving,
  memberUsername,
  normalizedSearchQuery,
  onAddTask,
  onBack,
  onCloseTaskEdit,
  onCopyShareLink,
  onCreateFolderTask,
  onDeleteFolder,
  onDeleteTask,
  onEditFolder,
  onEditTask,
  onInviteMember,
  onMemberUsernameChange,
  onMoveTask,
  onSetTaskStatus,
  onUndoAction,
  onUpdateTask,
  pendingAction,
  statusHistoryByTask,
  tasks,
}: FolderDetailPageProps) {
  const shared = isSharedFolder(folder)
  const isOwner = folder.owner_id === currentUserId
  
  const [showBreakdown, setShowBreakdown] = useState(false)

  const { finalCounts: folderStatusTotals, memberCounts } = calculateFolderProgress(tasks, contributionsByTask)

  const userProgress = folderMemberUserIds.map(userId => {
    const totals = memberCounts.get(userId) ?? { completed: 0, half_done: 0, ongoing: 0 }
    return { userId, totals }
  })
const progressPercent = tasks.length > 0
  ? Math.round((folderStatusTotals.completed / tasks.length) * 100)
  : 0
  return (
    <div className="stitch-page">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-surface-variant/70 bg-surface shadow-sm">
  <div className="h-1.5 bg-gradient-to-r from-primary via-fuchsia-400 to-emerald-400" />

  <div className="p-5 md:p-6">
    <button
      className="mb-5 inline-flex items-center gap-2 rounded-full px-0 text-sm font-bold text-primary transition-colors hover:text-primary-container"
      onClick={onBack}
      type="button"
    >
      <ArrowLeft size={15} />
      Back to Workspaces
    </button>

    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 break-words text-[30px] font-black leading-tight text-on-surface md:text-[34px]">
            {folder.title}
          </h1>

          <span className={`stitch-badge ${shared ? 'stitch-badge--shared' : ''}`}>
            {getCategoryLabel(folder.category)}
          </span>

          {!folder.is_active && (
            <span className="stitch-badge stitch-badge--inactive">
              Inactive
            </span>
          )}
        </div>

        <div className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
          {folder.description ? (
            <LinkifiedText text={folder.description} />
          ) : (
            <span className="italic opacity-70">No description yet.</span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>

          <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
            {shared ? 'Shared workspace' : 'Private workspace'}
          </span>

          <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
            {folder.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {isOwner && (
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            className="btn btn--secondary"
            onClick={() => onCopyShareLink('folder', folder.id)}
            type="button"
            disabled={isSaving}
          >
            <Link size={14} />
            Share Link
          </button>

          <button
            className="btn btn--secondary"
            onClick={onEditFolder}
            type="button"
            id="edit-folder-btn"
          >
            <Edit2 size={14} />
            Edit
          </button>

          <button
            className="btn btn--danger"
            disabled={isSaving}
            onClick={() => onDeleteFolder(folder)}
            type="button"
            id="delete-folder-btn"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>

    <div className="mt-6 rounded-2xl border border-surface-variant/70 bg-surface-container-low p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-on-surface">
              Workspace Progress
            </span>

            <button
              onClick={() => setShowBreakdown(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 hover:text-primary-container"
              title="View user breakdown"
              type="button"
            >
              <Info size={15} />
            </button>
          </div>

          <p className="mt-0.5 text-xs font-medium text-on-surface-variant">
            Completion is based on completed tasks only.
          </p>
        </div>

        <span className="rounded-full bg-primary px-3 py-1 text-xs font-black text-on-primary">
          {progressPercent}% Completed
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-variant">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-200/70 bg-blue-50 px-4 py-3">
          <span className="text-[11px] font-black uppercase tracking-wide text-blue-700">
            Ongoing
          </span>
          <div className="mt-1 text-2xl font-black text-blue-700">
            {folderStatusTotals.ongoing}
          </div>
        </div>

        <div className="rounded-xl border border-amber-200/70 bg-amber-50 px-4 py-3">
          <span className="text-[11px] font-black uppercase tracking-wide text-amber-700">
            Half Done
          </span>
          <div className="mt-1 text-2xl font-black text-amber-700">
            {folderStatusTotals.half_done}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50 px-4 py-3">
          <span className="text-[11px] font-black uppercase tracking-wide text-emerald-700">
            Completed
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-700">
            {folderStatusTotals.completed}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

{showBreakdown && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    onClick={() => setShowBreakdown(false)}
  >
    <div
      className="relative w-full max-w-md rounded-2xl border border-surface-variant bg-surface p-6 shadow-xl"
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={() => setShowBreakdown(false)}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant"
        type="button"
      >
        <X size={20} />
      </button>

      <h3 className="mb-6 flex items-center gap-2 text-lg font-black text-on-surface">
        <BarChart2 size={20} className="text-primary" />
        Member Progress
      </h3>

      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-2">
        {userProgress.map(({ userId, totals }) => {
          const total = totals.completed + totals.half_done + totals.ongoing

          return (
            <div
              key={userId}
              className="rounded-xl border border-surface-variant/50 bg-surface-container-low p-4"
            >
              <div className="mb-3 flex items-center gap-3">
                <UserAvatar
                  label={getProfileLabel(userId)}
                  avatarUrl={getProfileAvatar(userId)}
                  className="h-8 w-8 text-xs"
                />

                <span className="flex-1 font-bold text-on-surface">
                  {getProfileLabel(userId)}
                </span>

                <span className="text-sm font-bold text-on-surface-variant">
                  {total > 0 ? `${Math.round((totals.completed / total) * 100)}%` : '0%'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border-b-2 border-[#0ea5e9] bg-surface-container p-2 text-center">
                  <div className="text-xl font-black text-on-surface">{totals.ongoing}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase text-on-surface-variant">
                    Ongoing
                  </div>
                </div>

                <div className="rounded-lg border-b-2 border-[#f59e0b] bg-surface-container p-2 text-center">
                  <div className="text-xl font-black text-on-surface">{totals.half_done}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase text-on-surface-variant">
                    Half
                  </div>
                </div>

                <div className="rounded-lg border-b-2 border-[#10b981] bg-surface-container p-2 text-center">
                  <div className="text-xl font-black text-on-surface">{totals.completed}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase text-on-surface-variant">
                    Done
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {userProgress.length === 0 && (
          <p className="py-4 text-center text-sm font-medium text-on-surface-variant">
            No active members.
          </p>
        )}
      </div>
    </div>
  </div>
)}

      <div className="stitch-board">
        <div className="stitch-board__main">
          {/* Tasks section */}
          <div className="stitch-panel">
            <div className="stitch-panel__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} className="stitch-panel__icon" />
                <h3 className="stitch-panel__title">Tasks</h3>
                <span className="stitch-count-badge">{tasks.length}</span>
              </div>
              <button className="btn btn--primary btn--sm" onClick={onAddTask} type="button" id="add-task-btn">
                <Plus size={14} /> New Task
              </button>
            </div>
            
            <div className="stitch-panel__body">
              <div className="stitch-status-overview">
                {statusColumns.map((col) => (
                  <div className={`stitch-status-card stitch-status-card--${col.id}`} key={col.id}>
                    <span className="stitch-status-card__label">{col.label}</span>
                    <strong className="stitch-status-card__value">{folderStatusTotals[col.id]}</strong>
                  </div>
                ))}
              </div>

              <TaskForm
                defaultCategory={folder.category as FolderCategory}
                isSaving={isSaving}
                onCreate={onCreateFolderTask}
              />

              <div style={{ marginTop: 24 }}>
                <TaskList
                  assignableMembers={assignableMembers}
                  contributionsByTask={contributionsByTask}
                  currentUserId={currentUserId}
                  editingTaskId={editingTaskId}
                  emptyMessage={normalizedSearchQuery ? 'No tasks match this search.' : 'Add your first task above.'}
                  folderOwnerId={folder.owner_id}
                  getProfileAvatar={getProfileAvatar}
                  getProfileLabel={getProfileLabel}
                  isSaving={isSaving}
                  onCloseEdit={onCloseTaskEdit}
                  onDeleteTask={onDeleteTask}
                  onEditTask={onEditTask}
                  onMoveTask={onMoveTask}
                  onSetTaskStatus={onSetTaskStatus}
                  onUndoAction={onUndoAction}
                  onUpdateTask={onUpdateTask}
                  pendingAction={pendingAction}
                  statusHistoryByTask={statusHistoryByTask}
                  tasks={tasks}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="stitch-board__side">
          {/* Members panel */}
          {shared && (
            <div className="stitch-panel relative z-20">
              <div className="stitch-panel__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} className="stitch-panel__icon" />
                  <h3 className="stitch-panel__title">Collaborators</h3>
                  <span className="stitch-count-badge">{folderMemberUserIds.length}</span>
                </div>
              </div>
              <div className="stitch-panel__body">
                <div className="stitch-member-list">
                  {folderMemberUserIds.map((memberId) => {
                    const counts = memberCounts.get(memberId) ?? { completed: 0, half_done: 0, ongoing: 0 }
                    return (
                      <div className="stitch-member-row" key={memberId}>
                        <div className="flex items-center gap-2">
                          <UserAvatar label={getProfileLabel(memberId)} avatarUrl={getProfileAvatar(memberId)} className="w-6 h-6 text-[10px]" />
                          <span className="stitch-member-name">{getProfileLabel(memberId)}</span>
                        </div>
                        <div className="stitch-member-stats">
                          <span title="Ongoing"><div className="stitch-dot stitch-dot--ongoing" />{counts.ongoing}</span>
                          <span title="Half Done"><div className="stitch-dot stitch-dot--half_done" />{counts.half_done}</span>
                          <span title="Completed"><div className="stitch-dot stitch-dot--completed" />{counts.completed}</span>
                        </div>
                      </div>
                    )
                  })}
                  {!folderMemberUserIds.length && <span className="stitch-empty-text">Owner only</span>}
                </div>

                {canInviteMembers && (
                  <form className="stitch-invite-form" onSubmit={onInviteMember}>
                    <UserSearchDropdown
                      className="stitch-input"
                      value={memberUsername}
                      onChange={onMemberUsernameChange}
                      placeholder="Invite by username"
                    />
                    <button className="btn btn--primary btn--sm" disabled={isSaving} type="submit">
                      Invite
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Details panel */}
          <div className="stitch-panel">
            <div className="stitch-panel__header">
              <h3 className="stitch-panel__title">Workspace Details</h3>
            </div>
            <div className="stitch-panel__body" style={{ padding: '0' }}>
              <div className="stitch-detail-list">
                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Category</span>
                  <strong className="stitch-detail-value">{getCategoryLabel(folder.category)}</strong>
                </div>
                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Access</span>
                  <strong className="stitch-detail-value">{shared ? 'Shared' : 'Private'}</strong>
                </div>
                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Status</span>
                  <strong className="stitch-detail-value">{folder.is_active ? 'Active' : 'Inactive'}</strong>
                </div>
                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Due Date</span>
                  <strong className="stitch-detail-value">{folder.due_date ? formatDateTime(folder.due_date) : 'None'}</strong>
                </div>
                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Created</span>
                  <strong className="stitch-detail-value">{formatDateTime(folder.created_at)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
