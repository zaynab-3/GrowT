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

  return (
    <div className="stitch-page">
      <div className="workspace-header-compact" style={{ marginBottom: 24 }}>
        <div className="page-header__copy">
          <button className="btn btn--ghost" onClick={onBack} type="button" style={{ padding: '0', marginBottom: '12px', display: 'flex', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>
            <ArrowLeft size={14} /> Back to Workspaces
          </button>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{folder.title}</h1>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className={`stitch-badge ${shared ? 'stitch-badge--shared' : ''}`}>{getCategoryLabel(folder.category)}</span>
              {!folder.is_active && <span className="stitch-badge stitch-badge--inactive">Inactive</span>}
            </div>
          </div>
          {folder.description && <div className="page-header__desc" style={{ margin: '4px 0 0', color: 'var(--ink-2)' }}><LinkifiedText text={folder.description} /></div>}
          
          <div style={{ marginTop: '16px', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: 'var(--ink-3)', fontWeight: 600 }}>
              <span className="flex items-center gap-2">
                Progress
                <button 
                  onClick={() => setShowBreakdown(true)}
                  className="text-primary hover:text-primary-container flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
                  title="View user breakdown"
                >
                  <Info size={16} />
                </button>
              </span>
              <span>
                {tasks.length > 0 ? Math.round((folderStatusTotals.completed / tasks.length) * 100) : 0}% Completed
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--surface-variant)', borderRadius: '99px', overflow: 'hidden', marginBottom: '8px', display: 'flex' }}>
              <div style={{ width: `${tasks.length > 0 ? (folderStatusTotals.ongoing / tasks.length) * 100 : 0}%`, height: '100%', background: 'var(--ongoing-color)', transition: 'width 0.3s ease' }} />
              <div style={{ width: `${tasks.length > 0 ? (folderStatusTotals.half_done / tasks.length) * 100 : 0}%`, height: '100%', background: 'var(--halfdone-color)', transition: 'width 0.3s ease' }} />
              <div style={{ width: `${tasks.length > 0 ? (folderStatusTotals.completed / tasks.length) * 100 : 0}%`, height: '100%', background: 'var(--done-color)', transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: 600, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--ongoing-color)' }} />
                {folderStatusTotals.ongoing} Ongoing
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--halfdone-color)' }} />
                {folderStatusTotals.half_done} Half Done
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--done-color)' }} />
                {folderStatusTotals.completed} Completed
              </span>
              {folderStatusTotals.not_started > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border)' }} />
                  {folderStatusTotals.not_started} Not Started
                </span>
              )}
            </div>
          </div>
        </div>

        {showBreakdown && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowBreakdown(false)}>
            <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl border border-surface-variant relative" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setShowBreakdown(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
                <BarChart2 size={20} className="text-primary" />
                Member Progress
              </h3>

              <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
                {userProgress.map(({ userId, totals }) => {
                  const total = totals.completed + totals.half_done + totals.ongoing
                  return (
                    <div key={userId} className="glass-card p-4 rounded-xl border border-surface-variant/50">
                      <div className="flex items-center gap-3 mb-3">
                        <UserAvatar label={getProfileLabel(userId)} avatarUrl={getProfileAvatar(userId)} className="w-8 h-8 text-xs" />
                        <span className="font-title-md text-on-surface flex-1">{getProfileLabel(userId)}</span>
                        <span className="font-label-md text-on-surface-variant">
                          {total > 0 ? `${Math.round((totals.completed / total) * 100)}%` : '0%'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-surface-container rounded-lg p-2 text-center border-b-2 border-[#0ea5e9]">
                          <div className="text-xl font-bold text-on-surface">{totals.ongoing}</div>
                          <div className="text-[10px] font-semibold text-on-surface-variant uppercase mt-1">Ongoing</div>
                        </div>
                        <div className="flex-1 bg-surface-container rounded-lg p-2 text-center border-b-2 border-[#f59e0b]">
                          <div className="text-xl font-bold text-on-surface">{totals.half_done}</div>
                          <div className="text-[10px] font-semibold text-on-surface-variant uppercase mt-1">Half</div>
                        </div>
                        <div className="flex-1 bg-surface-container rounded-lg p-2 text-center border-b-2 border-[#10b981]">
                          <div className="text-xl font-bold text-on-surface">{totals.completed}</div>
                          <div className="text-[10px] font-semibold text-on-surface-variant uppercase mt-1">Done</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {userProgress.length === 0 && (
                  <p className="text-center text-on-surface-variant py-4 font-body-md">No active members.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="page-header__actions">
          {isOwner && (
            <>
              <button 
                className="btn btn--secondary" 
                onClick={() => onCopyShareLink('folder', folder.id)} 
                type="button" 
                disabled={isSaving}
              >
                <Link size={14} /> Share Link
              </button>
              <button className="btn btn--secondary" onClick={onEditFolder} type="button" id="edit-folder-btn">
                <Edit2 size={14} /> Edit
              </button>
              <button
                className="btn btn--danger"
                disabled={isSaving}
                onClick={() => onDeleteFolder(folder)}
                type="button"
                id="delete-folder-btn"
              >
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

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
