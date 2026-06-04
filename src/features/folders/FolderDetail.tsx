import type { FormEvent } from 'react'
import type { FolderCategory, ReorderDirection, TaskProgressStatus } from '../../lib/database.types'
import { statusColumns } from '../../lib/growtDisplay'
import type { Folder, Task, TaskStatusAction } from '../../lib/growtData'
import { EmptyState } from '../../components/EmptyState'
import { TaskForm, type TaskCreateValues } from '../tasks/TaskForm'
import { TaskList } from '../tasks/TaskList'
import type { TaskEditValues } from '../tasks/TaskEditForm'
import { FolderEditForm, type FolderEditValues } from './FolderEditForm'
import { FolderInfoPanel } from './FolderInfoPanel'
import { FolderMembersPanel } from './FolderMembersPanel'

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
  getContributionCounts: (userId: string) => ContributionCounts
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
  onMoveTask: (task: Task, direction: ReorderDirection) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onToggleFolderEdit: () => void
  onUndoAction: (action: TaskStatusAction) => void
  onUpdateFolder: (values: FolderEditValues) => void
  onUpdateTask: (taskId: string, values: TaskEditValues) => void
  pendingAction: string | null
  statusTotals: ContributionCounts
  tasks: Task[]
}

export function FolderDetail({
  activeFolder,
  assignableMembers,
  canInviteMembers,
  contributionsByTask,
  currentUserId,
  editingTaskId,
  folderCount,
  folderMemberUserIds,
  getContributionCounts,
  getProfileLabel,
  isEditingFolder,
  isSaving,
  isSharedFolder,
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
  onSetTaskStatus,
  onToggleFolderEdit,
  onUndoAction,
  onUpdateFolder,
  onUpdateTask,
  pendingAction,
  statusTotals,
  tasks,
}: FolderDetailProps) {
  return (
    <section className="folder-panel">
      <div className="panel-heading">
        <div>
          <p className="section-label">Folder</p>
          <h2>{activeFolder?.title ?? 'No folder selected'}</h2>
        </div>
        {activeFolder ? (
          <div className="panel-heading__meta">
            <span>{activeFolder.description ?? activeFolder.category}</span>
            {activeFolder.owner_id === currentUserId ? (
              <div className="panel-actions">
                <button className="button button--secondary" onClick={onToggleFolderEdit} type="button">
                  {isEditingFolder ? 'Close edit' : 'Edit folder'}
                </button>
                <button
                  className="button button--danger"
                  disabled={isSaving}
                  onClick={() => onDeleteFolder(activeFolder)}
                  type="button"
                >
                  Delete folder
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {activeFolder ? (
        <>
          {isEditingFolder ? (
            <FolderEditForm
              folder={activeFolder}
              isSaving={isSaving}
              onCancel={onCancelFolderEdit}
              onSave={onUpdateFolder}
            />
          ) : null}

          <FolderInfoPanel
            folder={activeFolder}
            getContributionCounts={getContributionCounts}
            getProfileLabel={getProfileLabel}
            memberUserIds={folderMemberUserIds}
            statusTotals={statusTotals}
            taskCount={tasks.length}
          />

          <FolderMembersPanel
            canInviteMembers={canInviteMembers}
            currentUserId={currentUserId}
            folder={activeFolder}
            getContributionCounts={getContributionCounts}
            getProfileLabel={getProfileLabel}
            isSaving={isSaving}
            isShared={isSharedFolder}
            memberUsername={memberUsername}
            memberUserIds={folderMemberUserIds}
            onInviteMember={onInviteMember}
            onMemberUsernameChange={onMemberUsernameChange}
          />

          <TaskForm
            defaultCategory={activeFolder.category as FolderCategory}
            isSaving={isSaving}
            onCreate={onCreateFolderTask}
          />

          <div className="status-summary" aria-label="Status totals">
            {statusColumns.map((status) => (
              <div className={`status-total status-total--${status.id}`} key={status.id}>
                <span>{status.label}</span>
                <strong>{statusTotals[status.id]}</strong>
              </div>
            ))}
          </div>

          <TaskList
            assignableMembers={assignableMembers}
            contributionsByTask={contributionsByTask}
            currentUserId={currentUserId}
            editingTaskId={editingTaskId}
            emptyMessage={
              normalizedSearchQuery ? 'No tasks match this search.' : 'Add a task to start the live session.'
            }
            folderOwnerId={activeFolder.owner_id}
            getProfileLabel={getProfileLabel}
            isSaving={isSaving}
            onCloseEdit={onCloseTaskEdit}
            onDeleteTask={onDeleteTask}
            onEditTask={onEditTask}
            onMoveTask={onMoveTask}
            onSetTaskStatus={onSetTaskStatus}
            onUndoAction={onUndoAction}
            onUpdateTask={onUpdateTask}
            pendingAction={pendingAction}
            tasks={tasks}
          />
        </>
      ) : (
        <EmptyState>
          {folderCount ? 'Select a folder to begin.' : 'Create a folder to unlock the live session.'}
        </EmptyState>
      )}
    </section>
  )
}
