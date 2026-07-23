import { type FormEvent, useState } from 'react'
import {
  ArrowLeft,
  BarChart2,
  CheckCircle,
  CircleCheckBig,
  CircleDot,
  CircleGauge,
  Edit2,
  Info,
  Link,
  LockKeyhole,
  ReceiptText,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react'
import { LinkifiedText } from '../components/LinkifiedText'
import { RecipientReportPopup } from '../components/RecipientReportPopup'
import { UserAvatar } from '../components/UserAvatar'
import type { FolderCategory, ReorderDirection, TaskProgressStatus } from '../lib/database.types'
import { formatDateTime, getCategoryLabel, isSharedFolder } from '../lib/growtDisplay'
import type { Folder, Task, TaskLevel, TaskStatusAction } from '../lib/growtData'
import { formatCurrency, type RecipientReport } from '../lib/recipient'
import { calculateFolderProgress } from '../lib/growtState'

import { TaskList } from '../features/tasks/TaskList'
import { TaskForm, type TaskCreateValues } from '../features/tasks/TaskForm'
import type { TaskEditValues } from '../features/tasks/TaskEditForm'
import { UserSearchDropdown } from '../components/UserSearchDropdown'

type StatusContribution = { action: TaskStatusAction; userId: string }
type AssignableMember = { id: string; label: string }

type FolderDetailPageProps = {
  assignableMembers: AssignableMember[]
  canInviteMembers: boolean
  contributionsByTask: Map<string, Record<TaskProgressStatus, StatusContribution[]>>
  currentUserId: string
  editingTaskId: string | null
  folder: Folder
  folderMemberUserIds: string[]
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  memberUsername: string
  normalizedSearchQuery: string
  onAddTask: () => void
  onBack: () => void
  onCloseTaskEdit: () => void
  onCopyShareLink: (type: 'folder', id: string) => void
  onCreateFolderTask: (values: TaskCreateValues) => void
  onDeleteFolder: (folder: Folder) => void
  onDeleteTask: (task: Task) => void
  onEditFolder: () => void
  onEditTask: (taskId: string) => void
  onInviteMember: (event: FormEvent<HTMLFormElement>) => void
  onMemberUsernameChange: (username: string) => void
  onMoveTask: (task: Task, direction: ReorderDirection) => void
  onSetTaskExported: (taskId: string, isExported?: boolean) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onToggleTaskLevel: (taskId: string, taskLevelId: string, checked: boolean) => void
  onUndoAction: (action: TaskStatusAction) => void
  onUpdateTask: (taskId: string, values: TaskEditValues) => void
  pendingAction: string | null
  recipientReport?: RecipientReport
  recipientReportsByTask?: Map<string, RecipientReport>
  statusHistoryByTask: Map<string, Record<TaskProgressStatus, StatusContribution[]>>
  taskLevelCompletedIdsByTask: Map<string, Set<string>>
  taskLevelsByTask: Map<string, TaskLevel[]>
  tasks: Task[]
}

const statusCards = [
  {
    Icon: CircleDot,
    key: 'ongoing' as const,
    label: 'Ongoing',
  },
  {
    Icon: CircleGauge,
    key: 'half_done' as const,
    label: 'Half Done',
  },
  {
    Icon: CircleCheckBig,
    key: 'completed' as const,
    label: 'Completed',
  },
]

export function FolderDetailPage({
  assignableMembers,
  canInviteMembers,
  contributionsByTask,
  currentUserId,
  editingTaskId,
  folder,
  folderMemberUserIds,
  getProfileAvatar,
  getProfileLabel,
  isSaving,
  memberUsername,
  normalizedSearchQuery,
  onBack,
  onCloseTaskEdit,
  onCopyShareLink,
  onCreateFolderTask,
  onDeleteFolder,
  onDeleteTask,
  onEditFolder,
  onEditTask,
  onInviteMember,
  onMemberUsernameChange,
  onMoveTask,
  onSetTaskExported,
  onSetTaskStatus,
  onToggleTaskLevel,
  onUndoAction,
  onUpdateTask,
  pendingAction,
  recipientReport,
  recipientReportsByTask,
  statusHistoryByTask,
  taskLevelCompletedIdsByTask,
  taskLevelsByTask,
  tasks,
}: FolderDetailPageProps) {
  const shared = isSharedFolder(folder)
  const isOwner = folder.owner_id === currentUserId
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [recipientAnchor, setRecipientAnchor] = useState<DOMRect | null>(null)

  const { finalCounts: folderStatusTotals, memberCounts } = calculateFolderProgress(tasks, contributionsByTask)

  const userProgress = folderMemberUserIds.map((userId) => {
    const totals = memberCounts.get(userId) ?? { completed: 0, half_done: 0, ongoing: 0 }
    return { userId, totals }
  })

  const progressPercent = tasks.length > 0
    ? Math.round((folderStatusTotals.completed / tasks.length) * 100)
    : 0

  return (
    <div className="stitch-page folder-detail-page growt-page">
      <div className={`folder-detail-hero folder-detail-hero--${folder.category}`}>
        <div className="folder-detail-hero__accent" />

        <div className="folder-detail-hero__body">
          <div className="folder-detail-toolbar">
            <button className="folder-detail-back" onClick={onBack} type="button">
              <ArrowLeft size={15} />
              Workspaces
            </button>

            <div className="folder-detail-actions">
              {recipientReport ? (
                <button
                  aria-label="View recipients"
                  className="folder-detail-action"
                  onClick={(event) => setRecipientAnchor(event.currentTarget.getBoundingClientRect())}
                  title="Recipients"
                  type="button"
                >
                  <ReceiptText size={15} />
                </button>
              ) : null}

              {isOwner ? (
                <>
                  <button
                    aria-label="Copy folder share link"
                    className="folder-detail-action"
                    disabled={isSaving}
                    onClick={() => onCopyShareLink('folder', folder.id)}
                    title="Share"
                    type="button"
                  >
                    <Link size={15} />
                  </button>
                  <button
                    aria-label="Edit folder"
                    className="folder-detail-action"
                    id="edit-folder-btn"
                    onClick={onEditFolder}
                    title="Edit"
                    type="button"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    aria-label="Delete folder"
                    className="folder-detail-action folder-detail-action--danger"
                    disabled={isSaving}
                    id="delete-folder-btn"
                    onClick={() => onDeleteFolder(folder)}
                    title="Delete"
                    type="button"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="folder-detail-summary">
            <div className="folder-detail-title-row">
              <span
                aria-label={`${getCategoryLabel(folder.category)} folder`}
                className={`folder-detail-category-dot folder-detail-category-dot--${folder.category}`}
                role="img"
                title={getCategoryLabel(folder.category)}
              />
              <h1>{folder.title}</h1>
            </div>

            {folder.description ? (
              <div className="folder-detail-description">
                <LinkifiedText text={folder.description} />
              </div>
            ) : null}

            <div className="folder-detail-meta">
              <span><CheckCircle size={13} /> {tasks.length}</span>
              <span>{shared ? <Users size={13} /> : <LockKeyhole size={13} />} {shared ? 'Shared' : 'Private'}</span>
              {folder.contains_export_videos ? <span><Video size={13} /> Export</span> : null}
              {!folder.is_active ? <span>Inactive</span> : null}
            </div>
          </div>

          {recipientReport && recipientAnchor && (
            <RecipientReportPopup
              anchorRect={recipientAnchor}
              getProfileAvatar={getProfileAvatar}
              getProfileLabel={getProfileLabel}
              isOpen={recipientAnchor !== null}
              onClose={() => setRecipientAnchor(null)}
              report={recipientReport}
              subtitle={`${folder.title} · ${recipientReport.taskCount} ${recipientReport.taskCount === 1 ? 'task' : 'tasks'}`}
              title="Folder recipients"
            />
          )}

          <div className="folder-progress">
            <div className="folder-progress__header">
              <span>Progress</span>
              <button onClick={() => setShowBreakdown(true)} title="View member breakdown" type="button">
                <Info size={14} />
              </button>
              <strong>{progressPercent}%</strong>
            </div>

            <span className="folder-progress__bar" aria-label={`${progressPercent}% completed`}>
              <span style={{ width: `${progressPercent}%` }} />
            </span>

            <div className="folder-progress__stats">
              {statusCards.map(({ Icon, key, label }) => (
                <div className={`folder-progress__stat folder-progress__stat--${key}`} key={key} title={label}>
                  <Icon aria-hidden="true" size={15} />
                  <strong>{folderStatusTotals[key]}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showBreakdown && (
        <div
          className="member-progress-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowBreakdown(false)}
        >
          <div
            className="member-progress-dialog relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xl dark:border-white/10 dark:bg-[#171126]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setShowBreakdown(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
              type="button"
            >
              <X size={20} />
            </button>

            <h3 className="mb-6 flex items-center gap-2 text-lg font-black text-slate-950 dark:text-slate-50">
              <BarChart2 size={20} className="text-primary" />
              Member Progress
            </h3>

            <div className="member-progress-list flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-2">
              {userProgress.map(({ userId, totals }) => {
                const total = totals.completed + totals.half_done + totals.ongoing

                return (
                  <div
                    key={userId}
                    className="member-progress-card rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.045]"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <UserAvatar
                        label={getProfileLabel(userId)}
                        avatarUrl={getProfileAvatar(userId)}
                        className="h-8 w-8 text-xs"
                      />

                      <span className="flex-1 font-bold text-slate-950 dark:text-slate-50">
                        {getProfileLabel(userId)}
                      </span>

                      <span className="text-sm font-bold text-slate-500 dark:text-slate-300">
                        {total > 0 ? `${Math.round((totals.completed / total) * 100)}%` : '0%'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border-b-2 border-blue-500 bg-white p-2 text-center dark:bg-white/10">
                        <div className="text-xl font-black text-slate-950 dark:text-slate-50">
                          {totals.ongoing}
                        </div>
                        <div className="mt-1 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-300">
                          Ongoing
                        </div>
                      </div>

                      <div className="rounded-lg border-b-2 border-amber-500 bg-white p-2 text-center dark:bg-white/10">
                        <div className="text-xl font-black text-slate-950 dark:text-slate-50">
                          {totals.half_done}
                        </div>
                        <div className="mt-1 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-300">
                          Half
                        </div>
                      </div>

                      <div className="rounded-lg border-b-2 border-emerald-500 bg-white p-2 text-center dark:bg-white/10">
                        <div className="text-xl font-black text-slate-950 dark:text-slate-50">
                          {totals.completed}
                        </div>
                        <div className="mt-1 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-300">
                          Done
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {userProgress.length === 0 && (
                <p className="py-4 text-center text-sm font-medium text-slate-500 dark:text-slate-300">
                  No active members.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="stitch-board">
        <div className="stitch-board__main">
          <div className="stitch-panel">
            <div className="stitch-panel__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} className="stitch-panel__icon" />
                <h3 className="stitch-panel__title">Tasks</h3>
                <span className="stitch-count-badge">{tasks.length}</span>
              </div>
            </div>

            <div className="stitch-panel__body">
              <TaskForm
                canEditRecipientAmount={isOwner}
                defaultCategory={folder.category as FolderCategory}
                defaultRecipientAmount={folder.recipient_task_amount ?? 0}
                forceExportButton={folder.contains_export_videos}
                isSaving={isSaving}
                onCreate={onCreateFolderTask}
              />

              <div className="folder-task-list">
                <TaskList
                  assignableMembers={assignableMembers}
                  contributionsByTask={contributionsByTask}
                  currentUserId={currentUserId}
                  editingTaskId={editingTaskId}
                  emptyMessage={normalizedSearchQuery ? 'No tasks match this search.' : 'Add your first task above.'}
                  folderOwnerId={folder.owner_id}
                  forceExportButton={folder.contains_export_videos}
                  getProfileAvatar={getProfileAvatar}
                  getProfileLabel={getProfileLabel}
                  isSaving={isSaving}
                  onCloseEdit={onCloseTaskEdit}
                  onDeleteTask={onDeleteTask}
                  onEditTask={onEditTask}
                  onMoveTask={onMoveTask}
                  onSetTaskExported={onSetTaskExported}
                  onSetTaskStatus={onSetTaskStatus}
                  onToggleTaskLevel={onToggleTaskLevel}
                  onUndoAction={onUndoAction}
                  onUpdateTask={onUpdateTask}
                  pendingAction={pendingAction}
                  recipientReportsByTask={recipientReportsByTask}
                  statusHistoryByTask={statusHistoryByTask}
                  taskLevelCompletedIdsByTask={taskLevelCompletedIdsByTask}
                  taskLevelsByTask={taskLevelsByTask}
                  tasks={tasks}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="stitch-board__side">
          {shared && (
            <div className="stitch-panel relative z-20">
              <div className="stitch-panel__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} className="stitch-panel__icon" />
                  <h3 className="stitch-panel__title">Collaborators</h3>
                  <span className="stitch-count-badge">{folderMemberUserIds.length}</span>
                </div>
              </div>

              <div className="stitch-panel__body">
                <div className="stitch-member-list">
                  {folderMemberUserIds.map((memberId) => {
                    const counts = memberCounts.get(memberId) ?? { completed: 0, half_done: 0, ongoing: 0 }

                    return (
                      <div className="stitch-member-row" key={memberId}>
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            label={getProfileLabel(memberId)}
                            avatarUrl={getProfileAvatar(memberId)}
                            className="h-6 w-6 text-[10px]"
                          />
                          <span className="stitch-member-name">{getProfileLabel(memberId)}</span>
                        </div>

                        <div className="stitch-member-stats">
                          <span title="Ongoing">
                            <div className="stitch-dot stitch-dot--ongoing" />
                            {counts.ongoing}
                          </span>
                          <span title="Half Done">
                            <div className="stitch-dot stitch-dot--half_done" />
                            {counts.half_done}
                          </span>
                          <span title="Completed">
                            <div className="stitch-dot stitch-dot--completed" />
                            {counts.completed}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                  {!folderMemberUserIds.length && (
                    <span className="stitch-empty-text">Owner only</span>
                  )}
                </div>

                {canInviteMembers && (
                  <form className="stitch-invite-form" onSubmit={onInviteMember}>
                    <UserSearchDropdown
                      className="stitch-input"
                      value={memberUsername}
                      onChange={onMemberUsernameChange}
                      placeholder="Invite by username"
                    />
                    <button className="btn btn--primary btn--sm" disabled={isSaving} type="submit">
                      Invite
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          <div className="stitch-panel">
            <div className="stitch-panel__header">
              <h3 className="stitch-panel__title">Workspace Details</h3>
            </div>

            <div className="stitch-panel__body" style={{ padding: '0' }}>
              <div className="stitch-detail-list">
                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Category</span>
                  <strong className="stitch-detail-value">{getCategoryLabel(folder.category)}</strong>
                </div>

                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Access</span>
                  <strong className="stitch-detail-value">{shared ? 'Shared' : 'Private'}</strong>
                </div>

                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Status</span>
                  <strong className="stitch-detail-value">{folder.is_active ? 'Active' : 'Inactive'}</strong>
                </div>

                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Exports</span>
                  <strong className="stitch-detail-value">{folder.contains_export_videos ? 'Videos' : 'Optional'}</strong>
                </div>

                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Recipient Task Amount</span>
                  <strong className="stitch-detail-value">{formatCurrency(folder.recipient_task_amount ?? 0)}</strong>
                </div>

                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Due Date</span>
                  <strong className="stitch-detail-value">
                    {folder.due_date ? formatDateTime(folder.due_date) : 'None'}
                  </strong>
                </div>

                <div className="stitch-detail-item">
                  <span className="stitch-detail-label">Created</span>
                  <strong className="stitch-detail-value">{formatDateTime(folder.created_at)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
