import type { TaskProgressStatus } from '../../lib/database.types'
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
  onAddTaskMember?: (task: Task, username: string) => void
  onDeleteTask: (task: Task) => void
  onEditTask: (taskId: string) => void
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
  onRemoveTaskMember,
  onSetTaskStatus,
  onUndoAction,
  onUpdateTask,
  pendingAction,
  taskMembersByTask,
  tasks,
}: TaskListProps) {
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
          key={task.id}
          onAddTaskMember={onAddTaskMember}
          onCloseEdit={onCloseEdit}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
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
