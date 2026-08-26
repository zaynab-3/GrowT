import { useRef, useState, type MouseEvent } from 'react'
import {
  Archive,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheckBig,
  CircleDot,
  CircleGauge,
  Edit2,
  ExternalLink,
  FileOutput,
  GripVertical,
  MoreHorizontal,
  ReceiptText,
  Share2,
  Trash2,
  UserRoundPlus,
} from 'lucide-react'
import type { ReorderDirection, TaskProgressStatus } from '../../lib/database.types'
import { formatDateTime, getCategoryLabel } from '../../lib/growtDisplay'
import type { Task, TaskLevel, TaskMember, TaskStatusAction } from '../../lib/growtData'
import type { RecipientReport } from '../../lib/recipient'
import { TaskEditForm, type TaskEditValues } from './TaskEditForm'
import { SwipeActions } from '../../components/SwipeActions'
import { UserAvatar } from '../../components/UserAvatar'
import { LinkifiedText } from '../../components/LinkifiedText'
import { TaskStatusParticipants, type TaskStatusContributions } from './TaskStatusParticipants'
import { TaskChecklist } from './TaskChecklist'
import { RecipientReportPopup } from '../../components/RecipientReportPopup'

type StatusContribution = { action: TaskStatusAction; userId: string }
type AssignableMember = { id: string; label: string }

const EMPTY_TASK_LEVEL_SET = new Set<string>()
const taskStatusOptions = [
  { Icon: CircleDot, id: 'ongoing', label: 'Ongoing' },
  { Icon: CircleGauge, id: 'half_done', label: 'Half done' },
  { Icon: CircleCheckBig, id: 'completed', label: 'Completed' },
] as const

type TaskCardProps = {
  assignableMembers: AssignableMember[]
  contributions?: Record<TaskProgressStatus, StatusContribution[]>
  currentUserId: string
  editingTaskId: string | null
  forceExportButton?: boolean
  folderOwnerId?: string
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  isFirst: boolean
  isLast: boolean
  onAddTaskMember?: (task: Task, username: string) => Promise<void> | void
  onCloseEdit: () => void
  onCopyShareLink?: (type: 'task', id: string) => void
  onDeleteTask: (task: Task) => void
  onEditTask: (taskId: string) => void
  onMoveTask: (task: Task, direction: ReorderDirection, scopedTaskIds?: string[]) => void
  onRemoveTaskMember?: (task: Task, userId: string) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onSetTaskExported: (taskId: string, isExported?: boolean) => void
  onToggleTaskLevel: (taskId: string, taskLevelId: string, checked: boolean) => void
  onUndoAction: (action: TaskStatusAction) => void
  onUpdateTask: (taskId: string, values: TaskEditValues) => void
  onOpenTask?: (task: Task) => void
  pendingAction: string | null
  recipientReport?: RecipientReport
  scopedTaskIds?: string[]
  statusHistory?: TaskStatusContributions
  task: Task
  taskLevelCompletedIds?: Set<string>
  taskLevels?: TaskLevel[]
  taskMembers?: TaskMember[]
}

