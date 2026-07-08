import type { FormEvent } from 'react'
import type { FolderCategory, ReorderDirection, TaskProgressStatus } from '../../lib/database.types'
import { statusColumns, formatDateTime } from '../../lib/growtDisplay'
import type { Folder, Task, TaskLevel, TaskStatusAction } from '../../lib/growtData'
import { TaskForm, type TaskCreateValues } from '../tasks/TaskForm'
import { TaskList } from '../tasks/TaskList'
import type { TaskEditValues } from '../tasks/TaskEditForm'
import { FolderEditForm, type FolderEditValues } from './FolderEditForm'
import { Users, Clock, Edit2, Trash2, Plus, Filter, FolderOpen } from 'lucide-react'
import { UserAvatar } from '../../components/UserAvatar'

type ContributionCounts = Record<TaskProgressStatus, number>

type StatusContribution = {
  action: TaskStatusAction
  userId: string
}

type AssignableMember = {
  id: string
  label: string
}

type FolderDetailProps = {
  activeFolder: Folder | null
  assignableMembers: AssignableMember[]
  canInviteMembers: boolean
  contributionsByTask: Map<string, Record<TaskProgressStatus, StatusContribution[]>>
  currentUserId: string
  editingTaskId: string | null
  folderCount: number
  folderMemberUserIds: string[]
  getProfileAvatar: (userId: string | undefined | null) => string | null
  getProfileLabel: (userId: string) => string
  isEditingFolder: boolean
  isSaving: boolean
  isSharedFolder: boolean
  memberUsername: string
  normalizedSearchQuery: string
  onCancelFolderEdit: () => void
  onCloseTaskEdit: () => void
  onCreateFolderTask: (values: TaskCreateValues) => void
  onDeleteFolder: (folder: Folder) => void
  onDeleteTask: (task: Task) => void
  onEditTask: (taskId: string) => void
  onInviteMember: (event: FormEvent<HTMLFormElement>) => void
  onMemberUsernameChange: (username: string) => void
  onMoveTask: (task: Task, direction: ReorderDirection, scopedTaskIds?: string[]) => void
  onSetTaskExported: (taskId: string, isExported?: boolean) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onToggleTaskLevel?: (taskId: string, taskLevelId: string, checked: boolean) => void
  onToggleFolderEdit: () => void
  onUndoAction: (action: TaskStatusAction) => void
  onUpdateFolder: (values: FolderEditValues) => void
  onUpdateTask: (taskId: string, values: TaskEditValues) => void
  pendingAction: string | null
  showTasks?: boolean
  taskLevelCompletedIdsByTask?: Map<string, Set<string>>
  taskLevelsByTask?: Map<string, TaskLevel[]>
  tasks: Task[]
}

const EMPTY_TASK_LEVELS_BY_TASK = new Map<string, TaskLevel[]>()
const EMPTY_COMPLETED_LEVEL_IDS_BY_TASK = new Map<string, Set<string>>()

