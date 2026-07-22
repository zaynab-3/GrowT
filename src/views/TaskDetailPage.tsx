import { useState } from 'react'
import { ArrowLeft, Edit2, Trash2, CheckCircle, Link, Upload, ReceiptText } from 'lucide-react'
import { formatDateTime } from '../lib/growtDisplay'
import type { TaskProgressStatus } from '../lib/database.types'
import type { Task, TaskLevel, TaskMember, TaskStatusAction } from '../lib/growtData'
import { formatCurrency, type RecipientReport } from '../lib/recipient'
import { TaskStatusGrid } from '../features/tasks/TaskStatusGrid'
import type { TaskStatusContributions } from '../features/tasks/TaskStatusParticipants'
import { TaskMembersPanel } from '../features/tasks/TaskMembersPanel'
import { UserAvatar } from '../components/UserAvatar'
import { LinkifiedText } from '../components/LinkifiedText'
import { TaskChecklist } from '../features/tasks/TaskChecklist'
import { RecipientReportPopup } from '../components/RecipientReportPopup'

type StatusContribution = { action: TaskStatusAction; userId: string }
import { getCategoryLabel, statusColumns } from '../lib/growtDisplay'

type TaskDetailPageProps = {
  contributions?: Record<TaskProgressStatus, StatusContribution[]>
  statusHistory?: TaskStatusContributions
  currentUserId: string
  forceExportButton?: boolean
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
  onSetTaskExported: (taskId: string, isExported?: boolean) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onToggleTaskLevel: (taskId: string, taskLevelId: string, checked: boolean) => void
  onUndoAction: (action: TaskStatusAction) => void
  pendingAction: string | null
  recipientReport?: RecipientReport
  task: Task
  taskLevelCompletedIds: Set<string>
  taskLevels: TaskLevel[]
  taskMembers?: TaskMember[]
}

export function TaskDetailPage({
  contributions,
  currentUserId,
  forceExportButton = false,
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
  onSetTaskExported,
  onSetTaskStatus,
  onToggleTaskLevel,
  onUndoAction,
  pendingAction,
  recipientReport,
  statusHistory,
  task,
  taskLevelCompletedIds,
  taskLevels,
  taskMembers,
}: TaskDetailPageProps) {
  const canManageTask = task.owner_id === currentUserId || folderOwnerId === currentUserId
  const [recipientAnchor, setRecipientAnchor] = useState<DOMRect | null>(null)

  let currentUserStatus: TaskProgressStatus | null = null
  if (contributions) {
    if (contributions.completed.some(c => c.userId === currentUserId)) currentUserStatus = 'completed'
    else if (contributions.half_done.some(c => c.userId === currentUserId)) currentUserStatus = 'half_done'
    else if (contributions.ongoing.some(c => c.userId === currentUserId)) currentUserStatus = 'ongoing'
  }

  const isCompleted = !task.is_active || currentUserStatus === 'completed'
  const showExportButton = forceExportButton || task.has_export_button

  const statusStyles: Record<TaskProgressStatus, string> = {
    ongoing: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd] hover:bg-[#bae6fd]',
    half_done: 'bg-[#ffedd5] text-[#c2410c] border-[#fed7aa] hover:bg-[#fed7aa]',
    completed: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] hover:bg-[#bbf7d0]',
  }

  const currentUserStatusAction = contributions
    ? Object.values(contributions)
        .flat()
        .find((row) => row.userId === currentUserId)?.action ?? null
    : null

  const handleStatusChange = (status: TaskProgressStatus) => {
    if (currentUserStatusAction?.new_status === status) {
      onUndoAction(currentUserStatusAction)
      return
    }

    onSetTaskStatus(task.id, status)
  }

  return (
    <div className="stitch-page">
      <div className="task-detail-header workspace-header-compact mb-4 sm:mb-6">
        <div className="page-header__copy">
          <button className="btn btn--ghost" onClick={onBack} type="button" style={{ padding: '0', marginBottom: '12px', display: 'flex', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>
            <ArrowLeft size={14} /> Back to Folder
          </button>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 className="task-detail-header__title" style={{ margin: 0, fontWeight: 800, textDecoration: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.7 : 1 }}>{task.title}</h1>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="stitch-badge">{getCategoryLabel(task.category)}</span>
              {showExportButton && (
                <button
                  className={`inline-flex min-h-6 items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    task.is_exported
                      ? 'border-emerald-500/60 bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300'
                      : 'border-violet-300 bg-white text-violet-700 hover:bg-violet-50 dark:border-violet-400/40 dark:bg-white/5 dark:text-violet-200 dark:hover:bg-violet-400/10'
                  }`}
                  disabled={pendingAction === `export:${task.id}`}
                  title={task.is_exported ? 'Mark as not exported' : 'Mark as exported'}
                  onClick={() => {
                    onSetTaskExported(task.id, !task.is_exported)
                  }}
                  type="button"
                >
                  {task.is_exported ? <CheckCircle size={12} /> : <Upload size={12} />}
                  {task.is_exported ? 'Exported' : 'Export'}
                </button>
              )}
              {isCompleted && <span className="stitch-badge stitch-badge--inactive">Inactive</span>}
            </div>
          </div>
          {task.description ? (
            <div className="page-header__desc" style={{ margin: '6px 0 0', color: 'var(--ink-2)' }}>
              <LinkifiedText text={task.description} />
            </div>
          ) : null}
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
          ) : null}
        </div>

        <div className="page-header__actions">
          {recipientReport && (
            <button
              className="btn btn--secondary"
              onClick={(event) => setRecipientAnchor(event.currentTarget.getBoundingClientRect())}
              type="button"
            >
              <ReceiptText size={14} /> Recipients
            </button>
          )}

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

      {recipientReport && recipientAnchor && (
        <RecipientReportPopup
          anchorRect={recipientAnchor}
          getProfileAvatar={getProfileAvatar}
          getProfileLabel={getProfileLabel}
          isOpen={recipientAnchor !== null}
          onClose={() => setRecipientAnchor(null)}
          report={recipientReport}
          subtitle={`"${task.title}" · ${formatCurrency(recipientReport.paidAmount)}`}
          title="Task Recipients"
        />
      )}

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
              <div className="grid grid-cols-3 gap-2">
                {statusColumns.map((status) => (
                  <button
                    aria-pressed={currentUserStatus === status.id}
                    key={status.id}
                    disabled={pendingAction !== null}
                    onClick={() => handleStatusChange(status.id)}
                    className={`min-w-0 px-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${currentUserStatus === status.id ? statusStyles[status.id] : 'bg-transparent border-surface-variant text-on-surface hover:border-primary/50'}`}
                    title={currentUserStatus === status.id ? `Clear ${status.label.toLowerCase()} status` : `Mark as ${status.label.toLowerCase()}`}
                    type="button"
                  >
                    {currentUserStatus === status.id && <CheckCircle className="shrink-0" size={14} />}
                    {status.label}
                  </button>
                ))}
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
                  <span className="stitch-detail-label">Export</span>
                  <strong className="stitch-detail-value">
                    {showExportButton ? (task.is_exported ? 'Exported' : 'Ready') : 'None'}
                  </strong>
                </div>
                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Recipient Amount</span>
                  <strong className="stitch-detail-value">{formatCurrency(task.recipient_amount ?? 0)}</strong>
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
