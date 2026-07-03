import type { FolderCategory, ReorderDirection, TaskProgressStatus } from '../../lib/database.types'
import type { Task, TaskLevel, TaskMember, TaskStatusAction } from '../../lib/growtData'
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
  getProfileAvatar: (userId: string | undefined | null) => string | null
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  onCloseEdit: () => void
  onAddTaskMember: (task: Task, username: string) => void
  onCreateTask: (values: TaskCreateValues) => void
  onDeleteTask: (task: Task) => void
  onEditTask: (taskId: string) => void
  onMoveTask: (task: Task, direction: ReorderDirection, scopedTaskIds?: string[]) => void
  onOpenTask: (task: Task) => void
  onRemoveTaskMember: (task: Task, userId: string) => void
  onSetTaskExported: (taskId: string, isExported?: boolean) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onToggleTaskLevel: (taskId: string, taskLevelId: string, checked: boolean) => void
  onUndoAction: (action: TaskStatusAction) => void
  onUpdateTask: (taskId: string, values: TaskEditValues) => void
  pendingAction: string | null
  sectionLabel?: string
  taskLevelCompletedIdsByTask: Map<string, Set<string>>
  taskLevelsByTask: Map<string, TaskLevel[]>
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
  getProfileAvatar,
  getProfileLabel,
  isSaving,
  onCloseEdit,
  onAddTaskMember,
  onCreateTask,
  onDeleteTask,
  onEditTask,
  onMoveTask,
  onOpenTask,
  onRemoveTaskMember,
  onSetTaskExported,
  onSetTaskStatus,
  onToggleTaskLevel,
  onUndoAction,
  onUpdateTask,
  pendingAction,
  sectionLabel = 'My tasks',
  taskLevelCompletedIdsByTask,
  taskLevelsByTask,
  taskMembersByTask,
  tasks,
  title = 'Standalone Tasks',
}: StandaloneTasksPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">{sectionLabel}</p>
          <h3 className="text-xl font-bold text-on-surface">{title}</h3>
        </div>
        <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-label-md text-label-md">{tasks.length}</span>
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
        getProfileAvatar={getProfileAvatar}
        getProfileLabel={getProfileLabel}
        isSaving={isSaving}
        onCloseEdit={onCloseEdit}
        onAddTaskMember={onAddTaskMember}
        onDeleteTask={onDeleteTask}
        onEditTask={onEditTask}
        onMoveTask={onMoveTask}
        onOpenTask={onOpenTask}
        onRemoveTaskMember={onRemoveTaskMember}
        onSetTaskExported={onSetTaskExported}
        onSetTaskStatus={onSetTaskStatus}
        onToggleTaskLevel={onToggleTaskLevel}
        onUndoAction={onUndoAction}
        onUpdateTask={onUpdateTask}
        pendingAction={pendingAction}
        taskLevelCompletedIdsByTask={taskLevelCompletedIdsByTask}
        taskLevelsByTask={taskLevelsByTask}
        taskMembersByTask={taskMembersByTask}
        tasks={tasks}
      />
    </div>
  )
}
