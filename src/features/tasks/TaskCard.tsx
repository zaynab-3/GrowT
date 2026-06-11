import { ChevronDown, ChevronUp, Edit2, Trash2, Calendar, Archive } from 'lucide-react'
import type { ReorderDirection, TaskProgressStatus } from '../../lib/database.types'
import { formatDateTime, getCategoryLabel } from '../../lib/growtDisplay'
import type { Task, TaskMember, TaskStatusAction } from '../../lib/growtData'
import { TaskEditForm, type TaskEditValues } from './TaskEditForm'
import { SwipeActions } from '../../components/SwipeActions'
import { UserAvatar } from '../../components/UserAvatar'
import { LinkifiedText } from '../../components/LinkifiedText'
import { TaskStatusParticipants, type TaskStatusContributions } from './TaskStatusParticipants'

type StatusContribution = { action: TaskStatusAction; userId: string }
type AssignableMember = { id: string; label: string }

type TaskCardProps = {
  assignableMembers: AssignableMember[]
  contributions?: Record<TaskProgressStatus, StatusContribution[]>
  currentUserId: string
  editingTaskId: string | null
  folderOwnerId?: string
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  isFirst: boolean
  isLast: boolean
  onAddTaskMember?: (task: Task, username: string) => Promise<void> | void
  onCloseEdit: () => void
  onDeleteTask: (task: Task) => void
  onEditTask: (taskId: string) => void
  onMoveTask: (task: Task, direction: ReorderDirection, scopedTaskIds?: string[]) => void
  onRemoveTaskMember?: (task: Task, userId: string) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onUndoAction: (action: TaskStatusAction) => void
  onUpdateTask: (taskId: string, values: TaskEditValues) => void
  onOpenTask?: (task: Task) => void
  pendingAction: string | null
  scopedTaskIds?: string[]
  statusHistory?: TaskStatusContributions
  task: Task
  taskMembers?: TaskMember[]
}

