import { ArrowLeft, Edit2, Trash2, CheckCircle, Undo2, Link } from 'lucide-react'
import { formatDateTime } from '../lib/growtDisplay'
import type { TaskProgressStatus } from '../lib/database.types'
import type { Task, TaskLevel, TaskMember, TaskStatusAction } from '../lib/growtData'
import { TaskStatusGrid } from '../features/tasks/TaskStatusGrid'
import type { TaskStatusContributions } from '../features/tasks/TaskStatusParticipants'
import { TaskMembersPanel } from '../features/tasks/TaskMembersPanel'
import { UserAvatar } from '../components/UserAvatar'
import { LinkifiedText } from '../components/LinkifiedText'
import { TaskChecklist } from '../features/tasks/TaskChecklist'

type StatusContribution = { action: TaskStatusAction; userId: string }
import { getCategoryLabel, statusColumns } from '../lib/growtDisplay'

type TaskDetailPageProps = {
  contributions?: Record<TaskProgressStatus, StatusContribution[]>
  statusHistory?: TaskStatusContributions
  currentUserId: string
  folderOwnerId?: string
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  onAddMember?: (task: Task, username: string) => Promise<void> | void
  onBack: () => void
  onCopyShareLink: (type: 'task', id: string) => void
  onDeleteTask: (task: Task) => void
  onEditTask: (taskId: string) => void
  onRemoveMember?: (task: Task, userId: string) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onToggleTaskLevel: (taskId: string, taskLevelId: string, checked: boolean) => void
  onUndoAction: (action: TaskStatusAction) => void
  pendingAction: string | null
  task: Task
  taskLevelCompletedIds: Set<string>
  taskLevels: TaskLevel[]
  taskMembers?: TaskMember[]
}

