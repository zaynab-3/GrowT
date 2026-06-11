import type { FormEvent } from 'react'
import { RefreshCw, FolderX, CheckSquare } from 'lucide-react'
import { AcquaintancesPanel } from '../features/acquaintances/AcquaintancesPanel'
import type { FolderEditValues } from '../features/folders/FolderEditForm'
import { FolderRestorePanel } from '../features/folders/FolderRestorePanel'
import type { TaskEditValues } from '../features/tasks/TaskEditForm'
import type { TaskCreateValues } from '../features/tasks/TaskForm'
import { TaskRestorePanel } from '../features/tasks/TaskRestorePanel'
import type { FolderCategory, ReorderDirection, TaskProgressStatus } from '../lib/database.types'
import type { AvatarChoice, ColorPalette, ThemeMode } from '../lib/database.types'
import { isSharedFolder } from '../lib/growtDisplay'
import type { Folder, Task, TaskMember, TaskStatusAction } from '../lib/growtData'
import { AcquaintancesView } from './AcquaintancesView'
import { DashboardView } from './DashboardView'
import { FolderDetailPage } from './FolderDetailPage'
import { FolderFormPage } from './FolderFormPage'
import { FolderListPage } from './FolderListPage'
import { InvitePage } from './InvitePage'
import { NotificationsView } from './NotificationsView'
import { RestoreView } from './RestoreView'
import { SettingsView } from './SettingsView'
import { TaskDetailPage } from './TaskDetailPage'
import { TaskFormPage } from './TaskFormPage'
import { TaskListPage } from './TaskListPage'
import type { AppRoute, AppView } from './viewTypes'

type AssignableMember = { id: string; label: string }
type ContributionCounts = Record<TaskProgressStatus, number>
type StatusContribution = { action: TaskStatusAction; userId: string }

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
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  hasUnsavedChanges: boolean

  isSaving: boolean
  memberUsername: string
  normalizedSearchQuery: string
  onAddFolder: () => void
  onAddTask: (folderId?: string) => void
  onAddTaskMember: (task: Task, username: string) => void
  onCloseTaskEdit: () => void
  onCopyShareLink: (type: 'folder' | 'task', id: string) => void
  onCreateFolder: (event: FormEvent<HTMLFormElement>, inviteUsernames?: string[]) => void
  onCreateFolderTask: (values: TaskCreateValues) => void
  onCreateStandaloneTask: (values: TaskCreateValues) => void
  onDeleteFolder: (folder: Folder) => void
  onHardDeleteFolder: (folder: Folder) => void
  onDeleteTask: (task: Task) => void
  onHardDeleteTask: (task: Task) => void
  onEditFolder: (folderId: string) => void
  onEditTask: (taskId: string) => void
  onFolderCategoryChange: (category: FolderCategory) => void
  onFolderDescriptionChange: (description: string) => void
  onFolderTitleChange: (title: string) => void
  onInviteMember: (event: FormEvent<HTMLFormElement>) => void
  onMemberUsernameChange: (username: string) => void
  onMoveFolder: (folder: Folder, direction: ReorderDirection, scopedFolderIds?: string[]) => void
  onMoveTask: (task: Task, direction: ReorderDirection, scopedTaskIds?: string[]) => void
  onNavigate: (view: AppView) => void
  onOpenFolder: (folderId: string) => void
  onOpenTask: (task: Task) => void
  onProfileAvatarChoiceChange: (avatarChoice: AvatarChoice) => void
  onProfileColorPaletteChange: (colorPalette: ColorPalette) => void
  onProfileDisplayNameChange: (displayName: string) => void
  onProfileThemeModeChange: (themeMode: ThemeMode) => void
  onProfileUsernameChange: (username: string) => void
  onRemoveTaskMember: (task: Task, userId: string) => void
  onRestoreFolder: (folder: Folder) => void
  onRestoreTask: (task: Task) => void
  onSaveProfile: (event: FormEvent<HTMLFormElement>) => void
  onSelectFolder: (folderId: string) => void
  onSetTaskStatus: (taskId: string, status: TaskProgressStatus) => void
  onUndoAction: (action: TaskStatusAction) => void
  onUpdateFolder: (values: FolderEditValues) => void
  onUpdateTask: (taskId: string, values: TaskEditValues) => void
  pendingAction: string | null
  profileAvatarChoice: AvatarChoice
  profileColorPalette: ColorPalette
  profileDisplayName: string
  profileThemeMode: ThemeMode
  profileUsername: string
  realtimeLabel: string
  route: AppRoute
  sharedFolders: Folder[]
  sharedStandaloneTasks: Task[]
  standaloneAssignableMembers: AssignableMember[]
  standaloneTasks: Task[]
  statusTotals: ContributionCounts
  statusHistoryByTask: Map<string, Record<TaskProgressStatus, StatusContribution[]>>
  taskMembersByTask: Map<string, TaskMember[]>
  tasks: Task[]
}

