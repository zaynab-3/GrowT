import { useState } from 'react'
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleCheckBig,
  CircleDotDashed,
  CircleGauge,
  DollarSign,
  Edit3,
  ExternalLink,
  FileText,
  Link2,
  ListChecks,
  MoreHorizontal,
  ReceiptText,
  RotateCw,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react'
import { formatDateTime, getCategoryLabel } from '../lib/growtDisplay'
import type { TaskProgressStatus } from '../lib/database.types'
import type { Task, TaskLevel, TaskMember, TaskStatusAction } from '../lib/growtData'
import { formatCurrency, type RecipientReport } from '../lib/recipient'
import type { TaskStatusContributions } from '../features/tasks/TaskStatusParticipants'
import { TaskStatusParticipants } from '../features/tasks/TaskStatusParticipants'
import { TaskMembersPanel } from '../features/tasks/TaskMembersPanel'
import { UserAvatar } from '../components/UserAvatar'
import { RichDescription } from '../components/RichDescription'
import { getDescriptionPresentation } from '../lib/richDescription'
import { RecipientReportPopup } from '../components/RecipientReportPopup'

type StatusContribution = { action: TaskStatusAction; userId: string }

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

const activityOptions = [
  { id: 'ongoing' as const, label: 'Ongoing', Icon: RotateCw },
  { id: 'half_done' as const, label: 'Half done', Icon: CircleGauge },
  { id: 'completed' as const, label: 'Completed', Icon: CircleCheckBig },
]

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
  const [recipientAnchor, setRecipientAnchor] = useState<DOMRect | null>(null)
  const [showAllChecklistItems, setShowAllChecklistItems] = useState(false)
  const canManageTask = task.owner_id === currentUserId || folderOwnerId === currentUserId
  const showExportButton = forceExportButton || task.has_export_button
  const descriptionPresentation = getDescriptionPresentation(task.description || '')
  const completedChecklistCount = taskLevels.filter((level) => taskLevelCompletedIds.has(level.id)).length
  const visibleTaskLevels = showAllChecklistItems ? taskLevels : taskLevels.slice(0, 5)
  const contributionRows = statusHistory ?? contributions

  let currentUserStatus: TaskProgressStatus | null = null
  if (contributions) {
    if (contributions.completed.some((row) => row.userId === currentUserId)) currentUserStatus = 'completed'
    else if (contributions.half_done.some((row) => row.userId === currentUserId)) currentUserStatus = 'half_done'
    else if (contributions.ongoing.some((row) => row.userId === currentUserId)) currentUserStatus = 'ongoing'
  }

  const currentUserStatusAction = contributions
    ? Object.values(contributions)
        .flat()
        .find((row) => row.userId === currentUserId)?.action ?? null
    : null

  function handleStatusChange(status: TaskProgressStatus) {
    if (currentUserStatusAction?.new_status === status) {
      onUndoAction(currentUserStatusAction)
      return
    }
    onSetTaskStatus(task.id, status)
  }

  return (
    <main className="task-detail-redesign growt-page">
      <article className="task-detail-redesign__surface">
        <div className="task-detail-redesign__topline">
          <button className="task-detail-redesign__back" onClick={onBack} type="button">
            <ArrowLeft size={18} />
            Back to {task.folder_id ? 'folder' : 'tasks'}
          </button>

          {showExportButton ? (
            <button
              className={`task-detail-redesign__export${task.is_exported ? ' is-exported' : ''}`}
              disabled={pendingAction === `export:${task.id}`}
              onClick={() => onSetTaskExported(task.id, !task.is_exported)}
              type="button"
            >
              {task.is_exported ? <CheckCircle2 size={19} /> : <Upload size={19} />}
              {task.is_exported ? 'Exported' : 'Export'}
            </button>
          ) : null}
        </div>

        <div className="task-detail-redesign__identity">
          <p className={`task-detail-redesign__category task-detail-redesign__category--${task.category}`}>
            <span aria-hidden="true" />
            {getCategoryLabel(task.category)}
          </p>
          <h1>{task.title}</h1>
        </div>

        <div className="task-detail-redesign__actions">
          {task.external_source === 'google_tasks' && task.external_url ? (
            <a href={task.external_url} rel="noopener noreferrer" target="_blank">
              <ExternalLink size={18} />
              <span>Open in Google Tasks</span>
            </a>
          ) : null}

          {recipientReport ? (
            <button
              onClick={(event) => setRecipientAnchor(event.currentTarget.getBoundingClientRect())}
              type="button"
            >
              <ReceiptText size={18} />
              <span>Recipients</span>
            </button>
          ) : null}

          {canManageTask ? (
            <>
              <button
                disabled={isSaving}
                onClick={() => onCopyShareLink('task', task.id)}
                type="button"
              >
                <Link2 size={18} />
                <span>Share</span>
              </button>
              <button onClick={() => onEditTask(task.id)} type="button">
                <Edit3 size={18} />
                <span>Edit</span>
              </button>
              <details className="task-detail-redesign__more">
                <summary>
                  <MoreHorizontal size={19} />
                  <span>More</span>
                </summary>
                <div className="task-detail-redesign__more-menu">
                  <button
                    className="is-danger"
                    disabled={isSaving}
                    onClick={() => onDeleteTask(task)}
                    type="button"
                  >
                    <Trash2 size={17} />
                    Delete task
                  </button>
                </div>
              </details>
            </>
          ) : null}
        </div>
      </article>

      {task.description ? (
        <section className="task-detail-section task-detail-description" aria-labelledby="description-heading">
          <div className="task-detail-section__heading">
            <div>
              <FileText size={22} />
              <h2 id="description-heading">
                {descriptionPresentation.kind === 'notes' ? 'Description notes' : 'Description'}
              </h2>
              {descriptionPresentation.kind === 'notes' ? <span>{descriptionPresentation.count}</span> : null}
            </div>
            {canManageTask ? (
              <button aria-label="Edit description" onClick={() => onEditTask(task.id)} type="button">
                <Edit3 size={18} />
              </button>
            ) : null}
          </div>
          <RichDescription text={task.description} />
        </section>
      ) : null}

      {taskLevels.length > 0 ? (
        <section className="task-detail-section task-detail-checklist" aria-labelledby="checklist-heading">
          <div className="task-detail-section__heading">
            <div>
              <ListChecks size={22} />
              <h2 id="checklist-heading">Checklist</h2>
              <span>{completedChecklistCount}/{taskLevels.length}</span>
            </div>
          </div>

          <div className="task-detail-checklist__items">
            {visibleTaskLevels.map((level, index) => {
              const checked = taskLevelCompletedIds.has(level.id)
              const label = level.title?.trim() || level.description?.trim() || `Item ${index + 1}`

              return (
                <label className={checked ? 'is-checked' : ''} key={level.id}>
                  <span className="task-detail-checklist__box">
                    <input
                      checked={checked}
                      disabled={pendingAction !== null}
                      onChange={(event) => onToggleTaskLevel(task.id, level.id, event.target.checked)}
                      type="checkbox"
                    />
                    <Check size={15} />
                  </span>
                  <span>{label}</span>
                </label>
              )
            })}
          </div>

          {taskLevels.length > 5 ? (
            <button
              className="task-detail-checklist__toggle"
              onClick={() => setShowAllChecklistItems((current) => !current)}
              type="button"
            >
              {showAllChecklistItems ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              {showAllChecklistItems ? 'Show fewer items' : `Show ${taskLevels.length - 5} more`}
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="task-detail-section task-detail-activity" aria-labelledby="activity-heading">
        <div className="task-detail-section__heading">
          <div>
            <Activity size={22} />
            <h2 id="activity-heading">Activity</h2>
          </div>
        </div>

        <div className="task-detail-activity__grid">
          {activityOptions.map(({ Icon, id, label }) => (
            <button
              aria-pressed={currentUserStatus === id}
              className={`task-detail-activity__status task-detail-activity__status--${id}${currentUserStatus === id ? ' is-active' : ''}`}
              disabled={pendingAction !== null}
              key={id}
              onClick={() => handleStatusChange(id)}
              type="button"
            >
              <Icon size={22} />
              <span>
                <strong>{label}</strong>
                <TaskStatusParticipants
                  emptyLabel="No one yet"
                  getProfileAvatar={getProfileAvatar}
                  getProfileLabel={getProfileLabel}
                  rows={contributionRows?.[id] ?? []}
                  showEmpty
                />
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="task-detail-redesign__lower-grid">
        {taskMembers && onAddMember && onRemoveMember ? (
          <section className="task-detail-section task-detail-members">
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
          </section>
        ) : null}

        <section className="task-detail-section task-detail-facts" aria-labelledby="task-facts-heading">
          <div className="task-detail-section__heading">
            <div>
              <CircleDotDashed size={22} />
              <h2 id="task-facts-heading">Task details</h2>
            </div>
          </div>
          <dl>
            <div>
              <CalendarDays size={18} />
              <dt>Due date</dt>
              <dd>{task.due_date ? formatDateTime(task.due_date) : 'No due date'}</dd>
            </div>
            <div>
              <UserRound size={18} />
              <dt>Assigned to</dt>
              <dd>
                {task.assigned_user_id ? (
                  <>
                    <UserAvatar
                      avatarUrl={getProfileAvatar(task.assigned_user_id)}
                      className="task-detail-facts__avatar"
                      label={getProfileLabel(task.assigned_user_id)}
                    />
                    {getProfileLabel(task.assigned_user_id)}
                  </>
                ) : 'Unassigned'}
              </dd>
            </div>
            <div>
              <DollarSign size={18} />
              <dt>Recipient amount</dt>
              <dd>{formatCurrency(task.recipient_amount ?? 0)}</dd>
            </div>
          </dl>
        </section>
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
    </main>
  )
}
