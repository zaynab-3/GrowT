import type { ReorderDirection, TaskProgressStatus } from '../../lib/database.types'
import { formatDateTime, getCategoryLabel, statusColumns } from '../../lib/growtDisplay'
import type { Task, TaskMember, TaskStatusAction } from '../../lib/growtData'
import { TaskEditForm, type TaskEditValues } from './TaskEditForm'
import { TaskMembersPanel } from './TaskMembersPanel'
import { TaskStatusGrid } from './TaskStatusGrid'

type StatusContribution = {
  action: TaskStatusAction
  userId: string
}

type AssignableMember = {
  id: string
  label: string
}

type TaskCardProps = {
  assignableMembers: AssignableMember[]
  contributions?: Record<TaskProgressStatus, StatusContribution[]>
  currentUserId: string
  editingTaskId: string | null
  folderOwnerId?: string
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  isFirst: boolean
  isLast: boolean
  onAddTaskMember?: (task: Task, username: string) => Promise<void> | void
  onCloseEdit: () => void
  onDeleteTask: (task: Task) => void
  onEditTask: (taskId: string) => void
  onMoveTask: (task: Task, direction: ReorderDirection) => void
  onRemoveTaskMember?: (task: Task, userId: string) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onUndoAction: (action: TaskStatusAction) => void
  onUpdateTask: (taskId: string, values: TaskEditValues) => void
  pendingAction: string | null
  task: Task
  taskMembers?: TaskMember[]
}

export function TaskCard({
  assignableMembers,
  contributions,
  currentUserId,
  editingTaskId,
  folderOwnerId,
  getProfileLabel,
  isSaving,
  isFirst,
  isLast,
  onAddTaskMember,
  onCloseEdit,
  onDeleteTask,
  onEditTask,
  onMoveTask,
  onRemoveTaskMember,
  onSetTaskStatus,
  onUndoAction,
  onUpdateTask,
  pendingAction,
  task,
  taskMembers,
}: TaskCardProps) {
  const canManageTask = task.owner_id === currentUserId || folderOwnerId === currentUserId
  const canReorderTask = task.folder_id ? folderOwnerId === currentUserId : task.owner_id === currentUserId

  return (
    <article className="task-row">
      <div className="task-row__header">
        <div>
          <strong>{task.title}</strong>
          <span>{task.description || 'No description yet'}</span>
          <span className="task-meta">
            {getCategoryLabel(task.category)} · {task.is_active ? 'Active' : 'Inactive'} ·{' '}
            {task.due_date ? formatDateTime(task.due_date) : 'No due date'}
            {task.assigned_user_id ? ` · Assigned to ${getProfileLabel(task.assigned_user_id)}` : ''}
          </span>
        </div>
        <div className="status-actions">
          <button
            className="button status-button reorder-button"
            disabled={isSaving || !canReorderTask || isFirst}
            onClick={() => onMoveTask(task, 'up')}
            title={canReorderTask ? 'Move task up' : 'Only the owner can reorder this task'}
            type="button"
          >
            Move Up
          </button>
          <button
            className="button status-button reorder-button"
            disabled={isSaving || !canReorderTask || isLast}
            onClick={() => onMoveTask(task, 'down')}
            title={canReorderTask ? 'Move task down' : 'Only the owner can reorder this task'}
            type="button"
          >
            Move Down
          </button>
          {statusColumns.map((status) => (
            <button
              className={`button status-button status-button--${status.id}`}
              disabled={pendingAction === `${task.id}:${status.id}`}
              key={status.id}
              onClick={() => onSetTaskStatus(task.id, status.id)}
              type="button"
            >
              {status.label}
            </button>
          ))}
          {canManageTask ? (
            <>
              <button className="button status-button" onClick={() => onEditTask(task.id)} type="button">
                {editingTaskId === task.id ? 'Close edit' : 'Edit'}
              </button>
              <button
                className="button button--danger status-button"
                disabled={isSaving}
                onClick={() => onDeleteTask(task)}
                type="button"
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>

      {editingTaskId === task.id ? (
        <TaskEditForm
          assignableMembers={assignableMembers}
          isSaving={isSaving}
          onCancel={onCloseEdit}
          onSave={(values) => onUpdateTask(task.id, values)}
          task={task}
        />
      ) : null}

      {taskMembers && onAddTaskMember && onRemoveTaskMember ? (
        <TaskMembersPanel
          currentUserId={currentUserId}
          getProfileLabel={getProfileLabel}
          isSaving={isSaving}
          members={taskMembers}
          onAddMember={onAddTaskMember}
          onRemoveMember={onRemoveTaskMember}
          task={task}
        />
      ) : null}

      <TaskStatusGrid
        contributions={contributions}
        currentUserId={currentUserId}
        getProfileLabel={getProfileLabel}
        isUndoPending={(action) => pendingAction === `undo:${action.id}`}
        onUndo={onUndoAction}
      />
    </article>
  )
}
