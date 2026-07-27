import { type FormEvent, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  BadgeCheck,
  BarChart2,
  CheckCircle,
  CircleCheckBig,
  CircleDot,
  CircleGauge,
  DollarSign,
  Edit2,
  Info,
  Link,
  LockKeyhole,
  ReceiptText,
  Trash2,
  UserMinus,
  UserRoundPlus,
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
type MobileOverviewTab = 'collaborators' | 'details'

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
  onRemoveMember: (userId: string) => void
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
  onRemoveMember,
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
  const [mobileOverviewTab, setMobileOverviewTab] = useState<MobileOverviewTab>('collaborators')
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  useEffect(() => {
    if (!showInviteDialog) return undefined

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowInviteDialog(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showInviteDialog])

  const { finalCounts: folderStatusTotals, memberCounts } = calculateFolderProgress(tasks, contributionsByTask)
  const recipientSummariesByUser = new Map(
    (recipientReport?.users ?? []).map((summary) => [summary.userId, summary]),
  )
  const collaboratorRows = folderMemberUserIds.map((memberId) => {
    const counts = memberCounts.get(memberId) ?? { completed: 0, half_done: 0, ongoing: 0 }
    const recipientSummary = recipientSummariesByUser.get(memberId)

    return {
      memberId,
      counts: {
        completed: recipientSummary?.fullyCompleted ?? counts.completed,
        completedOtherHalf: recipientSummary?.completedOtherHalf ?? 0,
        halfDone: recipientSummary?.halfDone ?? counts.half_done,
        ongoing: recipientSummary?.ongoing ?? counts.ongoing,
      },
    }
  })

  const userProgress = folderMemberUserIds.map((userId) => {
    const totals = memberCounts.get(userId) ?? { completed: 0, half_done: 0, ongoing: 0 }
    const recipientSummary = recipientSummariesByUser.get(userId)

    return {
      userId,
      totals: {
        completed: recipientSummary?.fullyCompleted ?? totals.completed,
        completedOtherHalf: recipientSummary?.completedOtherHalf ?? 0,
        half_done: recipientSummary?.halfDone ?? totals.half_done,
        ongoing: recipientSummary?.ongoing ?? totals.ongoing,
      },
    }
  })

  const progressPercent = tasks.length > 0
    ? Math.round((folderStatusTotals.completed / tasks.length) * 100)
    : 0

  return (
    <>
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
                const total =
                  totals.completed +
                  totals.completedOtherHalf +
                  totals.half_done +
                  totals.ongoing
                const completedTotal = totals.completed + totals.completedOtherHalf

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
                        {total > 0 ? `${Math.round((completedTotal / total) * 100)}%` : '0%'}
                      </span>
                    </div>

                    <div className="member-progress-card__stats grid grid-cols-4 gap-2">
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

                      <div className="rounded-lg border-b-2 border-violet-500 bg-white p-2 text-center dark:bg-white/10">
                        <div className="text-xl font-black text-slate-950 dark:text-slate-50">
                          {totals.completedOtherHalf}
                        </div>
                        <div className="mt-1 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-300">
                          Other
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
          {/* 1st Independent Card: Folder Overview */}
          <div className="folder-side-card folder-side-card--overview">
            <header className="folder-mobile-overview__header">
              <span className="folder-mobile-overview__icon">
                <UserRoundPlus aria-hidden="true" size={23} />
              </span>
              <span className="folder-mobile-overview__heading">
                <strong>Folder overview</strong>
                <small>{folder.title} · {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</small>
              </span>
              {canInviteMembers ? (
                <button
                  aria-label="Invite a collaborator"
                  className="folder-mobile-overview__invite-shortcut folder-mobile-overview__invite-shortcut--icon"
                  onClick={() => setShowInviteDialog(true)}
                  title="Invite a collaborator"
                  type="button"
                >
                  <UserRoundPlus aria-hidden="true" size={20} />
                </button>
              ) : null}
            </header>

            <div className="folder-mobile-overview__summary" aria-label="Workspace summary">
              <span>
                {shared ? <Users aria-hidden="true" size={22} /> : <LockKeyhole aria-hidden="true" size={22} />}
                <strong>{shared ? 'Shared' : 'Private'}</strong>
              </span>
              <span>
                <BarChart2 aria-hidden="true" size={22} />
                <strong>{folder.is_active ? 'Active' : 'Inactive'}</strong>
              </span>
              <span>
                <Video aria-hidden="true" size={22} />
                <strong>{folder.contains_export_videos ? 'Videos' : 'Optional'}</strong>
              </span>
              <span>
                <DollarSign aria-hidden="true" size={22} />
                <strong>{formatCurrency(folder.recipient_task_amount ?? 0)}</strong>
              </span>
            </div>
          </div>

          {/* 2nd Independent Card: Collaborators and Workspace Details */}
          <div className="folder-side-card folder-side-card--collaborators">
            <div className="folder-mobile-overview__tabs" role="tablist" aria-label="Folder overview sections">
              <button
                aria-controls="folder-mobile-collaborators"
                aria-selected={mobileOverviewTab === 'collaborators'}
                className={mobileOverviewTab === 'collaborators' ? 'is-active' : ''}
                onClick={() => setMobileOverviewTab('collaborators')}
                role="tab"
                type="button"
              >
                Collaborators
                <span>{folderMemberUserIds.length}</span>
              </button>
              <button
                aria-controls="folder-mobile-details"
                aria-selected={mobileOverviewTab === 'details'}
                className={mobileOverviewTab === 'details' ? 'is-active' : ''}
                onClick={() => setMobileOverviewTab('details')}
                role="tab"
                type="button"
              >
                Workspace details
              </button>
            </div>

            <div className="folder-mobile-overview__content">
              {mobileOverviewTab === 'collaborators' ? (
                <div
                  className="folder-mobile-overview__panel folder-mobile-overview__panel--collaborators"
                  id="folder-mobile-collaborators"
                  role="tabpanel"
                >
                  {collaboratorRows.length ? (
                    <div className="folder-mobile-collaborators">
                      <div className="folder-mobile-collaborators__labels" aria-hidden="true">
                        <span>Person</span>
                        <span>Ongoing</span>
                        <span>Half done</span>
                        <span>Completed</span>
                        <span>Other</span>
                      </div>

                      {collaboratorRows.map(({ memberId, counts }) => (
                        <div className="folder-mobile-collaborators__row" key={memberId}>
                          <div className="folder-mobile-collaborators__person">
                            <span className="folder-mobile-collaborators__avatar-wrap">
                              <UserAvatar
                                label={getProfileLabel(memberId)}
                                avatarUrl={getProfileAvatar(memberId)}
                                className="folder-mobile-collaborators__avatar"
                              />
                              {isOwner && memberId !== folder.owner_id ? (
                                <button
                                  aria-label={`Remove ${getProfileLabel(memberId)} from this folder`}
                                  className="folder-mobile-collaborators__remove"
                                  disabled={isSaving}
                                  onClick={() => onRemoveMember(memberId)}
                                  title={`Remove ${getProfileLabel(memberId)}`}
                                  type="button"
                                >
                                  <UserMinus aria-hidden="true" size={11} />
                                </button>
                              ) : null}
                            </span>
                            <strong>{getProfileLabel(memberId)}</strong>
                          </div>
                          <span className="is-ongoing" title="Ongoing">
                            <CircleDot aria-hidden="true" size={14} />
                            <strong>{counts.ongoing}</strong>
                          </span>
                          <span className="is-half" title="Half done">
                            <CircleGauge aria-hidden="true" size={14} />
                            <strong>{counts.halfDone}</strong>
                          </span>
                          <span className="is-completed" title="Completed">
                            <CircleCheckBig aria-hidden="true" size={14} />
                            <strong>{counts.completed}</strong>
                          </span>
                          <span className="is-other" title="Completed other half">
                            <BadgeCheck aria-hidden="true" size={14} />
                            <strong>{counts.completedOtherHalf}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="folder-mobile-overview__empty">
                      <UserRoundPlus aria-hidden="true" size={22} />
                      <span>Owner only</span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="folder-mobile-overview__panel"
                  id="folder-mobile-details"
                  role="tabpanel"
                >
                  <div className="folder-mobile-details">
                    <div><span>Category</span><strong>{getCategoryLabel(folder.category)}</strong></div>
                    <div><span>Access</span><strong>{shared ? 'Shared' : 'Private'}</strong></div>
                    <div><span>Status</span><strong>{folder.is_active ? 'Active' : 'Inactive'}</strong></div>
                    <div><span>Exports</span><strong>{folder.contains_export_videos ? 'Videos' : 'Optional'}</strong></div>
                    <div><span>Recipient amount</span><strong>{formatCurrency(folder.recipient_task_amount ?? 0)}</strong></div>
                    <div><span>Due date</span><strong>{folder.due_date ? formatDateTime(folder.due_date) : 'None'}</strong></div>
                    <div><span>Created</span><strong>{formatDateTime(folder.created_at)}</strong></div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
    {showInviteDialog && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="folder-invite-dialog-layer"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowInviteDialog(false)
            }}
            role="presentation"
          >
            <section
              aria-labelledby="folder-invite-dialog-title"
              aria-modal="true"
              className="folder-invite-dialog"
              role="dialog"
            >
              <span aria-hidden="true" className="folder-invite-dialog__handle" />
              <header className="folder-invite-dialog__header">
                <span className="folder-invite-dialog__icon">
                  <UserRoundPlus aria-hidden="true" size={22} />
                </span>
                <span>
                  <strong id="folder-invite-dialog-title">Invite collaborator</strong>
                  <small>{folder.title}</small>
                </span>
                <button
                  aria-label="Close invite dialog"
                  className="folder-invite-dialog__close"
                  onClick={() => setShowInviteDialog(false)}
                  type="button"
                >
                  <X aria-hidden="true" size={20} />
                </button>
              </header>

              <form className="folder-invite-dialog__form" onSubmit={onInviteMember}>
                <div className="folder-invite-dialog__field">
                  <span>Find by username</span>
                  <UserSearchDropdown
                    className="stitch-input"
                    disabled={isSaving}
                    excludeUserIds={folderMemberUserIds}
                    groupByRelationship
                    onChange={onMemberUsernameChange}
                    placeholder="Start typing a username"
                    value={memberUsername}
                  />
                  <small>
                    Choose an acquainted user or a suggestion. Suggestions receive an
                    acquaintance request automatically.
                  </small>
                </div>
                <div className="folder-invite-dialog__actions">
                  <button
                    className="btn btn--secondary"
                    disabled={isSaving}
                    onClick={() => setShowInviteDialog(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn--primary"
                    disabled={isSaving || !memberUsername.trim()}
                    type="submit"
                  >
                    <UserRoundPlus aria-hidden="true" size={17} />
                    {isSaving ? 'Inviting…' : 'Invite user'}
                  </button>
                </div>
              </form>
            </section>
          </div>,
          document.body,
        )
      : null}
    </>
  )
}
