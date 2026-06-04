import type { FolderCategory, ReorderDirection, TaskProgressStatus } from '../../lib/database.types'
import type { Task, TaskMember, TaskStatusAction } from '../../lib/growtData'
import { TaskForm, type TaskCreateValues } from './TaskForm'
import { TaskList } from './TaskList'
import type { TaskEditValues } from './TaskEditForm'

type StatusContribution = {
  action: TaskStatusAction
  userId: string
}

type AssignableMember = {
  id: string
  label: string
}

type StandaloneTasksPanelProps = {
  assignableMembers: AssignableMember[]
  contributionsByTask: Map<string, Record<TaskProgressStatus, StatusContribution[]>>
  currentUserId: string
  defaultCategory?: FolderCategory
  editingTaskId: string | null
  emptyMessage: string
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  onCloseEdit: () => void
  onAddTaskMember: (task: Task, username: string) => void
  onCreateTask: (values: TaskCreateValues) => void
  onDeleteTask: (task: Task) => void
  onEditTask: (taskId: string) => void
  onMoveTask: (task: Task, direction: ReorderDirection) => void
  onRemoveTaskMember: (task: Task, userId: string) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onUndoAction: (action: TaskStatusAction) => void
  onUpdateTask: (taskId: string, values: TaskEditValues) => void
  pendingAction: string | null
  sectionLabel?: string
  taskMembersByTask: Map<string, TaskMember[]>
  tasks: Task[]
  title?: string
}

export function StandaloneTasksPanel({
  assignableMembers,
  contributionsByTask,
  currentUserId,
  defaultCategory = 'personal',
  editingTaskId,
  emptyMessage,
  getProfileLabel,
  isSaving,
  onCloseEdit,
  onAddTaskMember,
  onCreateTask,
  onDeleteTask,
  onEditTask,
  onMoveTask,
  onRemoveTaskMember,
  onSetTaskStatus,
  onUndoAction,
  onUpdateTask,
  pendingAction,
  sectionLabel = 'My tasks',
  taskMembersByTask,
  tasks,
  title = 'Standalone Tasks',
}: StandaloneTasksPanelProps) {
  return (
    <section className="standalone-panel">
      <div className="panel-heading">
        <div>
          <p className="section-label">{sectionLabel}</p>
          <h2>{title}</h2>
        </div>
        <span>{tasks.length}</span>
      </div>
      <TaskForm
        defaultCategory={defaultCategory}
        isSaving={isSaving}
        onCreate={onCreateTask}
        showCategory
        submitLabel="Add task"
      />
      <TaskList
        assignableMembers={assignableMembers}
        contributionsByTask={contributionsByTask}
        currentUserId={currentUserId}
        editingTaskId={editingTaskId}
        emptyMessage={emptyMessage}
        getProfileLabel={getProfileLabel}
        isSaving={isSaving}
        onCloseEdit={onCloseEdit}
        onAddTaskMember={onAddTaskMember}
        onDeleteTask={onDeleteTask}
        onEditTask={onEditTask}
        onMoveTask={onMoveTask}
        onRemoveTaskMember={onRemoveTaskMember}
        onSetTaskStatus={onSetTaskStatus}
        onUndoAction={onUndoAction}
        onUpdateTask={onUpdateTask}
        pendingAction={pendingAction}
        taskMembersByTask={taskMembersByTask}
        tasks={tasks}
      />
    </section>
  )
}