export function FolderDetail({
  activeFolder,
  assignableMembers,
  canInviteMembers,
  contributionsByTask,
  currentUserId,
  editingTaskId,
  folderCount,
  folderMemberUserIds,
  getProfileAvatar,
  getProfileLabel,
  isEditingFolder,
  isSaving,
  isSharedFolder: isShared,
  memberUsername,
  normalizedSearchQuery,
  onCancelFolderEdit,
  onCloseTaskEdit,
  onCreateFolderTask,
  onDeleteFolder,
  onDeleteTask,
  onEditTask,
  onInviteMember,
  onMemberUsernameChange,
  onMoveTask,
  onSetTaskExported,
  onSetTaskStatus,
  onToggleTaskLevel = () => undefined,
  onToggleFolderEdit,
  onUndoAction,
  onUpdateFolder,
  onUpdateTask,
  pendingAction,
  showTasks = true,
  taskLevelCompletedIdsByTask = EMPTY_COMPLETED_LEVEL_IDS_BY_TASK,
  taskLevelsByTask = EMPTY_TASK_LEVELS_BY_TASK,
  tasks,
}: FolderDetailProps) {
  const folderStatusTotals = tasks.reduce<ContributionCounts>(
    (totals, task) => {
      const taskContributions = contributionsByTask.get(task.id)
      return {
        completed: totals.completed + (taskContributions?.completed.length ?? 0),
        half_done: totals.half_done + (taskContributions?.half_done.length ?? 0),
        ongoing: totals.ongoing + (taskContributions?.ongoing.length ?? 0),
      }
    },
    { completed: 0, half_done: 0, ongoing: 0 }
  )

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 w-full">
      {activeFolder ? (
        <>
          {isEditingFolder && (
            <div className="mb-4">
              <FolderEditForm
                folder={activeFolder}
                isSaving={isSaving}
                onCancel={onCancelFolderEdit}
                onSave={onUpdateFolder}
              />
            </div>
          )}
          
          <section className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {isShared && (
                  <span className="bg-primary-fixed-dim text-on-primary-fixed px-3 py-1 rounded-full font-label-md text-label-md flex items-center gap-1">
                    <Users size={14} /> Shared
                  </span>
                )}
                {activeFolder.due_date && (
                  <span className="text-on-surface-variant font-body-md text-body-md flex items-center gap-1">
                    <Clock size={14} /> Due {formatDateTime(activeFolder.due_date)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <h2 className="font-headline-lg text-headline-lg md:text-headline-lg text-on-surface">{activeFolder.title}</h2>
                {activeFolder.owner_id === currentUserId && (
                  <div className="flex items-center gap-2">
                    <button onClick={onToggleFolderEdit} className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDeleteFolder(activeFolder)} disabled={isSaving} className="w-8 h-8 rounded-full hover:bg-error-container hover:text-error flex items-center justify-center text-on-surface-variant transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-on-surface-variant font-body-lg text-body-lg mt-2 max-w-2xl">
                {activeFolder.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex flex-col gap-4 min-w-[300px]">
              <div className="bg-light-card dark:bg-dark-card rounded-xl p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-surface-variant/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-title-lg text-body-md font-semibold text-on-surface">Live Members</span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                
                <div className="flex items-center pl-2">
                  {folderMemberUserIds.slice(0, 3).map((memberId, idx) => {
                    const zIndexClass = idx === 0 ? 'z-30' : idx === 1 ? 'z-20' : 'z-10'
                    return (
                      <UserAvatar
                        key={memberId}
                        label={getProfileLabel(memberId)}
                        avatarUrl={getProfileAvatar(memberId)}
                        className={`w-10 h-10 border-2 border-white text-sm relative -ml-3 ${zIndexClass}`}
                      />
                    )
                  })}
                  {folderMemberUserIds.length > 3 && (
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-surface-container flex items-center justify-center font-label-md text-on-surface-variant relative z-0 -ml-3">
                      +{folderMemberUserIds.length - 3}
                    </div>
                  )}
                  {folderMemberUserIds.length === 0 && (
                    <span className="text-on-surface-variant text-sm ml-2">Owner only</span>
                  )}
                </div>

                {canInviteMembers && (
                  <form onSubmit={onInviteMember} className="mt-4 flex items-center gap-2">
                    <div className="relative flex-1">
                      <input 
                        value={memberUsername}
                        onChange={(e) => onMemberUsernameChange(e.target.value)}
                        disabled={isSaving}
                        className="w-full bg-surface-container-low border-none rounded-lg py-2 pl-3 pr-8 font-body-md text-body-md focus:ring-2 focus:ring-primary/50 text-on-surface placeholder:text-outline-variant" 
                        placeholder="Invite via username..." 
                        type="text" 
                      />
                    </div>
                    <button type="submit" disabled={isSaving || !memberUsername.trim()} className="bg-surface-variant text-on-surface hover:bg-surface-dim transition-colors rounded-lg w-10 h-10 flex items-center justify-center disabled:opacity-50">
                      <Plus size={18} />
                    </button>
                  </form>
                )}
                {activeFolder.owner_id === currentUserId && !isShared && (
                  <p className="text-xs text-on-surface-variant mt-2">Convert to Shared before adding members.</p>
                )}
              </div>
            </div>
          </section>

          {showTasks && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-surface-variant pb-2">
                <h3 className="font-headline-md text-headline-md text-on-surface">Tasks</h3>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex gap-4 mr-4">
                    {statusColumns.map((status) => (
                      <span key={status.id} className="text-sm font-medium flex items-center gap-1 text-on-surface-variant">
                        <span className={`w-2 h-2 rounded-full ${status.id === 'ongoing' ? 'bg-sky-500' : status.id === 'half_done' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                        {status.label}: {folderStatusTotals[status.id]}
                      </span>
                    ))}
                  </div>
                  <button className="text-primary hover:text-primary-container font-label-md text-label-md flex items-center gap-1">
                    <Filter size={16} /> Filter
                  </button>
                </div>
              </div>
              
              <TaskForm
                canEditRecipientAmount={activeFolder.owner_id === currentUserId}
                defaultCategory={activeFolder.category as FolderCategory}
                defaultRecipientAmount={activeFolder.recipient_task_amount ?? 0}
                forceExportButton={activeFolder.contains_export_videos}
                isSaving={isSaving}
                onCreate={onCreateFolderTask}
              />
              
              <TaskList
                assignableMembers={assignableMembers}
                contributionsByTask={contributionsByTask}
                currentUserId={currentUserId}
                editingTaskId={editingTaskId}
                emptyMessage={
                  normalizedSearchQuery ? 'No tasks match this search.' : 'Add a task to start the live session.'
                }
                folderOwnerId={activeFolder.owner_id}
                forceExportButton={activeFolder.contains_export_videos}
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
                taskLevelCompletedIdsByTask={taskLevelCompletedIdsByTask}
                taskLevelsByTask={taskLevelsByTask}
                tasks={tasks}
              />
            </section>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <FolderOpen size={48} className="text-outline-variant mb-4" />
          <h3 className="font-title-lg text-title-lg text-on-surface mb-2">No Workspace Selected</h3>
          <p className="text-on-surface-variant text-center max-w-sm">
            {folderCount ? 'Select a folder from the sidebar to view its details and tasks.' : 'Create your first workspace to unlock the live session.'}
          </p>
        </div>
      )}
    </div>
  )
}
