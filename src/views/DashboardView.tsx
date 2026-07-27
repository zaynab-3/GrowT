import { useMemo } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  FolderOpen,
} 
from 'lucide-react'
import { UserAvatar } from '../components/UserAvatar'
import type { TaskProgressStatus } from '../lib/database.types'
import { getCategoryLabel } from '../lib/growtDisplay'
import type { Folder, Task, TaskMember, TaskStatusAction } from '../lib/growtData'
import { calculateFolderProgress } from '../lib/growtState'
import type { AppView } from './viewTypes'
import './DashboardView.css'

type StatusContribution = { action: TaskStatusAction; userId: string }
type TaskStatus = TaskProgressStatus | 'not_started'

type DashboardViewProps = {
  contributionsByTask: Map<string, Record<TaskProgressStatus, StatusContribution[]>>
  folders: Folder[]
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  onNavigate: (view: AppView) => void
  onOpenFolder: (folderId: string) => void
  onOpenTask: (task: Task) => void
  profileDisplayName: string
  profileUsername: string
  standaloneTasks: Task[]
  statusTotals: {
    completed: number
    half_done: number
    ongoing: number
  }
  taskMembersByTask: Map<string, TaskMember[]>
  tasks: Task[]
}

const statusCopy: Record<TaskStatus, string> = {
  completed: 'Completed',
  half_done: 'Needs review',
  not_started: 'Upcoming',
  ongoing: 'In progress',
}

function getTaskStatus(
  task: Task,
  contributionsByTask: DashboardViewProps['contributionsByTask'],
): TaskStatus {
  if (!task.is_active) return 'completed'

  const contributions = contributionsByTask.get(task.id)
  if (contributions?.completed.length) return 'completed'
  if (contributions?.half_done.length) return 'half_done'
  if (contributions?.ongoing.length) return 'ongoing'
  return 'not_started'
}

function isSameLocalDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
}

function formatTaskTime(task: Task, now: Date) {
  if (!task.due_date) return 'No due date'

  const dueDate = new Date(task.due_date)
  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(dueDate)

  if (isSameLocalDay(dueDate, now)) return `Today, ${time}`

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  if (isSameLocalDay(dueDate, tomorrow)) return `Tomorrow, ${time}`

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(dueDate)
}

function getParticipantIds(
  task: Task,
  taskMembersByTask: DashboardViewProps['taskMembersByTask'],
  contributionsByTask: DashboardViewProps['contributionsByTask'],
) {
  const ids = new Set<string>()
  ids.add(task.owner_id)
  if (task.assigned_user_id) ids.add(task.assigned_user_id)

  for (const member of taskMembersByTask.get(task.id) ?? []) ids.add(member.user_id)

  const contributions = contributionsByTask.get(task.id)
  if (contributions) {
    for (const status of ['ongoing', 'half_done', 'completed'] as const) {
      for (const contribution of contributions[status]) ids.add(contribution.userId)
    }
  }

  return [...ids]
}

function AvatarStack({
  getProfileAvatar,
  getProfileLabel,
  userIds,
}: {
  getProfileAvatar: DashboardViewProps['getProfileAvatar']
  getProfileLabel: DashboardViewProps['getProfileLabel']
  userIds: string[]
}) {
  const visibleIds = userIds.slice(0, 3)
  const remainingCount = Math.max(userIds.length - visibleIds.length, 0)

  if (!visibleIds.length) return null

  return (
    <span className="dashboard-avatar-stack" aria-label={`${userIds.length} collaborators`}>
      {visibleIds.map((userId) => (
        <UserAvatar
          avatarUrl={getProfileAvatar(userId)}
          className="dashboard-avatar-stack__avatar"
          key={userId}
          label={getProfileLabel(userId)}
        />
      ))}
      {remainingCount > 0 ? (
        <span className="dashboard-avatar-stack__more">+{remainingCount}</span>
      ) : null}
    </span>
  )
}