export function TaskCard({
  assignableMembers,
  contributions,
  currentUserId,
  editingTaskId,
  folderOwnerId,
  getProfileAvatar,
  getProfileLabel,
  isSaving,
  isFirst,
  isLast,
  onCloseEdit,
  onDeleteTask,
  onEditTask,
  onMoveTask,
  onRemoveTaskMember,
  onSetTaskStatus,
  onUndoAction,
  onOpenTask,
  onUpdateTask,
  pendingAction,
  scopedTaskIds,
  statusHistory,
  task,
}: TaskCardProps) {
  const canManageTask = task.owner_id === currentUserId || folderOwnerId === currentUserId
  const canReorderTask = task.folder_id ? folderOwnerId === currentUserId : task.owner_id === currentUserId
  const isEditing = editingTaskId === task.id
  const isCompleted = !task.is_active

  // Determine current user's status for this task
  let currentUserStatus: TaskProgressStatus | null = null
  if (contributions) {
    if (contributions.completed.some(c => c.userId === currentUserId)) currentUserStatus = 'completed'
    else if (contributions.half_done.some(c => c.userId === currentUserId)) currentUserStatus = 'half_done'
    else if (contributions.ongoing.some(c => c.userId === currentUserId)) currentUserStatus = 'ongoing'
  }

  let lastActionToUndo: TaskStatusAction | null = null
  if (contributions) {
    const allActions = Object.values(contributions).flat()
    if (allActions.length > 0) {
      allActions.sort((a, b) => new Date(b.action.created_at).getTime() - new Date(a.action.created_at).getTime())
      const mostRecent = allActions[0]
      if (mostRecent.userId === currentUserId || canManageTask) {
        lastActionToUndo = mostRecent.action
      }
    }
  }

  const canUpdateStatus = task.assigned_user_id ? task.assigned_user_id === currentUserId : true

  const handleStatusChange = (e: React.MouseEvent, status: TaskProgressStatus) => {
    e.stopPropagation()
    if (!canUpdateStatus) return
    onSetTaskStatus(task.id, status)
  }

  if (isEditing) {
    return (
      <div className="glass-panel rounded-[18px] p-6 hover:-translate-y-1 transition-all duration-300">
        <TaskEditForm
          assignableMembers={assignableMembers}
          isSaving={isSaving}
          onCancel={onCloseEdit}
          onSave={(values) => onUpdateTask(task.id, values)}
          task={task}
        />
      </div>
    )
  }

  return (
    <SwipeActions
      leftAction={
        canManageTask ? (
          <div className="flex items-center gap-2 font-bold text-sm">
            <Trash2 size={18} /> Delete
          </div>
        ) : onRemoveTaskMember ? (
          <div className="flex items-center gap-2 font-bold text-sm text-amber-600 dark:text-amber-400">
            <Archive size={18} /> Leave
          </div>
        ) : undefined
      }
      leftActionCallback={() => {
        if (canManageTask) {
          onDeleteTask(task)
        } else if (onRemoveTaskMember) {
          onRemoveTaskMember(task, currentUserId)
        }
      }}
    >
      <div 
        className={`glass-panel rounded-[18px] p-6 hover:-translate-y-1 transition-all duration-300 group relative z-10 ${isCompleted ? 'opacity-75' : ''}`}
        onClick={() => onOpenTask && onOpenTask(task)}
        style={{ cursor: onOpenTask ? 'pointer' : 'default' }}
      >
        <div className="flex items-start gap-4">
          {/* Reorder handle */}
          <div className="pt-1 flex flex-col items-center bg-surface-container-low dark:bg-black/20 rounded-full py-1.5 px-1 border border-outline-variant/30 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm" onClick={e => e.stopPropagation()}>
            <button
              className="text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:hover:text-on-surface-variant transition-colors"
              disabled={isSaving || !canReorderTask || isFirst}
              onClick={(e) => { e.stopPropagation(); onMoveTask(task, 'up', scopedTaskIds) }}
              title={canReorderTask ? 'Move up' : 'Cannot reorder'}
              type="button"
            >
              <ChevronUp size={16} strokeWidth={3} />
            </button>
            <div className="w-4 h-[1px] bg-outline-variant/30 my-1" />
            <button
              className="text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:hover:text-on-surface-variant transition-colors"
              disabled={isSaving || !canReorderTask || isLast}
              onClick={(e) => { e.stopPropagation(); onMoveTask(task, 'down', scopedTaskIds) }}
              title={canReorderTask ? 'Move down' : 'Cannot reorder'}
              type="button"
            >
              <ChevronDown size={16} strokeWidth={3} />
            </button>
          </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className={`font-title-lg text-title-lg text-on-surface ${isCompleted ? 'line-through' : ''}`}>
                {task.title}
              </h3>
              <span className={`px-3 py-1 rounded-full font-label-md text-[10px] uppercase tracking-wider ${task.category === 'shared' ? 'bg-secondary-fixed text-on-secondary-fixed' : task.category === 'work' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary-fixed text-on-primary-fixed'}`}>
                {getCategoryLabel(task.category)}
              </span>
              {!task.is_active && <span className="px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full font-label-md text-[10px] uppercase tracking-wider">Inactive</span>}
              
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              {canManageTask && (
                <>
                  <button 
                    className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded-md hover:bg-surface-container"
                    onClick={(e) => { e.stopPropagation(); onEditTask(task.id) }} 
                    title="Edit task" type="button"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="p-1.5 text-on-surface-variant hover:text-error transition-colors rounded-md hover:bg-error-container"
                    onClick={(e) => { e.stopPropagation(); onDeleteTask(task) }} 
                    title="Delete task" type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {task.description && (
            <div className="font-body-md text-on-surface-variant leading-relaxed text-[13px] mb-4">
              <LinkifiedText text={task.description} />
            </div>
          )}

          <div className="flex items-center justify-between border-t border-surface-variant/50 pt-4 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
            <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
              <button 
                className={`flex min-h-8 max-w-full items-center justify-start gap-2 rounded-full border px-3 py-1 text-left text-[10px] font-bold uppercase tracking-wider transition-colors ${currentUserStatus === 'ongoing' ? 'shadow-sm' : 'border-transparent hover:opacity-80'}`}
                disabled={pendingAction !== null || !canUpdateStatus}
                style={currentUserStatus === 'ongoing' ? { backgroundColor: 'var(--ongoing-bg)', color: 'var(--ongoing-color)', borderColor: 'var(--ongoing-color)' } : { backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface-variant)' }}
                onClick={(e) => handleStatusChange(e, 'ongoing')}
                type="button"
                title={!canUpdateStatus ? 'Only the assigned user can update status' : ''}
              >
                <span className="shrink-0">Ongoing</span>
                <TaskStatusParticipants
                  rows={statusHistory?.ongoing ?? contributions?.ongoing ?? []}
                  getProfileAvatar={getProfileAvatar}
                  getProfileLabel={getProfileLabel}
                />
              </button>
              <button 
                className={`flex min-h-8 max-w-full items-center justify-start gap-2 rounded-full border px-3 py-1 text-left text-[10px] font-bold uppercase tracking-wider transition-colors ${currentUserStatus === 'half_done' ? 'shadow-sm' : 'border-transparent hover:opacity-80'}`}
                disabled={pendingAction !== null || !canUpdateStatus}
                style={currentUserStatus === 'half_done' ? { backgroundColor: 'var(--halfdone-bg)', color: 'var(--halfdone-color)', borderColor: 'var(--halfdone-color)' } : { backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface-variant)' }}
                onClick={(e) => handleStatusChange(e, 'half_done')}
                type="button"
                title={!canUpdateStatus ? 'Only the assigned user can update status' : ''}
              >
                <span className="shrink-0">Half Done</span>
                <TaskStatusParticipants
                  rows={statusHistory?.half_done ?? contributions?.half_done ?? []}
                  getProfileAvatar={getProfileAvatar}
                  getProfileLabel={getProfileLabel}
                />
              </button>
              <button 
                className={`flex min-h-8 max-w-full items-center justify-start gap-2 rounded-full border px-3 py-1 text-left text-[10px] font-bold uppercase tracking-wider transition-colors ${currentUserStatus === 'completed' ? 'shadow-sm' : 'border-transparent hover:opacity-80'}`}
                disabled={pendingAction !== null || !canUpdateStatus}
                style={currentUserStatus === 'completed' ? { backgroundColor: 'var(--done-bg)', color: 'var(--done-color)', borderColor: 'var(--done-color)' } : { backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface-variant)' }}
                onClick={(e) => handleStatusChange(e, 'completed')}
                type="button"
                title={!canUpdateStatus ? 'Only the assigned user can update status' : ''}
              >
                <span className="shrink-0">Completed</span>
                <TaskStatusParticipants
                  rows={statusHistory?.completed ?? contributions?.completed ?? []}
                  getProfileAvatar={getProfileAvatar}
                  getProfileLabel={getProfileLabel}
                />
              </button>
              {lastActionToUndo && (
                <button
                  className="px-2 py-1 ml-1 rounded-full text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors border border-surface-variant flex items-center justify-center"
                  disabled={pendingAction === `undo:${lastActionToUndo.id}`}
                  onClick={(e) => { e.stopPropagation(); onUndoAction(lastActionToUndo!); }}
                  title="Undo last action"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>undo</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {task.due_date && (
                <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
                  <Calendar size={14} className={new Date(task.due_date) < new Date() ? 'text-error' : ''} />
                  <span className={new Date(task.due_date) < new Date() ? 'text-error' : ''}>
                    {formatDateTime(task.due_date)}
                  </span>
                </div>
              )}

              {/* Assignee Dropdown (Mocked for now since GrowT assigns via edit form, but we show the assignee) */}
              <div className="relative inline-block text-left">
                <button 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-surface-variant font-body-md text-[13px] relative ${canManageTask ? 'hover:bg-surface-container-low transition-colors' : 'cursor-default'}`} 
                  type="button" 
                  onClick={(e) => { 
                    e.stopPropagation()
                    if (canManageTask) onEditTask(task.id) 
                  }}
                >
                  {task.assigned_user_id ? (
                    <div className="flex items-center gap-2">
                      <UserAvatar label={getProfileLabel(task.assigned_user_id)} avatarUrl={getProfileAvatar(task.assigned_user_id)} className="w-5 h-5 text-[10px]" />
                      <span>{getProfileLabel(task.assigned_user_id)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-bold text-on-surface-variant">U</div>
                      <span>Unassigned</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </SwipeActions>
  )
}
