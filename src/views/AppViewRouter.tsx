import type { FormEvent } from 'react'
import { AcquaintancesPanel } from '../features/acquaintances/AcquaintancesPanel'
import { FolderCreateForm } from '../features/folders/FolderCreateForm'
import { FolderDetail } from '../features/folders/FolderDetail'
import type { FolderEditValues } from '../features/folders/FolderEditForm'
import { FolderList } from '../features/folders/FolderList'
import { FolderRestorePanel } from '../features/folders/FolderRestorePanel'
import { StandaloneTasksPanel } from '../features/tasks/StandaloneTasksPanel'
import type { TaskEditValues } from '../features/tasks/TaskEditForm'
import type { TaskCreateValues } from '../features/tasks/TaskForm'
import { TaskRestorePanel } from '../features/tasks/TaskRestorePanel'
import type { FolderCategory, ReorderDirection, TaskProgressStatus } from '../lib/database.types'
import { isSharedFolder } from '../lib/growtDisplay'
import type { Folder, Task, TaskMember, TaskStatusAction } from '../lib/growtData'
import { AcquaintancesView } from './AcquaintancesView'
import { DashboardView } from './DashboardView'
import { MyTasksView } from './MyTasksView'
import { NotificationsView } from './NotificationsView'
import { RestoreView } from './RestoreView'
import { SettingsView } from './SettingsView'
import { SharedView } from './SharedView'
import type { AppView } from './viewTypes'

type AssignableMember = {
  id: string
  label: string
}

type ContributionCounts = Record<TaskProgressStatus, number>

type StatusContribution = {
  action: TaskStatusAction
  userId: string
}

type AppViewRouterProps = {
  activeFolder: Folder | null
  activeView: AppView
  assignableMembers: AssignableMember[]
  contributionsByTask: Map<string, Record<TaskProgressStatus, StatusContribution[]>>
  currentUserId: string
  dataLoading: boolean
  deletedFolders: Folder[]
  deletedTasks: Task[]
  editingTaskId: string | null
  filteredTasks: Task[]
  folderCategory: FolderCategory
  folderDescription: string
  folderMemberUserIds: string[]
  folderTitle: string
  folders: Folder[]
  getContributionCounts: (userId: string) => ContributionCounts
  getProfileLabel: (userId: string) => string
  isEditingFolder: boolean
  isSaving: boolean
  memberUsername: string
  normalizedSearchQuery: string
  onCancelFolderEdit: () => void
  onAddTaskMember: (task: Task, username: string) => void
  onCloseTaskEdit: () => void
  onCreateFolder: (event: FormEvent<HTMLFormElement>) => void
  onCreateFolderTask: (values: TaskCreateValues) => void
  onCreateStandaloneTask: (values: TaskCreateValues) => void
  onDeleteFolder: (folder: Folder) => void
  onDeleteTask: (task: Task) => void
  onEditTask: (taskId: string) => void
  onFolderCategoryChange: (category: FolderCategory) => void
  onFolderDescriptionChange: (description: string) => void
  onFolderTitleChange: (title: string) => void
  onInviteMember: (event: FormEvent<HTMLFormElement>) => void
  onMemberUsernameChange: (username: string) => void
  onMoveFolder: (folder: Folder, direction: ReorderDirection) => void
  onMoveTask: (task: Task, direction: ReorderDirection) => void
  onNavigate: (view: AppView) => void
  onProfileDisplayNameChange: (displayName: string) => void
  onProfileUsernameChange: (username: string) => void
  onRemoveTaskMember: (task: Task, userId: string) => void
  onRestoreFolder: (folder: Folder) => void
  onRestoreTask: (task: Task) => void
  onSaveProfile: (event: FormEvent<HTMLFormElement>) => void
  onSelectFolder: (folderId: string) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onToggleFolderEdit: () => void
  onUndoAction: (action: TaskStatusAction) => void
  onUpdateFolder: (values: FolderEditValues) => void
  onUpdateTask: (taskId: string, values: TaskEditValues) => void
  pendingAction: string | null
  personalFolders: Folder[]
  personalStandaloneTasks: Task[]
  profileDisplayName: string
  profileUsername: string
  realtimeLabel: string
  sharedFolders: Folder[]
  sharedStandaloneTasks: Task[]
  standaloneAssignableMembers: AssignableMember[]
  standaloneTasks: Task[]
  statusTotals: ContributionCounts
  taskMembersByTask: Map<string, TaskMember[]>
  tasks: Task[]
}

const emptyStatusTotals: ContributionCounts = {
  completed: 0,
  half_done: 0,
  ongoing: 0,
}