export function DashboardView({
  contributionsByTask,
  folders,
  getProfileAvatar,
  getProfileLabel,
  onNavigate,
  onOpenFolder,
  onOpenTask,
  profileDisplayName,
  profileUsername,
  standaloneTasks,
  statusTotals,
  taskMembersByTask,
  tasks,
}: DashboardViewProps) {
  const now = useMemo(() => new Date(), [])
  const firstName = (profileDisplayName || profileUsername || 'there').trim().split(/\s+/)[0]
  const folderById = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders])

  const dashboardTasks = useMemo(() => {
    return [...standaloneTasks, ...tasks]
      .filter((task) => !task.deleted_at)
      .map((task) => ({
        task,
        status: getTaskStatus(task, contributionsByTask),
      }))
      .filter(({ task, status }) => task.is_active && status !== 'completed')
      .sort((first, second) => {
        const firstDue = first.task.due_date ? Date.parse(first.task.due_date) : Number.POSITIVE_INFINITY
        const secondDue = second.task.due_date ? Date.parse(second.task.due_date) : Number.POSITIVE_INFINITY
        if (firstDue !== secondDue) return firstDue - secondDue

        const firstStandalone = first.task.folder_id ? 1 : 0
        const secondStandalone = second.task.folder_id ? 1 : 0
        if (firstStandalone !== secondStandalone) return firstStandalone - secondStandalone

        return Date.parse(second.task.updated_at) - Date.parse(first.task.updated_at)
      })
  }, [contributionsByTask, standaloneTasks, tasks])

  const attentionCount = dashboardTasks.filter(({ task, status }) => {
    if (status === 'half_done') return true
    if (!task.due_date) return false
    return Date.parse(task.due_date) < now.getTime()
  }).length

  const upNext = dashboardTasks[0]
  const laterToday = dashboardTasks.slice(1, 3)
  const totalProgress = statusTotals.ongoing + statusTotals.half_done + statusTotals.completed

  const workspaceRows = useMemo(() => {
    return [...folders]
      .filter((folder) => !folder.deleted_at)
      .sort((first, second) => Date.parse(second.updated_at) - Date.parse(first.updated_at))
      .slice(0, 2)
      .map((folder) => {
        const folderTasks = tasks.filter((task) => task.folder_id === folder.id && !task.deleted_at)
        const { finalCounts } = calculateFolderProgress(folderTasks, contributionsByTask)
        const progress = folderTasks.length
          ? Math.round((finalCounts.completed / folderTasks.length) * 100)
          : 0
        const userIds = new Set<string>([folder.owner_id])

        for (const task of folderTasks) {
          for (const userId of getParticipantIds(task, taskMembersByTask, contributionsByTask)) {
            userIds.add(userId)
          }
        }

        return {
          folder,
          progress,
          taskCount: folderTasks.length,
          userIds: [...userIds],
        }
      })
  }, [contributionsByTask, folders, taskMembersByTask, tasks])

  return (
    <section className="dashboard-screen" aria-labelledby="dashboard-greeting">
      <header className="dashboard-greeting-hero">
        <div className="dashboard-greeting-hero__body">

          <h1 id="dashboard-greeting" className="dashboard-greeting-hero__title">
            Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}, <span className="dashboard-greeting-hero__name">{firstName}</span>
          </h1>
        </div>
      </header>

      <section className="dashboard-section dashboard-progress-first" aria-labelledby="task-progress-heading">
        <div className="dashboard-section__heading dashboard-section__heading--inline">
          <h2 id="task-progress-heading">My tasks progress</h2>
          <button onClick={() => onNavigate('tasks')} type="button">View all</button>
        </div>
        <div className="dashboard-progress-summary">
          {([
            ['ongoing', statusTotals.ongoing],
            ['half_done', statusTotals.half_done],
            ['completed', statusTotals.completed],
          ] as const).map(([status, count]) => (
            <div className={`dashboard-progress-summary__item dashboard-progress-summary__item--${status}`} key={status}>
              <strong>{count}</strong>
              <span>{status === 'half_done' ? 'Half done' : status === 'ongoing' ? 'Ongoing' : 'Completed'}</span>
              <span className="dashboard-progress-summary__track" aria-hidden="true">
                <span style={{ width: `${totalProgress ? Math.max((count / totalProgress) * 100, count ? 12 : 0) : 0}%` }} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="dashboard-home-grid">
        <div className="dashboard-home-grid__focus">
          <section className="dashboard-section" aria-labelledby="up-next-heading">
            <div className="dashboard-section__heading">
              <div>
                <p className="dashboard-section__kicker">Focus</p>
                <h2 id="up-next-heading">Up next</h2>
              </div>
            </div>

            {upNext ? (
              <article className="dashboard-next-task">
                <span className="dashboard-next-task__icon"><FileText size={22} /></span>
                <div className="dashboard-next-task__content">
                  <span className={`dashboard-status dashboard-status--${upNext.status}`}>
                    {statusCopy[upNext.status]}
                  </span>
                  <h3>{upNext.task.title}</h3>
                  <div className="dashboard-next-task__meta">
                    <span>
                      <FolderOpen size={16} />
                      {upNext.task.folder_id
                        ? folderById.get(upNext.task.folder_id)?.title ?? 'Workspace'
                        : getCategoryLabel(upNext.task.category)}
                    </span>
                    <span><Clock3 size={16} />{formatTaskTime(upNext.task, now)}</span>
                  </div>
                  <div className="dashboard-next-task__footer">
                    <AvatarStack
                      getProfileAvatar={getProfileAvatar}
                      getProfileLabel={getProfileLabel}
                      userIds={getParticipantIds(upNext.task, taskMembersByTask, contributionsByTask)}
                    />
                    <button className="dashboard-primary-action" onClick={() => onOpenTask(upNext.task)} type="button">
                      <span>Continue</span>
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ) : (
              <div className="dashboard-empty-focus">
                <CheckCircle2 size={28} />
                <div>
                  <h3>You’re all caught up</h3>
                  <p>Create a task when you’re ready for the next thing.</p>
                </div>
                <button onClick={() => onNavigate('tasks')} type="button">Open my tasks</button>
              </div>
            )}
          </section>

          {laterToday.length ? (
            <section className="dashboard-section dashboard-later" aria-labelledby="later-today-heading">
              <div className="dashboard-section__heading">
                <h2 id="later-today-heading">Later today</h2>
              </div>
              <div className="dashboard-timeline">
                {laterToday.map(({ task, status }) => (
                  <button className={`dashboard-timeline__row dashboard-timeline__row--${status}`} key={task.id} onClick={() => onOpenTask(task)} type="button">
                    <span className="dashboard-timeline__marker" aria-hidden="true" />
                    <span className="dashboard-timeline__time">{formatTaskTime(task, now)}</span>
                    <span className="dashboard-timeline__copy">
                      <strong>{task.title}</strong>
                      <small>
                        <FolderOpen size={14} />
                        {task.folder_id ? folderById.get(task.folder_id)?.title ?? 'Workspace' : getCategoryLabel(task.category)}
                      </small>
                    </span>
                    <span className={`dashboard-status dashboard-status--${status}`}>{statusCopy[status]}</span>
                    <AvatarStack
                      getProfileAvatar={getProfileAvatar}
                      getProfileLabel={getProfileLabel}
                      userIds={getParticipantIds(task, taskMembersByTask, contributionsByTask)}
                    />
                    <ChevronRight className="dashboard-timeline__chevron" size={18} />
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="dashboard-home-grid__support">
          <section className="dashboard-section" aria-labelledby="workspaces-heading">
            <div className="dashboard-section__heading dashboard-section__heading--inline">
              <h2 id="workspaces-heading">Your workspaces</h2>
              <button onClick={() => onNavigate('folders')} type="button">View all</button>
            </div>

            {workspaceRows.length ? (
              <div className="dashboard-workspaces">
                {workspaceRows.map(({ folder, progress, taskCount, userIds }) => (
                  <button className="dashboard-workspace-row" key={folder.id} onClick={() => onOpenFolder(folder.id)} type="button">
                    <span className="dashboard-workspace-row__icon"><FolderOpen size={20} /></span>
                    <span className="dashboard-workspace-row__copy">
                      <span className="dashboard-workspace-row__title">
                        <strong>{folder.title}</strong>
                        <em>{progress === 100 ? 'Complete' : progress >= 50 ? 'On track' : 'In progress'}</em>
                      </span>
                      <small>{progress}% complete <span aria-hidden="true">·</span> {taskCount} {taskCount === 1 ? 'task' : 'tasks'}</small>
                    </span>
                    <AvatarStack getProfileAvatar={getProfileAvatar} getProfileLabel={getProfileLabel} userIds={userIds} />
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            ) : (
              <button className="dashboard-workspaces-empty" onClick={() => onNavigate('folders')} type="button">
                <FolderOpen size={22} />
                <span><strong>No workspaces yet</strong><small>Create your first workspace to organize related tasks.</small></span>
                <ArrowRight size={18} />
              </button>
            )}
          </section>

          {attentionCount > 0 ? (
            <button className="dashboard-attention-note" onClick={() => onNavigate('tasks')} type="button">
              <AlertCircle size={18} />
              <span><strong>{attentionCount} {attentionCount === 1 ? 'task needs' : 'tasks need'} attention</strong><small>Review due dates and current progress.</small></span>
              <ChevronRight size={18} />
            </button>
          ) : null}
        </aside>
      </div>
    </section>
  )
}