export function TaskCard({
  assignableMembers,
  contributions,
  currentUserId,
  editingTaskId,
  forceExportButton = false,
  folderOwnerId,
  getProfileAvatar,
  getProfileLabel,
  isSaving,
  isFirst,
  isLast,
  onCloseEdit,
  onCopyShareLink,
  onDeleteTask,
  onEditTask,
  onMoveTask,
  onRemoveTaskMember,
  onSetTaskExported,
  onSetTaskStatus,
  onToggleTaskLevel,
  onUndoAction,
  onOpenTask,
  onUpdateTask,
  pendingAction,
  recipientReport,
  scopedTaskIds,
  task,
  taskLevelCompletedIds,
  taskLevels = [],
}: TaskCardProps) {
  const canManageTask = task.owner_id === currentUserId || folderOwnerId === currentUserId
  const canExportTask = canManageTask || forceExportButton || task.has_export_button
  const canEditRecipientAmount = task.folder_id ? folderOwnerId === currentUserId : task.owner_id === currentUserId
  const canReorderTask = task.folder_id ? folderOwnerId === currentUserId : task.owner_id === currentUserId
  const isEditing = editingTaskId === task.id
  const [recipientAnchor, setRecipientAnchor] = useState<DOMRect | null>(null)
  const actionMenuRef = useRef<HTMLDetailsElement>(null)
  const reorderMenuRef = useRef<HTMLDetailsElement>(null)

  let currentUserStatus: TaskProgressStatus | null = null
  if (contributions) {
    if (contributions.completed.some((contribution) => contribution.userId === currentUserId)) {
      currentUserStatus = 'completed'
    } else if (contributions.half_done.some((contribution) => contribution.userId === currentUserId)) {
      currentUserStatus = 'half_done'
    } else if (contributions.ongoing.some((contribution) => contribution.userId === currentUserId)) {
      currentUserStatus = 'ongoing'
    }
  }

  const isCompleted = !task.is_active || currentUserStatus === 'completed'
  const completedLevelIds = taskLevelCompletedIds ?? EMPTY_TASK_LEVEL_SET
  const canUpdateStatus = task.assigned_user_id ? task.assigned_user_id === currentUserId : true
  const currentContributions = contributions
    ? Object.values(contributions)
        .flat()
        .sort((first, second) => Date.parse(second.action.created_at) - Date.parse(first.action.created_at))
    : []
  const currentUserContribution = currentContributions.find((row) => row.userId === currentUserId)
  const statusToggleAction = currentUserContribution?.action ?? null
  const statusToggleStatus = statusToggleAction?.new_status ?? null

  const handleStatusChange = (event: MouseEvent, status: TaskProgressStatus) => {
    event.stopPropagation()

    if (statusToggleAction?.new_status === status) {
      onUndoAction(statusToggleAction)
      return
    }

    if (canUpdateStatus) onSetTaskStatus(task.id, status)
  }

  const isStatusDisabled = (status: TaskProgressStatus) =>
    pendingAction !== null || (!canUpdateStatus && statusToggleStatus !== status)

  const getStatusTitle = (status: TaskProgressStatus, label: string) => {
    if (statusToggleStatus === status) return `Clear ${label.toLowerCase()} status`
    if (canUpdateStatus) return `Mark as ${label.toLowerCase()}`
    return 'Only the assigned user can update status'
  }

  const closeActionMenu = () => {
    if (actionMenuRef.current) actionMenuRef.current.open = false
  }

  const closeReorderMenu = () => {
    if (reorderMenuRef.current) reorderMenuRef.current.open = false
  }

  if (isEditing) {
    return (
      <div className="task-work-card task-work-card--editing">
        <TaskEditForm
          assignableMembers={assignableMembers}
          canEditRecipientAmount={canEditRecipientAmount}
          forceExportButton={forceExportButton}
          isSaving={isSaving}
          onCancel={onCloseEdit}
          onSave={(values) => onUpdateTask(task.id, values)}
          task={task}
          taskLevels={taskLevels}
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
        if (canManageTask) onDeleteTask(task)
        else if (onRemoveTaskMember) onRemoveTaskMember(task, currentUserId)
      }}
    >
      <article
        className={`task-work-card task-work-card--${task.category}${isCompleted ? ' task-work-card--complete' : ''}`}
        onClick={() => onOpenTask?.(task)}
      >
        <div className="task-row">
          <details
            className="task-row__reorder"
            onClick={(event) => event.stopPropagation()}
            ref={reorderMenuRef}
          >
            <summary aria-label="Reorder task" title="Reorder task">
              <GripVertical aria-hidden="true" size={21} />
            </summary>
            <div className="task-row__reorder-menu">
              <button
                disabled={isSaving || !canReorderTask || isFirst}
                onClick={() => {
                  onMoveTask(task, 'up', scopedTaskIds)
                  closeReorderMenu()
                }}
                type="button"
              >
                <ChevronUp aria-hidden="true" size={16} />
                Move up
              </button>
              <button
                disabled={isSaving || !canReorderTask || isLast}
                onClick={() => {
                  onMoveTask(task, 'down', scopedTaskIds)
                  closeReorderMenu()
                }}
                type="button"
              >
                <ChevronDown aria-hidden="true" size={16} />
                Move down
              </button>
            </div>
          </details>

          <div className="task-row__body">
            <div className="task-row__header">
              <div className={`task-row__category task-row__category--${task.category}`}>
                <i aria-hidden="true" />
                <span>{getCategoryLabel(task.category)}</span>
              </div>

              <div className="task-row__actions" onClick={(event) => event.stopPropagation()}>
                {canExportTask ? (
                  <button
                    aria-busy={pendingAction === `export:${task.id}`}
                    aria-label={task.is_exported ? 'Mark task as not exported' : 'Export task'}
                    aria-pressed={task.is_exported}
                    className={`task-row__export${task.is_exported ? ' is-exported' : ''}`}
                    disabled={pendingAction === `export:${task.id}`}
                    onClick={() => onSetTaskExported(task.id, !task.is_exported)}
                    title={task.is_exported ? 'Exported — tap to undo' : 'Export task'}
                    type="button"
                  >
                    {task.is_exported ? (
                      <Check aria-hidden="true" size={20} strokeWidth={2.8} />
                    ) : (
                      <FileOutput aria-hidden="true" size={20} strokeWidth={1.8} />
                    )}
                  </button>
                ) : null}

                {canManageTask ? (
                  <button
                    aria-label="Edit task"
                    onClick={() => onEditTask(task.id)}
                    title="Edit task"
                    type="button"
                  >
                    <Edit2 aria-hidden="true" size={17} />
                  </button>
                ) : null}

                <details className="task-action-menu" ref={actionMenuRef}>
                  <summary aria-label="More task actions" title="More actions">
                    <MoreHorizontal aria-hidden="true" size={19} />
                  </summary>
                  <div className="task-action-menu__popover">
                    {recipientReport ? (
                      <button
                        onClick={(event) => {
                          setRecipientAnchor(event.currentTarget.getBoundingClientRect())
                          closeActionMenu()
                        }}
                        type="button"
                      >
                        <ReceiptText aria-hidden="true" size={16} />
                        View recipients
                      </button>
                    ) : null}

                    {!task.folder_id && canManageTask && onCopyShareLink ? (
                      <button
                        onClick={() => {
                          onCopyShareLink('task', task.id)
                          closeActionMenu()
                        }}
                        type="button"
                      >
                        <Share2 aria-hidden="true" size={16} />
                        Copy share link
                      </button>
                    ) : null}

                    {canManageTask ? (
                      <button
                        className="is-danger"
                        onClick={() => {
                          onDeleteTask(task)
                          closeActionMenu()
                        }}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={16} />
                        Delete task
                      </button>
                    ) : onRemoveTaskMember ? (
                      <button
                        className="is-danger"
                        onClick={() => {
                          onRemoveTaskMember(task, currentUserId)
                          closeActionMenu()
                        }}
                        type="button"
                      >
                        <Archive aria-hidden="true" size={16} />
                        Leave task
                      </button>
                    ) : null}
                  </div>
                </details>
              </div>
            </div>

            <div className="task-row__title">
              <h3>{task.title}</h3>
            </div>

            {task.description && taskLevels.length === 0 ? (
              <div className="task-row__description">
                <LinkifiedText text={task.description} />
              </div>
            ) : null}

            {task.external_source === 'google_tasks' && task.external_url ? (
              <a
                className="task-row__source-link"
                href={task.external_url}
                onClick={(event) => event.stopPropagation()}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden="true" size={14} />
                Open original task for images and attachments
              </a>
            ) : null}

            {taskLevels.length > 0 ? (
              <TaskChecklist
                compact
                completedLevelIds={completedLevelIds}
                disabled={pendingAction !== null || !canUpdateStatus}
                levels={taskLevels}
                onToggle={(taskLevelId, checked) => onToggleTaskLevel(task.id, taskLevelId, checked)}
                pendingAction={pendingAction}
              />
            ) : null}

            <div className="task-row__status-grid" onClick={(event) => event.stopPropagation()}>
              {taskStatusOptions.map(({ Icon, id, label }) => (
                <button
                  aria-label={getStatusTitle(id, label)}
                  aria-pressed={statusToggleStatus === id}
                  className={`task-row-status task-row-status--${id}${contributions?.[id].length ? ' task-row-status--has-participants' : ''}${statusToggleStatus === id ? ' is-active' : ''}`}
                  disabled={isStatusDisabled(id)}
                  key={id}
                  onClick={(event) => handleStatusChange(event, id)}
                  title={getStatusTitle(id, label)}
                  type="button"
                >
                  <Icon aria-hidden="true" size={20} />
                  <span className="task-row-status__label">{label}</span>
                  <TaskStatusParticipants
                    getProfileAvatar={getProfileAvatar}
                    getProfileLabel={getProfileLabel}
                    rows={contributions?.[id] ?? []}
                    showEmpty
                  />
                </button>
              ))}
            </div>

            <div className="task-row__meta" onClick={(event) => event.stopPropagation()}>
              <button
                className="task-row__assignee"
                onClick={() => {
                  if (canManageTask) onEditTask(task.id)
                }}
                type="button"
              >
                {task.assigned_user_id ? (
                  <>
                    <UserAvatar
                      avatarUrl={getProfileAvatar(task.assigned_user_id)}
                      className="task-row__assignee-avatar"
                      label={getProfileLabel(task.assigned_user_id)}
                    />
                    <span>{getProfileLabel(task.assigned_user_id)}</span>
                  </>
                ) : (
                  <>
                    <UserRoundPlus aria-hidden="true" size={17} />
                    <span>Unassigned</span>
                  </>
                )}
              </button>

              {task.due_date ? (
                <span className="task-row__due">
                  <Calendar aria-hidden="true" size={15} />
                  {formatDateTime(task.due_date)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {recipientReport && recipientAnchor ? (
          <RecipientReportPopup
            anchorRect={recipientAnchor}
            getProfileAvatar={getProfileAvatar}
            getProfileLabel={getProfileLabel}
            isOpen
            onClose={() => setRecipientAnchor(null)}
            report={recipientReport}
            subtitle={`${task.title} · ${recipientReport.taskCount} ${recipientReport.taskCount === 1 ? 'task' : 'tasks'}`}
            title="Task recipients"
          />
        ) : null}
      </article>
    </SwipeActions>
  )
}