export function AppViewRouter({
  activeFolder,
  activeView,
  assignableMembers,
  contributionsByTask,
  currentUserId,
  dataLoading,
  deletedFolders,
  deletedTasks,
  editingTaskId,
  filteredTasks,
  folderCategory,
  folderDescription,
  folderMemberUserIds,
  folderTitle,
  folders,
  getContributionCounts,
  getProfileLabel,
  isEditingFolder,
  isSaving,
  memberUsername,
  normalizedSearchQuery,
  onCancelFolderEdit,
  onAddTaskMember,
  onCloseTaskEdit,
  onCreateFolder,
  onCreateFolderTask,
  onCreateStandaloneTask,
  onDeleteFolder,
  onDeleteTask,
  onEditTask,
  onFolderCategoryChange,
  onFolderDescriptionChange,
  onFolderTitleChange,
  onInviteMember,
  onMemberUsernameChange,
  onMoveFolder,
  onMoveTask,
  onNavigate,
  onProfileDisplayNameChange,
  onProfileUsernameChange,
  onRemoveTaskMember,
  onRestoreFolder,
  onRestoreTask,
  onSaveProfile,
  onSelectFolder,
  onSetTaskStatus,
  onToggleFolderEdit,
  onUndoAction,
  onUpdateFolder,
  onUpdateTask,
  pendingAction,
  personalFolders,
  personalStandaloneTasks,
  profileDisplayName,
  profileUsername,
  realtimeLabel,
  sharedFolders,
  sharedStandaloneTasks,
  standaloneAssignableMembers,
  standaloneTasks,
  statusTotals,
  taskMembersByTask,
  tasks,
}: AppViewRouterProps) {
  const selectedFolderIsShared = activeFolder ? isSharedFolder(activeFolder) : false
  const myTasksActiveFolder = activeFolder && !selectedFolderIsShared ? activeFolder : null
  const sharedActiveFolder = activeFolder && selectedFolderIsShared ? activeFolder : null

  const folderCreateForm = (
    <FolderCreateForm
      folderCategory={folderCategory}
      folderDescription={folderDescription}
      folderTitle={folderTitle}
      isSaving={isSaving}
      onCreateFolder={onCreateFolder}
      onFolderCategoryChange={onFolderCategoryChange}
      onFolderDescriptionChange={onFolderDescriptionChange}
      onFolderTitleChange={onFolderTitleChange}
    />
  )
  const personalFolderList = (
    <FolderList
      activeFolderId={myTasksActiveFolder?.id ?? null}
      currentUserId={currentUserId}
      emptyMessage={normalizedSearchQuery ? 'No personal or work folders match this search.' : 'No personal or work folders yet.'}
      folders={personalFolders}
      isSaving={isSaving}
      onMoveFolder={onMoveFolder}
      onSelectFolder={onSelectFolder}
    />
  )
  const sharedFolderList = (
    <FolderList
      activeFolderId={sharedActiveFolder?.id ?? null}
      currentUserId={currentUserId}
      emptyMessage={normalizedSearchQuery ? 'No shared folders match this search.' : 'No shared folders yet.'}
      folders={sharedFolders}
      isSaving={isSaving}
      onMoveFolder={onMoveFolder}
      onSelectFolder={onSelectFolder}
    />
  )
  const renderFolderDetail = (folder: Folder | null, folderCount: number) => (
    <FolderDetail
      activeFolder={folder}
      assignableMembers={folder ? assignableMembers : []}
      canInviteMembers={Boolean(folder && isSharedFolder(folder) && folder.owner_id === currentUserId)}
      contributionsByTask={contributionsByTask}
      currentUserId={currentUserId}
      editingTaskId={editingTaskId}
      folderCount={folderCount}
      folderMemberUserIds={folder ? folderMemberUserIds : []}
      getContributionCounts={getContributionCounts}
      getProfileLabel={getProfileLabel}
      isEditingFolder={isEditingFolder}
      isSaving={isSaving}
      isSharedFolder={Boolean(folder && isSharedFolder(folder))}
      memberUsername={memberUsername}
      normalizedSearchQuery={normalizedSearchQuery}
      onCancelFolderEdit={onCancelFolderEdit}
      onCloseTaskEdit={onCloseTaskEdit}
      onCreateFolderTask={onCreateFolderTask}
      onDeleteFolder={onDeleteFolder}
      onDeleteTask={onDeleteTask}
      onEditTask={onEditTask}
      onInviteMember={onInviteMember}
      onMemberUsernameChange={onMemberUsernameChange}
      onMoveTask={onMoveTask}
      onSetTaskStatus={onSetTaskStatus}
      onToggleFolderEdit={onToggleFolderEdit}
      onUndoAction={onUndoAction}
      onUpdateFolder={onUpdateFolder}
      onUpdateTask={onUpdateTask}
      pendingAction={pendingAction}
      statusTotals={folder ? statusTotals : emptyStatusTotals}
      tasks={folder ? filteredTasks : []}
    />
  )
  const personalStandalonePanel = (
    <StandaloneTasksPanel
      assignableMembers={standaloneAssignableMembers}
      contributionsByTask={contributionsByTask}
      currentUserId={currentUserId}
      defaultCategory="personal"
      editingTaskId={editingTaskId}
      emptyMessage={
        normalizedSearchQuery ? 'No personal or work standalone tasks match this search.' : 'Add a standalone task anytime.'
      }
      getProfileLabel={getProfileLabel}
      isSaving={isSaving}
      onAddTaskMember={onAddTaskMember}
      onCloseEdit={onCloseTaskEdit}
      onCreateTask={onCreateStandaloneTask}
      onDeleteTask={onDeleteTask}
      onEditTask={onEditTask}
      onMoveTask={onMoveTask}
      onRemoveTaskMember={onRemoveTaskMember}
      onSetTaskStatus={onSetTaskStatus}
      onUndoAction={onUndoAction}
      onUpdateTask={onUpdateTask}
      pendingAction={pendingAction}
      taskMembersByTask={taskMembersByTask}
      tasks={personalStandaloneTasks}
    />
  )
  const sharedStandalonePanel = (
    <StandaloneTasksPanel
      assignableMembers={standaloneAssignableMembers}
      contributionsByTask={contributionsByTask}
      currentUserId={currentUserId}
      defaultCategory="shared"
      editingTaskId={editingTaskId}
      emptyMessage={
        normalizedSearchQuery ? 'No shared standalone tasks match this search.' : 'No shared standalone tasks yet.'
      }
      getProfileLabel={getProfileLabel}
      isSaving={isSaving}
      onAddTaskMember={onAddTaskMember}
      onCloseEdit={onCloseTaskEdit}
      onCreateTask={onCreateStandaloneTask}
      onDeleteTask={onDeleteTask}
      onEditTask={onEditTask}
      onMoveTask={onMoveTask}
      onRemoveTaskMember={onRemoveTaskMember}
      onSetTaskStatus={onSetTaskStatus}
      onUndoAction={onUndoAction}
      onUpdateTask={onUpdateTask}
      pendingAction={pendingAction}
      sectionLabel="Shared tasks"
      taskMembersByTask={taskMembersByTask}
      tasks={sharedStandaloneTasks}
      title="Shared Standalone Tasks"
    />
  )
  const folderRestorePanel = (
    <FolderRestorePanel folders={deletedFolders} isSaving={isSaving} onRestore={onRestoreFolder} />
  )
  const taskRestorePanel = (
    <TaskRestorePanel
      getFolderLabel={(folderId) =>
        folderId ? folders.find((folder) => folder.id === folderId)?.title ?? 'Folder task' : 'Standalone'
      }
      isSaving={isSaving}
      onRestore={onRestoreTask}
      tasks={deletedTasks}
    />
  )

  switch (activeView) {
    case 'dashboard':
      return (
        <DashboardView
          activeFolderDescription={
            activeFolder?.description ?? 'Select a folder in My Tasks or Shared with Me to inspect its live session.'
          }
          activeFolderTitle={activeFolder?.title ?? 'No folder selected'}
          deletedCount={deletedFolders.length + deletedTasks.length}
          folderCount={folders.length}
          onNavigate={onNavigate}
          realtimeLabel={activeFolder && dataLoading ? 'Syncing' : realtimeLabel}
          sharedCount={sharedFolders.length + sharedStandaloneTasks.length}
          taskCount={tasks.length + standaloneTasks.length}
        />
      )
    case 'my-tasks':
      return (
        <MyTasksView
          folderCreateForm={folderCreateForm}
          folderDetail={renderFolderDetail(myTasksActiveFolder, personalFolders.length)}
          folderList={personalFolderList}
          personalFolderCount={personalFolders.length}
          standaloneTaskCount={personalStandaloneTasks.length}
          standaloneTasksPanel={personalStandalonePanel}
        />
      )
    case 'shared':
      return (
        <SharedView
          folderCreateForm={folderCreateForm}
          folderDetail={renderFolderDetail(sharedActiveFolder, sharedFolders.length)}
          folderList={sharedFolderList}
          sharedFolderCount={sharedFolders.length}
          sharedTaskCount={sharedStandaloneTasks.length}
          sharedTasksPanel={sharedStandalonePanel}
        />
      )
    case 'acquaintances':
      return (
        <AcquaintancesView>
          <AcquaintancesPanel />
        </AcquaintancesView>
      )
    case 'notifications':
      return <NotificationsView />
    case 'restore':
      return (
        <RestoreView
          deletedFolderCount={deletedFolders.length}
          deletedTaskCount={deletedTasks.length}
          folderRestorePanel={folderRestorePanel}
          taskRestorePanel={taskRestorePanel}
        />
      )
    case 'settings':
      return (
        <SettingsView
          isSaving={isSaving}
          onProfileDisplayNameChange={onProfileDisplayNameChange}
          onProfileUsernameChange={onProfileUsernameChange}
          onSaveProfile={onSaveProfile}
          profileDisplayName={profileDisplayName}
          profileUsername={profileUsername}
        />
      )
    default:
      return null
  }
}
