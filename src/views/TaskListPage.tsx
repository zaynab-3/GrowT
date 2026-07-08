import { Plus, CheckSquare } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReorderDirection, TaskProgressStatus } from '../lib/database.types'
import type { Folder as _Folder, Task, TaskLevel, TaskMember, TaskStatusAction } from '../lib/growtData'
import type { RecipientReport } from '../lib/recipient'
import '../features/tasks/Tasks.css'
import { TaskCard } from '../features/tasks/TaskCard'
import type { TaskEditValues } from '../features/tasks/TaskEditForm'

type AssignableMember = { id: string; label: string }
type StatusContribution = { action: TaskStatusAction; userId: string }
type TaskScope = 'all' | 'personal' | 'work' | 'shared'

type TaskListPageProps = {
  assignableMembers: AssignableMember[]
  contributionsByTask: Map<string, Record<TaskProgressStatus, StatusContribution[]>>
  currentUserId: string
  editingTaskId: string | null
  folders?: _Folder[]
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  normalizedSearchQuery: string
  onAddTask: () => void
  onCloseTaskEdit: () => void
  onDeleteTask: (task: Task) => void
  onEditTask: (taskId: string) => void
  onMoveTask: (task: Task, direction: ReorderDirection, scopedTaskIds?: string[]) => void
  onOpenTask: (task: Task) => void
  onRemoveTaskMember: (task: Task, userId: string) => void
  onAddTaskMember: (task: Task, username: string) => void
  onSetTaskExported: (taskId: string, isExported?: boolean) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onToggleTaskLevel: (taskId: string, taskLevelId: string, checked: boolean) => void
  onUndoAction: (action: TaskStatusAction) => void
  onUpdateTask: (taskId: string, values: TaskEditValues) => void
  pendingAction: string | null
  recipientReportsByTask: Map<string, RecipientReport>
  standaloneTasks: Task[]
  statusHistoryByTask: Map<string, Record<TaskProgressStatus, StatusContribution[]>>
  taskLevelCompletedIdsByTask: Map<string, Set<string>>
  taskLevelsByTask: Map<string, TaskLevel[]>
  taskMembersByTask: Map<string, TaskMember[]>
}

