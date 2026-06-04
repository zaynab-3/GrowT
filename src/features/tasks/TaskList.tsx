import type { ReorderDirection, TaskProgressStatus } from '../../lib/database.types'
import type { Task, TaskMember, TaskStatusAction } from '../../lib/growtData'
import { EmptyState } from '../../components/EmptyState'
import { TaskCard } from './TaskCard'
import type { TaskEditValues } from './TaskEditForm'

type StatusContribution = {
  action: TaskStatusAction
  userId: string
}

type AssignableMember = {
  id: string
  label: string
}

type TaskListProps = {
  assignableMembers: AssignableMember[]
  contributionsByTask: Map<string, Record<TaskProgressStatus, StatusContribution[]>>
  currentUserId: string
  editingTaskId: string | null
  emptyMessage: string
  folderOwnerId?: string
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  onCloseEdit: () => void
  onAddTaskMember?: (task: Task, username: string) => Promise<void> | void
  onDeleteTask: (task: Task) => void
  onEditTask: (taskId: string) => void
  onMoveTask: (task: Task, direction: ReorderDirection) => void
  onRemoveTaskMember?: (task: Task, userId: string) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onUndoAction: (action: TaskStatusAction) => void
  onUpdateTask: (taskId: string, values: TaskEditValues) => void
  pendingAction: string | null
  taskMembersByTask?: Map<string, TaskMember[]>
  tasks: Task[]
}

export function TaskList({
  assignableMembers,
  contributionsByTask,
  currentUserId,
  editingTaskId,
  emptyMessage,
  folderOwnerId,
  getProfileLabel,
  isSaving,
  onCloseEdit,
  onAddTaskMember,
  onDeleteTask,
  onEditTask,
  onMoveTask,
  onRemoveTaskMember,
  onSetTaskStatus,
  onUndoAction,
  onUpdateTask,
  pendingAction,
  taskMembersByTask,
  tasks,
}: TaskListProps) {
  const reorderableTaskIds = tasks
    .filter((task) => (task.folder_id ? folderOwnerId === currentUserId : task.owner_id === currentUserId))
    .map((task) => task.id)

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard
          assignableMembers={assignableMembers}
          contributions={contributionsByTask.get(task.id)}
          currentUserId={currentUserId}
          editingTaskId={editingTaskId}
          folderOwnerId={folderOwnerId}
          getProfileLabel={getProfileLabel}
          isSaving={isSaving}
          isFirst={reorderableTaskIds[0] === task.id}
          isLast={reorderableTaskIds[reorderableTaskIds.length - 1] === task.id}
          key={task.id}
          onAddTaskMember={onAddTaskMember}
          onCloseEdit={onCloseEdit}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onMoveTask={onMoveTask}
          onRemoveTaskMember={onRemoveTaskMember}
          onSetTaskStatus={onSetTaskStatus}
          onUndoAction={onUndoAction}
          onUpdateTask={onUpdateTask}
          pendingAction={pendingAction}
          task={task}
          taskMembers={taskMembersByTask?.get(task.id)}
        />
      ))}
      {!tasks.length ? <EmptyState>{emptyMessage}</EmptyState> : null}
    </div>
  )
}
