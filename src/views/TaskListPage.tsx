import {
  BriefcaseBusiness,
  CheckSquare,
  CircleCheckBig,
  CircleDot,
  CircleGauge,
  LayoutGrid,
  Plus,
  ReceiptText,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReorderDirection, TaskProgressStatus } from '../lib/database.types'
import type { Folder as _Folder, Task, TaskLevel, TaskMember, TaskStatusAction } from '../lib/growtData'
import type { RecipientReport } from '../lib/recipient'
import '../features/tasks/Tasks.css'
import { TaskCard } from '../features/tasks/TaskCard'
import type { TaskEditValues } from '../features/tasks/TaskEditForm'

type AssignableMember = { id: string; label: string }
type StatusContribution = { action: TaskStatusAction; userId: string }
type TaskScope = 'all' | 'personal' | 'work' | 'shared'
type ProgressFilter = 'all' | TaskProgressStatus

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
  onCopyShareLink: (type: 'task', id: string) => void
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
  onCopyShareLink,
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
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const scopeRefs = useRef<Record<TaskScope, HTMLButtonElement | null>>({
    all: null,
    personal: null,
    shared: null,
    work: null,
  })

  useEffect(() => {
    scopeRefs.current[scope]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [scope])

  const personalCount = standaloneTasks.filter((t) => t.category === 'personal').length
  const workCount = standaloneTasks.filter((t) => t.category === 'work').length
  const sharedCount = standaloneTasks.filter((t) => t.category === 'shared').length

  const visibleTasks = useMemo(
    () =>
      standaloneTasks.filter((task) => {
        const matchesScope =
          scope === 'all' ||
          (scope === 'personal' && task.category === 'personal') ||
          (scope === 'work' && task.category === 'work') ||
          (scope === 'shared' && task.category === 'shared')

        if (!matchesScope) return false
        if (progressFilter === 'all') return true

        return (contributionsByTask.get(task.id)?.[progressFilter].length ?? 0) > 0
      }),
    [contributionsByTask, progressFilter, scope, standaloneTasks],
  )

  const reorderableIds = visibleTasks
    .filter((t) => t.owner_id === currentUserId)
    .map((t) => t.id)

  const taskTotals = useMemo(() => {
    return standaloneTasks.reduce(
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
  }, [standaloneTasks, contributionsByTask])

  const scopeOptions = [
    { Icon: LayoutGrid, count: standaloneTasks.length, id: 'all' as const, label: 'All' },
    { Icon: UserRound, count: personalCount, id: 'personal' as const, label: 'Personal' },
    { Icon: BriefcaseBusiness, count: workCount, id: 'work' as const, label: 'Work' },
    { Icon: UsersRound, count: sharedCount, id: 'shared' as const, label: 'Shared' },
  ]

  const progressOptions = [
    { Icon: LayoutGrid, count: standaloneTasks.length, id: 'all' as const, label: 'All statuses' },
    { Icon: CircleDot, count: taskTotals.ongoing, id: 'ongoing' as const, label: 'Ongoing' },
    { Icon: CircleGauge, count: taskTotals.half_done, id: 'half_done' as const, label: 'Half done' },
    { Icon: CircleCheckBig, count: taskTotals.completed, id: 'completed' as const, label: 'Completed' },
  ]

  return (
    <div className="task-list-page growt-page flex-1 w-full flex flex-col gap-5 sm:gap-6">
      <header className="task-list-page__header flex flex-wrap md:flex-nowrap items-center justify-between gap-4 mb-6">
        <div className="gui-page-heading">
          <span className="gui-page-heading__icon">
            <ReceiptText aria-hidden="true" size={22} />
          </span>
          <h1>Standalone tasks</h1>
        </div>

        <button aria-label="Create a new task" id="add-task-btn" onClick={onAddTask} type="button">
          <Plus aria-hidden="true" size={20} />
          <span>New task</span>
        </button>
      </header>

      <div className="task-list-page__content">
        <div className="task-filter-region">
          <div aria-label="Task categories" className="task-scope-filters" role="group">
            {scopeOptions.map(({ Icon, count, id, label }) => (
              <button
                aria-label={`${label}, ${count} tasks`}
                aria-pressed={scope === id}
                className={`task-scope-option task-scope-option--${id}${scope === id ? ' is-active' : ''}`}
                key={id}
                onClick={() => setScope(id)}
                ref={(element) => {
                  scopeRefs.current[id] = element
                }}
                title={`${label} · ${count}`}
                type="button"
              >
                <Icon aria-hidden="true" size={18} />
                <span className="task-scope-option__label">{label}</span>
                <small>{count}</small>
              </button>
            ))}
          </div>

          <div className="task-progress-filter">
            <button
              aria-expanded={isFilterOpen}
              className={progressFilter === 'all' ? 'task-progress-filter__toggle' : 'task-progress-filter__toggle is-active'}
              onClick={() => setIsFilterOpen((current) => !current)}
              type="button"
            >
              <SlidersHorizontal aria-hidden="true" size={17} />
              <span>{progressFilter === 'all' ? 'Filter' : progressOptions.find((option) => option.id === progressFilter)?.label}</span>
            </button>

            {isFilterOpen ? (
              <div className="task-progress-filter__menu">
                <div>
                  <strong>Filter by progress</strong>
                  <button aria-label="Close filter menu" onClick={() => setIsFilterOpen(false)} type="button">
                    <X aria-hidden="true" size={16} />
                  </button>
                </div>
                {progressOptions.map(({ Icon, count, id, label }) => (
                  <button
                    aria-pressed={progressFilter === id}
                    className={progressFilter === id ? 'is-active' : ''}
                    key={id}
                    onClick={() => {
                      setProgressFilter(id)
                      setIsFilterOpen(false)
                    }}
                    type="button"
                  >
                    <Icon aria-hidden="true" size={17} />
                    <span>{label}</span>
                    <small>{count}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <section aria-label="Standalone task list" className="task-list-surface">
          <div className="task-list-surface__heading">
            <div>
              <strong>{progressFilter === 'all' ? 'All tasks' : progressOptions.find((option) => option.id === progressFilter)?.label}</strong>
              <span>{visibleTasks.length}</span>
            </div>
            {progressFilter !== 'all' || scope !== 'all' ? (
              <button
                onClick={() => {
                  setProgressFilter('all')
                  setScope('all')
                }}
                type="button"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          <div className="task-list grid gap-3 sm:gap-4">
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
                  onCopyShareLink={onCopyShareLink}
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
              <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-5 sm:px-6 text-center bg-surface rounded-2xl border border-surface-variant/50">
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
        </section>
      </div>
    </div>
  )
}