export function TaskListPage({
  assignableMembers,
  contributionsByTask,
  currentUserId,
  editingTaskId,
  getProfileAvatar,
  getProfileLabel,
  isSaving,
  normalizedSearchQuery,
  onAddTask,
  onCloseTaskEdit,
  onDeleteTask,
  onEditTask,
  onMoveTask,
  onOpenTask,
  onRemoveTaskMember,
  onAddTaskMember,
  onSetTaskExported,
  onSetTaskStatus,
  onToggleTaskLevel,
  onUndoAction,
  onUpdateTask,
  pendingAction,
  recipientReportsByTask,
  standaloneTasks,
  statusHistoryByTask,
  taskLevelCompletedIdsByTask,
  taskLevelsByTask,
  taskMembersByTask,
}: TaskListPageProps) {
  const [scope, setScope] = useState<TaskScope>('all')

  const personalCount = standaloneTasks.filter((t) => t.category === 'personal').length
  const workCount = standaloneTasks.filter((t) => t.category === 'work').length
  const sharedCount = standaloneTasks.filter((t) => t.category === 'shared').length

  const visibleTasks = useMemo(
    () =>
      standaloneTasks.filter((t) => {
        if (scope === 'personal') return t.category === 'personal'
        if (scope === 'work') return t.category === 'work'
        if (scope === 'shared') return t.category === 'shared'
        return true
      }),
    [standaloneTasks, scope],
  )

  const reorderableIds = visibleTasks
    .filter((t) => t.owner_id === currentUserId)
    .map((t) => t.id)

  const taskTotals = useMemo(() => {
    return visibleTasks.reduce(
      (totals, task) => {
        const tc = contributionsByTask.get(task.id)
        return {
          completed: totals.completed + (tc?.completed.length ?? 0),
          half_done: totals.half_done + (tc?.half_done.length ?? 0),
          ongoing: totals.ongoing + (tc?.ongoing.length ?? 0),
        }
      },
      { completed: 0, half_done: 0, ongoing: 0 }
    )
  }, [visibleTasks, contributionsByTask])



  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-6">
      <div className="workspace-header-compact">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="page-header__eyebrow" style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>
              Tasks
            </span>
            <h1>Standalone Tasks</h1>
            <p className="page-header__desc" style={{ margin: '4px 0 0', color: 'var(--ink-3)', fontSize: '14px' }}>
              All your standalone tasks — personal, work, and shared. For folder tasks, open a folder from the Workspaces page.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-primary text-white font-label-md text-label-md px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary-dark transition-all shadow-md shadow-primary/20 whitespace-nowrap" onClick={onAddTask} type="button" id="add-task-btn">
              <Plus size={16} />
              New Task
            </button>
          </div>
        </div>
      </div>

      <div className="workspace-layout-cols">
        {/* Left Column: Filters and Tasks List */}
        <div className="workspace-main-col">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap pb-2">
            {(['all', 'personal', 'work', 'shared'] as TaskScope[]).map((s) => (
              <button
                className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-colors whitespace-nowrap ${scope === s ? 'bg-primary text-white font-bold' : 'bg-surface-container-high dark:bg-dark-card text-on-surface-variant hover:bg-surface-variant'}`}
                key={s}
                onClick={() => setScope(s)}
                type="button"
              >
                {s === 'all' ? `All (${standaloneTasks.length})` : s === 'personal' ? `Personal (${personalCount})` : s === 'work' ? `Work (${workCount})` : `Shared (${sharedCount})`}
              </button>
            ))}
          </div>

          {/* Tasks Grid */}
          <div className="task-list" style={{ display: 'grid', gap: '16px' }}>
            {visibleTasks.length > 0 ? (
              visibleTasks.map((task) => (
                <TaskCard
                  assignableMembers={assignableMembers}
                  contributions={contributionsByTask.get(task.id)}
                  currentUserId={currentUserId}
                  editingTaskId={editingTaskId}
                  getProfileAvatar={getProfileAvatar}
                  getProfileLabel={getProfileLabel}
                  isSaving={isSaving}
                  isFirst={reorderableIds[0] === task.id}
                  isLast={reorderableIds[reorderableIds.length - 1] === task.id}
                  key={task.id}
                  onAddTaskMember={onAddTaskMember}
                  onCloseEdit={onCloseTaskEdit}
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
                  recipientReport={recipientReportsByTask.get(task.id)}
                  scopedTaskIds={reorderableIds}
                  statusHistory={statusHistoryByTask.get(task.id)}
                  task={task}
                  taskLevelCompletedIds={taskLevelCompletedIdsByTask.get(task.id)}
                  taskLevels={taskLevelsByTask.get(task.id)}
                  taskMembers={taskMembersByTask.get(task.id)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-surface dark:bg-dark-card rounded-2xl border border-surface-variant/50">
                <CheckSquare size={48} className="text-outline mb-4" />
                <h4 className="font-title-lg text-title-lg text-on-surface mb-2">No tasks found</h4>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                  {normalizedSearchQuery
                    ? 'No tasks match your search.'
                    : standaloneTasks.length
                    ? 'No tasks in this category.'
                    : 'No standalone tasks yet. Create your first task to get started.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Statistics & Guides */}
        <div className="workspace-side-col">
          <div className="workspace-preview-panel">
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
              Tasks Overview
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--ink-3)', lineHeight: 1.4 }}>
              Current progress and breakdown of your standalone tasks.
            </p>

            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center justify-between p-3 bg-surface-soft dark:bg-surface-container rounded-xl border border-surface-variant/30">
                <span className="flex items-center gap-2 font-medium text-sm text-on-surface">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--ongoing-color)' }} />
                  Ongoing
                </span>
                <strong className="text-on-surface text-sm">{taskTotals.ongoing}</strong>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-soft dark:bg-surface-container rounded-xl border border-surface-variant/30">
                <span className="flex items-center gap-2 font-medium text-sm text-on-surface">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--halfdone-color)' }} />
                  Half Done
                </span>
                <strong className="text-on-surface text-sm">{taskTotals.half_done}</strong>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-soft dark:bg-surface-container rounded-xl border border-surface-variant/30">
                <span className="flex items-center gap-2 font-medium text-sm text-on-surface">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--done-color)' }} />
                  Completed
                </span>
                <strong className="text-on-surface text-sm">{taskTotals.completed}</strong>
              </div>
            </div>
          </div>

          <div className="workspace-preview-panel" style={{ background: 'var(--surface-soft)' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>Understanding Tasks</h3>
            <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12.5px', color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.4 }}>
              <li>
                <strong>Standalone:</strong> These tasks exist outside of any workspace folder and are private unless shared.
              </li>
              <li>
                <strong>Folder Tasks:</strong> To collaborate on folder-specific tasks, create them directly inside their respective folder page.
              </li>
              <li>
                <strong>Categories:</strong> Filter tasks by Personal or Work scopes using the category pill selections.
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  )
}