function calculateGrowthPercentage(items: { created_at: string }[]): number | null {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  let thisWeek = 0
  let lastWeek = 0

  for (const item of items) {
    const d = new Date(item.created_at)
    if (d > oneWeekAgo) {
      thisWeek++
    } else if (d > twoWeeksAgo && d <= oneWeekAgo) {
      lastWeek++
    }
  }

  if (lastWeek === 0) {
    return null
  }
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
}

function calculateDeletedGrowthPercentage(items: { deleted_at: string | null }[]): number | null {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  let thisWeek = 0
  let lastWeek = 0

  for (const item of items) {
    if (!item.deleted_at) continue
    const d = new Date(item.deleted_at)
    if (d > oneWeekAgo) {
      thisWeek++
    } else if (d > twoWeeksAgo && d <= oneWeekAgo) {
      lastWeek++
    }
  }

  if (lastWeek === 0) {
    return null
  }
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
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
  getProfileAvatar,
  getProfileLabel,
  hasUnsavedChanges,
  isSaving,

  memberUsername,
  normalizedSearchQuery,
  onAddFolder,
  onAddTask,
  onAddTaskMember,
  onCloseTaskEdit,
  onCopyShareLink,
  onCreateFolder,
  onCreateFolderTask,
  onCreateStandaloneTask,
  onDeleteFolder,
  onHardDeleteFolder,
  onDeleteTask,
  onHardDeleteTask,
  onEditFolder,
  onEditTask,
  onFolderCategoryChange,
  onFolderDescriptionChange,
  onFolderTitleChange,
  onInviteMember,
  onMemberUsernameChange,
  onMoveFolder,
  onMoveTask,
  onNavigate,
  onOpenFolder,
  onOpenTask,
  onProfileAvatarChoiceChange,
  onProfileColorPaletteChange,
  onProfileDisplayNameChange,
  onProfileThemeModeChange,
  onProfileUsernameChange,
  onRemoveTaskMember,
  onRestoreFolder,
  onRestoreTask,
  onSaveProfile,
  onSetTaskStatus,
  onUndoAction,
  onUpdateFolder,
  onUpdateTask,
  pendingAction,
  profileAvatarChoice,
  profileColorPalette,
  profileDisplayName,
  profileThemeMode,
  profileUsername,
  realtimeLabel,
  route,
  sharedFolders,
  sharedStandaloneTasks,
  standaloneAssignableMembers,
  standaloneTasks,
  statusTotals,
  statusHistoryByTask,
  taskMembersByTask,
  tasks,
}: AppViewRouterProps) {

  // Route-level dispatch (takes priority over activeView for detail/form routes)
  switch (route.name) {
    case 'invite':
      return (
        <InvitePage
          inviteId={route.inviteId}
          onNavigateToFolder={(id) => onOpenFolder(id)}
          onNavigateToTask={(id) => onOpenTask(tasks.find(t => t.id === id) || standaloneTasks.find(t => t.id === id) || { id, folder_id: null } as unknown as Task)}
          onNavigateToHome={() => onNavigate('folders')}
        />
      )

    case 'folder-new':
      return (
        <FolderFormPage
          folderCategory={folderCategory}
          folderDescription={folderDescription}
          folderTitle={folderTitle}
          isSaving={isSaving}
          mode="create"
          onBack={() => onNavigate('folders')}
          onCreateFolder={onCreateFolder}
          onFolderCategoryChange={onFolderCategoryChange}
          onFolderDescriptionChange={onFolderDescriptionChange}
          onFolderTitleChange={onFolderTitleChange}
        />
      )

    case 'folder-detail':
      return activeFolder ? (
        <FolderDetailPage
          assignableMembers={assignableMembers}
          canInviteMembers={isSharedFolder(activeFolder) && activeFolder.owner_id === currentUserId}
          contributionsByTask={contributionsByTask}
          currentUserId={currentUserId}
          editingTaskId={editingTaskId}
          folder={activeFolder}
          folderMemberUserIds={folderMemberUserIds}
          getProfileAvatar={getProfileAvatar}
          getProfileLabel={getProfileLabel}
          isSaving={isSaving}
          memberUsername={memberUsername}
          normalizedSearchQuery={normalizedSearchQuery}
          onAddTask={() => onAddTask(activeFolder.id)}
          onBack={() => onNavigate('folders')}
          onCloseTaskEdit={onCloseTaskEdit}
          onCopyShareLink={onCopyShareLink}
          onCreateFolderTask={onCreateFolderTask}
          onDeleteFolder={onDeleteFolder}
          onDeleteTask={onDeleteTask}
          onEditFolder={() => onEditFolder(activeFolder.id)}
          onEditTask={onEditTask}
          onInviteMember={onInviteMember}
          onMemberUsernameChange={onMemberUsernameChange}
          onMoveTask={onMoveTask}
          onSetTaskStatus={onSetTaskStatus}
          onUndoAction={onUndoAction}
          onUpdateTask={onUpdateTask}
          pendingAction={pendingAction}
          statusHistoryByTask={statusHistoryByTask}
          tasks={filteredTasks}
        />
      ) : dataLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-on-surface-variant font-body-md min-h-[400px]">
          <RefreshCw className="animate-spin text-primary mb-4" size={48} />
          <p className="font-semibold text-on-surface text-lg">Loading Workspace...</p>
          <p className="text-on-surface-variant text-sm mt-1">Retrieving tasks and members.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-on-surface-variant font-body-md text-center max-w-md mx-auto min-h-[400px]">
          <FolderX className="text-primary/40 mb-4" size={64} />
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Workspace not found</h2>
          <p className="font-body-md mb-6 text-on-surface-variant">This workspace may have been deleted, or you may not have permission to view it.</p>
          <button onClick={() => onNavigate('folders')} className="bg-primary text-white font-label-md text-label-md px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-all shadow-md shadow-primary/20">
            Back to Workspaces
          </button>
        </div>
      )

    case 'folder-edit':
      return activeFolder ? (
        <FolderFormPage
          folder={activeFolder}
          isSaving={isSaving}
          mode="edit"
          onBack={() => onNavigate('folders')}
          onUpdateFolder={onUpdateFolder}
        />
      ) : dataLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-on-surface-variant font-body-md min-h-[400px]">
          <RefreshCw className="animate-spin text-primary mb-4" size={48} />
          <p className="font-semibold text-on-surface text-lg">Loading Details...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-on-surface-variant font-body-md text-center max-w-md mx-auto min-h-[400px]">
          <FolderX className="text-primary/40 mb-4" size={64} />
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Workspace not found</h2>
          <button onClick={() => onNavigate('folders')} className="bg-primary text-white font-label-md text-label-md px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-all">
            Back to Workspaces
          </button>
        </div>
      )

    case 'task-detail': {
      const taskToView = tasks.find((t) => t.id === route.taskId) ?? standaloneTasks.find((t) => t.id === route.taskId) ?? null
      return taskToView ? (
        <TaskDetailPage
          contributions={contributionsByTask.get(taskToView.id)}
          currentUserId={currentUserId}
          folderOwnerId={activeFolder?.owner_id}
          getProfileAvatar={getProfileAvatar}
          getProfileLabel={getProfileLabel}
          isSaving={isSaving}
          onAddMember={onAddTaskMember}
          onBack={() => onNavigate('folders')}
          onCopyShareLink={onCopyShareLink}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onRemoveMember={onRemoveTaskMember}
          onSetTaskStatus={onSetTaskStatus}
          onUndoAction={onUndoAction}
          pendingAction={pendingAction}
          statusHistory={statusHistoryByTask.get(taskToView.id)}
          task={taskToView}
          taskMembers={taskMembersByTask.get(taskToView.id)}
        />
      ) : dataLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-on-surface-variant font-body-md min-h-[400px]">
          <RefreshCw className="animate-spin text-primary mb-4" size={48} />
          <p className="font-semibold text-on-surface text-lg">Loading Task...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-on-surface-variant font-body-md text-center max-w-md mx-auto min-h-[400px]">
          <CheckSquare className="text-primary/40 mb-4" size={64} />
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Task not found</h2>
          <p className="font-body-md mb-6 text-on-surface-variant">The task details could not be retrieved.</p>
          <button onClick={() => onNavigate('folders')} className="bg-primary text-white font-label-md text-label-md px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-all">
            Back to Workspaces
          </button>
        </div>
      )
    }

    case 'task-new':
      return (
        <TaskFormPage
          assignableMembers={route.folderId ? assignableMembers : standaloneAssignableMembers}
          defaultCategory={activeFolder?.category ?? 'personal'}
          folderTitle={activeFolder?.title}
          isSaving={isSaving}
          mode="create"
          onBack={() => route.folderId ? onNavigate('folders') : onNavigate('tasks')}
          onCreateTask={route.folderId ? onCreateFolderTask : onCreateStandaloneTask}
        />
      )

    case 'task-edit': {
      const taskToEdit = tasks.find((t) => t.id === route.taskId) ?? standaloneTasks.find((t) => t.id === route.taskId) ?? null
      
      let taskAssignableMembers = route.folderId ? assignableMembers : standaloneAssignableMembers
      if (taskToEdit) {
        const members = taskMembersByTask.get(taskToEdit.id)
        if (members) {
          const existingIds = new Set(taskAssignableMembers.map(m => m.id))
          const additionalMembers = members
            .filter(tm => !existingIds.has(tm.user_id))
            .map(tm => ({
              id: tm.user_id,
              label: getProfileLabel(tm.user_id)
            }))
          if (additionalMembers.length > 0) {
            taskAssignableMembers = [...taskAssignableMembers, ...additionalMembers]
          }
        }
      }

      return taskToEdit ? (
        <TaskFormPage
          assignableMembers={taskAssignableMembers}
          folderTitle={activeFolder?.title}
          isSaving={isSaving}
          mode="edit"
          onBack={() => route.folderId ? onNavigate('folders') : onNavigate('tasks')}
          onUpdateTask={(values) => onUpdateTask(taskToEdit.id, values)}
          onAddTaskMember={(username) => onAddTaskMember(taskToEdit, username)}
          task={taskToEdit}
        />
      ) : dataLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-on-surface-variant font-body-md min-h-[400px]">
          <RefreshCw className="animate-spin text-primary mb-4" size={48} />
          <p className="font-semibold text-on-surface text-lg">Loading Details...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-on-surface-variant font-body-md text-center max-w-md mx-auto min-h-[400px]">
          <CheckSquare className="text-primary/40 mb-4" size={64} />
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Task not found</h2>
          <button onClick={() => onNavigate('folders')} className="bg-primary text-white font-label-md text-label-md px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-all">
            Back to Workspaces
          </button>
        </div>
      )
    }

    default:
      break
  }

  // View-level dispatch
  switch (activeView) {
    case 'dashboard':
      return (
        <DashboardView
          activeFolderDescription={
            activeFolder?.description ?? 'Open a folder to see its details.'
          }
          activeFolderTitle={activeFolder?.title ?? 'No folder selected'}
          deletedCount={deletedFolders.length + deletedTasks.length}
          folderCount={folders.length}
          onNavigate={onNavigate}
          realtimeLabel={activeFolder && dataLoading ? 'Syncing' : realtimeLabel}
          sharedCount={sharedFolders.length + sharedStandaloneTasks.length}
          statusTotals={statusTotals}
          taskCount={standaloneTasks.length}
          totalTasksCount={tasks.length + standaloneTasks.length}
          folderGrowth={calculateGrowthPercentage(folders)}
          taskGrowth={calculateGrowthPercentage(standaloneTasks)}
          sharedGrowth={calculateGrowthPercentage([...sharedFolders, ...sharedStandaloneTasks])}
          deletedGrowth={calculateDeletedGrowthPercentage([...deletedFolders, ...deletedTasks])}
        />
      )

    case 'folders':
  return (
    <FolderListPage
      currentUserId={currentUserId}
      folders={folders}
      tasks={tasks}
      contributionsByTask={contributionsByTask}
      getProfileAvatar={getProfileAvatar}
      getProfileLabel={getProfileLabel}
      isSaving={isSaving}
      onAddFolder={onAddFolder}
      onDeleteFolder={onDeleteFolder}
      onEditFolder={onEditFolder}
      onMoveFolder={onMoveFolder}
      onOpenFolder={(folderId) => onOpenFolder(folderId)}
    />
  )

    case 'tasks':
      return (
        <TaskListPage
          assignableMembers={standaloneAssignableMembers}
          contributionsByTask={contributionsByTask}
          currentUserId={currentUserId}
          editingTaskId={editingTaskId}
          folders={folders}
          getProfileAvatar={getProfileAvatar}
          getProfileLabel={getProfileLabel}
          isSaving={isSaving}
          normalizedSearchQuery={normalizedSearchQuery}
          onAddTask={() => onAddTask()}
          onAddTaskMember={onAddTaskMember}
          onCloseTaskEdit={onCloseTaskEdit}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onMoveTask={onMoveTask}
          onOpenTask={onOpenTask}
          onRemoveTaskMember={onRemoveTaskMember}
          onSetTaskStatus={onSetTaskStatus}
          onUndoAction={onUndoAction}
          onUpdateTask={onUpdateTask}
          pendingAction={pendingAction}
          standaloneTasks={standaloneTasks}
          statusHistoryByTask={statusHistoryByTask}
          taskMembersByTask={taskMembersByTask}
        />
      )

    case 'acquaintances':
      return (
        <AcquaintancesView>
          <AcquaintancesPanel />
        </AcquaintancesView>
      )

    case 'notifications':
      return <NotificationsView onNavigate={(view) => onNavigate(view)} />

    case 'restore':
      return (
        <RestoreView
          deletedFolderCount={deletedFolders.length}
          deletedTaskCount={deletedTasks.length}
          folderRestorePanel={
            <FolderRestorePanel folders={deletedFolders} isSaving={isSaving} onRestore={onRestoreFolder} onHardDelete={onHardDeleteFolder} />
          }
          taskRestorePanel={
            <TaskRestorePanel
              getFolderLabel={(folderId) =>
                folderId ? folders.find((f) => f.id === folderId)?.title ?? 'Folder task' : 'Standalone'
              }
              isSaving={isSaving}
              onRestore={onRestoreTask}
              onHardDelete={onHardDeleteTask}
              tasks={deletedTasks}
            />
          }
        />
      )

    case 'settings':
      return (
        <SettingsView
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          onProfileAvatarChoiceChange={onProfileAvatarChoiceChange}
          onProfileColorPaletteChange={onProfileColorPaletteChange}
          onProfileDisplayNameChange={onProfileDisplayNameChange}
          onProfileThemeModeChange={onProfileThemeModeChange}
          onProfileUsernameChange={onProfileUsernameChange}
          onSaveProfile={onSaveProfile}
          profileAvatarChoice={profileAvatarChoice}
          profileColorPalette={profileColorPalette}
          profileDisplayName={profileDisplayName}
          profileThemeMode={profileThemeMode}
          profileUsername={profileUsername}
        />
      )

    default:
      return null
  }
}