export function TaskDetailPage({
  contributions,
  currentUserId,
  folderOwnerId,
  getProfileAvatar,
  getProfileLabel,
  isSaving,
  onAddMember,
  onBack,
  onCopyShareLink,
  onDeleteTask,
  onEditTask,
  onRemoveMember,
  onSetTaskStatus,
  onToggleTaskLevel,
  onUndoAction,
  pendingAction,
  statusHistory,
  task,
  taskLevelCompletedIds,
  taskLevels,
  taskMembers,
}: TaskDetailPageProps) {
  const canManageTask = task.owner_id === currentUserId || folderOwnerId === currentUserId

  let currentUserStatus: TaskProgressStatus | null = null
  if (contributions) {
    if (contributions.completed.some(c => c.userId === currentUserId)) currentUserStatus = 'completed'
    else if (contributions.half_done.some(c => c.userId === currentUserId)) currentUserStatus = 'half_done'
    else if (contributions.ongoing.some(c => c.userId === currentUserId)) currentUserStatus = 'ongoing'
  }

  const isCompleted = !task.is_active || currentUserStatus === 'completed'

  const statusStyles: Record<TaskProgressStatus, string> = {
    ongoing: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd] hover:bg-[#bae6fd]',
    half_done: 'bg-[#ffedd5] text-[#c2410c] border-[#fed7aa] hover:bg-[#fed7aa]',
    completed: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] hover:bg-[#bbf7d0]',
  }

  const handleStatusChange = (status: TaskProgressStatus) => {
    onSetTaskStatus(task.id, status)
  }

  let lastActionToUndo: TaskStatusAction | null = null
  if (contributions) {
    const allActions = Object.values(contributions).flat()
    const undoableActions = allActions.filter(c => c.userId === currentUserId || canManageTask)
    if (undoableActions.length > 0) {
      undoableActions.sort((a, b) => new Date(b.action.created_at).getTime() - new Date(a.action.created_at).getTime())
      lastActionToUndo = undoableActions[0].action
    }
  }

  return (
    <div className="stitch-page">
      <div className="workspace-header-compact" style={{ marginBottom: 24 }}>
        <div className="page-header__copy">
          <button className="btn btn--ghost" onClick={onBack} type="button" style={{ padding: '0', marginBottom: '12px', display: 'flex', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>
            <ArrowLeft size={14} /> Back to Folder
          </button>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, textDecoration: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.7 : 1 }}>{task.title}</h1>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="stitch-badge">{getCategoryLabel(task.category)}</span>
              {isCompleted && <span className="stitch-badge stitch-badge--inactive">Inactive</span>}
            </div>
          </div>
          {taskLevels.length > 0 ? (
            <div style={{ marginTop: '14px', maxWidth: 680 }}>
              <TaskChecklist
                completedLevelIds={taskLevelCompletedIds}
                disabled={pendingAction !== null}
                levels={taskLevels}
                onToggle={(taskLevelId, checked) => onToggleTaskLevel(task.id, taskLevelId, checked)}
                pendingAction={pendingAction}
              />
            </div>
          ) : task.description ? (
            <div className="page-header__desc" style={{ margin: '4px 0 0', color: 'var(--ink-2)' }}>
              <LinkifiedText text={task.description} />
            </div>
          ) : null}
        </div>

        <div className="page-header__actions">
          {canManageTask && (
            <>
              <button 
                className="btn btn--secondary" 
                onClick={() => onCopyShareLink('task', task.id)} 
                type="button" 
                disabled={isSaving}
              >
                <Link size={14} /> Share Link
              </button>
              <button className="btn btn--secondary" onClick={() => onEditTask(task.id)} type="button">
                <Edit2 size={14} /> Edit
              </button>
              <button
                className="btn btn--danger"
                disabled={isSaving}
                onClick={() => onDeleteTask(task)}
                type="button"
              >
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="stitch-board">
        <div className="stitch-board__main">
          {/* Members Panel */}
          {taskMembers && onAddMember && onRemoveMember && (
            <div className="stitch-panel">
              <TaskMembersPanel
                currentUserId={currentUserId}
                getProfileAvatar={getProfileAvatar}
                getProfileLabel={getProfileLabel}
                isSaving={isSaving}
                members={taskMembers}
                onAddMember={onAddMember}
                onRemoveMember={onRemoveMember}
                task={task}
              />
            </div>
          )}

          {/* Activity Grid */}
          <div className="stitch-panel mt-6">
            <div className="stitch-panel__header">
              <h3 className="stitch-panel__title">Activity Grid</h3>
            </div>
            <div className="stitch-panel__body">
              <TaskStatusGrid
                canManageTask={canManageTask}
                contributions={statusHistory ?? contributions}
                currentContributions={contributions}
                currentUserId={currentUserId}
                getProfileAvatar={getProfileAvatar}
                getProfileLabel={getProfileLabel}
                isUndoPending={(action) => pendingAction === `undo:${action.id}`}
                onUndo={onUndoAction}
              />
            </div>
          </div>
        </div>

        <div className="stitch-board__side">
          {/* Your Status */}
          <div className="stitch-panel mb-6">
            <div className="stitch-panel__header">
              <h3 className="stitch-panel__title">Your Status</h3>
            </div>
            <div className="stitch-panel__body">
              <div className="grid grid-cols-2 gap-3">
                {statusColumns.map((status) => (
                  <button
                    key={status.id}
                    disabled={pendingAction === `${task.id}:${status.id}`}
                    onClick={() => handleStatusChange(status.id)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-300 flex items-center justify-center gap-2 ${currentUserStatus === status.id ? statusStyles[status.id] : 'bg-transparent border-surface-variant text-on-surface hover:border-primary/50'}`}
                  >
                    {currentUserStatus === status.id && <CheckCircle size={16} />}
                    {status.label}
                  </button>
                ))}
                <button
                  disabled={!lastActionToUndo || pendingAction === `undo:${lastActionToUndo.id}`}
                  onClick={() => lastActionToUndo && onUndoAction(lastActionToUndo)}
                  className="w-full py-3 rounded-xl border-2 border-surface-variant text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-all flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Undo last action"
                >
                  <Undo2 size={16} /> Undo
                </button>
              </div>
            </div>
          </div>

          {/* Details panel */}
          <div className="stitch-panel">
            <div className="stitch-panel__header">
              <h3 className="stitch-panel__title">Task Details</h3>
            </div>
            <div className="stitch-panel__body" style={{ padding: '0' }}>
              <div className="stitch-detail-list">
                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Category</span>
                  <strong className="stitch-detail-value">{getCategoryLabel(task.category)}</strong>
                </div>
                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Status</span>
                  <strong className="stitch-detail-value">{task.is_active ? 'Active' : 'Inactive'}</strong>
                </div>
                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Due Date</span>
                  <strong className="stitch-detail-value">{task.due_date ? formatDateTime(task.due_date) : 'None'}</strong>
                </div>
                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Assignee</span>
                  <strong className="stitch-detail-value flex items-center gap-2">
                    {task.assigned_user_id ? (
                      <>
                        <UserAvatar label={getProfileLabel(task.assigned_user_id)} avatarUrl={getProfileAvatar(task.assigned_user_id)} className="w-5 h-5 text-[10px]" />
                        <span>{getProfileLabel(task.assigned_user_id)}</span>
                      </>
                    ) : 'Unassigned'}
                  </strong>
                </div>
                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Created</span>
                  <strong className="stitch-detail-value">{formatDateTime(task.created_at)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
