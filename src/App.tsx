import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { AuthPanel } from './auth/AuthPanel'
import { ConfirmDialog } from './components/ConfirmDialog'
import { LoadingState } from './components/LoadingState'
import { FolderDetail } from './features/folders/FolderDetail'
import type { FolderEditValues } from './features/folders/FolderEditForm'
import {
  addFolderMemberByUsername,
  createFolder,
  listDeletedFolders,
  listFolderMembers,
  listFolders,
  restoreFolder,
  softDeleteFolder,
  updateFolder,
} from './features/folders/folderApi'
import { StandaloneTasksPanel } from './features/tasks/StandaloneTasksPanel'
import type { TaskCreateValues } from './features/tasks/TaskForm'
import type { TaskEditValues } from './features/tasks/TaskEditForm'
import { TaskRestorePanel } from './features/tasks/TaskRestorePanel'
import {
  addTaskMemberByUsername,
  createStandaloneTask,
  createTask,
  listDeletedTasks,
  listStandaloneTasks,
  listTaskActionsForTasks,
  listTaskMembers,
  listTaskProgressForTasks,
  listTasks,
  removeTaskMember,
  restoreTask,
  setTaskProgress,
  softDeleteTask,
  undoTaskStatusAction,
  updateTask,
} from './features/tasks/taskApi'
import { AppShell } from './layout/AppShell'
import { Sidebar } from './layout/Sidebar'
import { useGrowTData } from './hooks/useGrowTData'
import { useAuthSession } from './hooks/useAuthSession'
import { useGrowTRealtime } from './hooks/useGrowTRealtime'
import {
  isSharedFolder,
  normalizeUsername,
} from './lib/growtDisplay'
import {
  getPasswordError,
  replaceRowsForTasks,
  sortActions,
  sortByPositionAndCreatedAt,
  sortFolders,
  sortTaskMembers,
  upsertById,
} from './lib/growtState'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import {
  ensureProfile,
  listProfiles,
  resolveLoginEmail,
  updateProfile,
  type Folder,
  type FolderMember,
  type Profile,
  type Task,
  type TaskMember,
  type TaskProgress,
  type TaskStatusAction,
} from './lib/growtData'
import type { FolderCategory, TaskProgressStatus } from './lib/database.types'

type ConfirmRequest = {
  confirmLabel: string
  message: string
  onConfirm: () => Promise<void>
  title: string
}

function App() {
  const { authReady, authView, session, setAuthView, setSession } = useAuthSession()
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [profileDisplayName, setProfileDisplayName] = useState('')
  const [profileUsername, setProfileUsername] = useState('')
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({})
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [folderTitle, setFolderTitle] = useState('')
  const [folderDescription, setFolderDescription] = useState('')
  const [folderCategory, setFolderCategory] = useState<FolderCategory>('personal')
  const [members, setMembers] = useState<FolderMember[]>([])
  const [memberUsername, setMemberUsername] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [standaloneTasks, setStandaloneTasks] = useState<Task[]>([])
  const [taskMembers, setTaskMembers] = useState<TaskMember[]>([])
  const [deletedFolders, setDeletedFolders] = useState<Folder[]>([])
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([])
  const [progress, setProgress] = useState<TaskProgress[]>([])
  const [actions, setActions] = useState<TaskStatusAction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditingFolder, setIsEditingFolder] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState('Idle')
  const [notificationCount, setNotificationCount] = useState(0)

  const user = session?.user ?? null
  const profilesByIdRef = useRef<Record<string, Profile>>({})
  const taskIdsRef = useRef<Set<string>>(new Set())
  const standaloneTaskIdsRef = useRef<Set<string>>(new Set())
  const progressRef = useRef<TaskProgress[]>([])
  const actionsRef = useRef<TaskStatusAction[]>([])
  const refreshFoldersRef = useRef<() => Promise<void>>(async () => undefined)
  const refreshLiveSessionRef = useRef<() => Promise<void>>(async () => undefined)

  const {
    accountLabel,
    activeFolder,
    activeFolderIsShared,
    assignableMembers,
    canInviteMembers,
    contributionsByTask,
    filteredFolders,
    filteredStandaloneTasks,
    filteredTasks,
    folderMemberUserIds,
    getContributionCounts,
    getProfileLabel,
    normalizedSearchQuery,
    standaloneAssignableMembers,
    statusTotals,
    taskMembersByTask,
  } = useGrowTData({
    actions,
    currentProfile,
    folders,
    members,
    profilesById,
    searchQuery,
    selectedFolderId,
    standaloneTasks,
    taskMembers,
    tasks,
    userId: user?.id ?? null,
  })

  useEffect(() => {
    profilesByIdRef.current = profilesById
  }, [profilesById])

  useEffect(() => {
    taskIdsRef.current = new Set([...tasks, ...standaloneTasks].map((task) => task.id))
    standaloneTaskIdsRef.current = new Set(standaloneTasks.map((task) => task.id))
  }, [standaloneTasks, tasks])

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    actionsRef.current = actions
  }, [actions])

  const loadProfilesForIds = useCallback(async (userIds: string[]) => {
    if (!supabase) {
      return
    }

    const missingIds = Array.from(new Set(userIds))
      .filter(Boolean)
      .filter((userId) => !profilesByIdRef.current[userId])

    if (!missingIds.length) {
      return
    }

    try {
      const nextProfiles = await listProfiles(supabase, missingIds)

      setProfilesById((current) => {
        const merged = { ...current }

        for (const profile of nextProfiles) {
          merged[profile.id] = profile
        }

        return merged
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load member profiles.')
    }
  }, [])

  const refreshFolders = useCallback(async () => {
    if (!authReady || !supabase || !user) {
      return
    }

    const nextFolders = await listFolders(supabase)
    setFolders(sortFolders(nextFolders))
    setSelectedFolderId((currentId) => {
      if (currentId && nextFolders.some((folder) => folder.id === currentId)) {
        return currentId
      }

      return null
    })
  }, [authReady, user])

  useEffect(() => {
    refreshFoldersRef.current = refreshFolders
  }, [refreshFolders])

  const refreshStandaloneTasks = useCallback(async () => {
    if (!authReady || !supabase || !user) {
      return
    }

    const client = supabase

    try {
      const nextTasks = await listStandaloneTasks(client)
      const taskIds = nextTasks.map((task) => task.id)
      const sharedTaskIds = nextTasks
        .filter((task) => task.category === 'shared')
        .map((task) => task.id)
      const [nextProgress, nextActions, nextMembersByTask] = await Promise.all([
        listTaskProgressForTasks(client, taskIds),
        listTaskActionsForTasks(client, taskIds),
        Promise.all(sharedTaskIds.map((taskId) => listTaskMembers(client, taskId))),
      ])
      const nextTaskMembers = nextMembersByTask.flat()

      setStandaloneTasks(sortByPositionAndCreatedAt(nextTasks))
      setTaskMembers(sortTaskMembers(nextTaskMembers))
      setProgress((current) => replaceRowsForTasks(current, taskIds, nextProgress))
      setActions((current) => sortActions(replaceRowsForTasks(current, taskIds, nextActions)))

      void loadProfilesForIds([
        ...nextTasks.map((task) => task.owner_id),
        ...nextTasks.flatMap((task) => [task.assigned_user_id ?? '']),
        ...nextTaskMembers.map((member) => member.user_id),
        ...nextProgress.map((item) => item.user_id),
        ...nextActions.map((action) => action.user_id),
      ])
    } catch (error) {
      console.error('Standalone tasks load failed', error)
      setMessage('Unable to load standalone tasks.')
    }
  }, [authReady, loadProfilesForIds, user])

  const refreshArchive = useCallback(async () => {
    if (!authReady || !supabase || !user) {
      return
    }

    try {
      const [nextDeletedFolders, nextDeletedTasks] = await Promise.all([
        listDeletedFolders(supabase),
        listDeletedTasks(supabase),
      ])

      setDeletedFolders(sortFolders(nextDeletedFolders))
      setDeletedTasks(sortByPositionAndCreatedAt(nextDeletedTasks))
    } catch (error) {
      console.error('Archive load failed', error)
      setMessage('Unable to load deleted items.')
    }
  }, [authReady, user])

  const loadUserData = useCallback(async () => {
    if (!authReady) {
      return
    }

    if (!supabase || !user) {
      setCurrentProfile(null)
      setFolders([])
      setStandaloneTasks([])
      setTaskMembers([])
      setDeletedFolders([])
      setDeletedTasks([])
      setSelectedFolderId(null)
      return
    }

    setDataLoading(true)
    setMessage('')

    try {
      const nextProfile = await ensureProfile(supabase, user.id, null)
      setCurrentProfile(nextProfile)
      setProfileDisplayName(nextProfile.display_name ?? '')
      setProfileUsername(nextProfile.username ?? '')
      setProfilesById((current) => ({ ...current, [nextProfile.id]: nextProfile }))
      await refreshFolders()
      await Promise.all([refreshStandaloneTasks(), refreshArchive()])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load GrowT data.')
    } finally {
      setDataLoading(false)
    }
  }, [authReady, refreshArchive, refreshFolders, refreshStandaloneTasks, user])

  useEffect(() => {
    void loadUserData()
  }, [loadUserData])

  useEffect(() => {
    if (!authReady || !user) {
      return
    }

    const refreshVisibleData = () => {
      void refreshFoldersRef.current()
      void refreshLiveSessionRef.current()
      void refreshStandaloneTasks()
      void refreshArchive()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshVisibleData()
      }
    }

    window.addEventListener('focus', refreshVisibleData)
    window.addEventListener('online', refreshVisibleData)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', refreshVisibleData)
      window.removeEventListener('online', refreshVisibleData)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [authReady, refreshArchive, refreshStandaloneTasks, user])

  const refreshLiveSession = useCallback(async () => {
    if (!authReady) {
      return
    }

    if (!supabase || !activeFolder) {
      setMembers([])
      setTasks([])
      setRealtimeStatus('Idle')
      return
    }

    setDataLoading(true)
    setMessage('')

    try {
      const [nextTasks, nextMembers] = await Promise.all([
        listTasks(supabase, activeFolder.id),
        listFolderMembers(supabase, activeFolder.id),
      ])
      const taskIds = nextTasks.map((task) => task.id)
      const [nextProgress, nextActions] = await Promise.all([
        listTaskProgressForTasks(supabase, taskIds),
        listTaskActionsForTasks(supabase, taskIds),
      ])

      setTasks(sortByPositionAndCreatedAt(nextTasks))
      setMembers(nextMembers)
      setProgress((current) => replaceRowsForTasks(current, taskIds, nextProgress))
      setActions((current) => sortActions(replaceRowsForTasks(current, taskIds, nextActions)))

      void loadProfilesForIds([
        activeFolder.owner_id,
        ...nextTasks.map((task) => task.owner_id),
        ...nextTasks.flatMap((task) => [task.assigned_user_id ?? '']),
        ...nextMembers.map((member) => member.user_id),
        ...nextProgress.map((item) => item.user_id),
        ...nextActions.map((action) => action.user_id),
      ])
    } catch (error) {
      console.error('Live session load failed', error)
      setMessage('Unable to load live session.')
    } finally {
      setDataLoading(false)
    }
  }, [activeFolder, authReady, loadProfilesForIds])

  useEffect(() => {
    refreshLiveSessionRef.current = refreshLiveSession
  }, [refreshLiveSession])

  useEffect(() => {
    void refreshLiveSession()
  }, [refreshLiveSession])

  useGrowTRealtime({
    actionsRef,
    activeFolder,
    authReady,
    loadProfilesForIds,
    progressRef,
    refreshArchive,
    refreshFoldersRef,
    refreshLiveSessionRef,
    refreshStandaloneTasks,
    setActions,
    setFolders,
    setMembers,
    setNotificationCount,
    setProgress,
    setRealtimeStatus,
    setSelectedFolderId,
    setStandaloneTasks,
    setTaskMembers,
    setTasks,
    standaloneTaskIdsRef,
    taskIdsRef,
    userId: user?.id ?? null,
  })

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const username = normalizeUsername(registerUsername)
    const passwordError = getPasswordError(registerPassword, registerConfirmPassword)

    if (!supabase || !registerEmail.trim() || !username) {
      setMessage('Enter an email, username, and password.')
      return
    }

    if (passwordError) {
      setMessage(passwordError)
      return
    }

    setAuthLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail.trim(),
        password: registerPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username,
            display_name: username,
          },
        },
      })

      if (error) {
        throw error
      }

      if (data.session && data.user) {
        await ensureProfile(supabase, data.user.id, username)
        await supabase.auth.signOut()
        setSession(null)
      }

      setRegisterEmail('')
      setRegisterUsername('')
      setRegisterPassword('')
      setRegisterConfirmPassword('')
      setAuthView('login')
      setMessage('Check your email to verify your account, then log in.')
    } catch (error) {
      console.error('Registration failed', error)
      setMessage('Unable to create account. Check details and try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const identifier = loginIdentifier.trim()

    if (!supabase || !identifier || !loginPassword) {
      return
    }

    setAuthLoading(true)
    setMessage('')

    try {
      const email = identifier.includes('@')
        ? identifier
        : await resolveLoginEmail(supabase, identifier)

      if (!email) {
        throw new Error('Login identifier not found.')
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: loginPassword,
      })

      if (error) {
        throw error
      }

      setLoginPassword('')
    } catch (error) {
      console.error('Login failed', error)
      setMessage('Invalid username/email or password')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !forgotEmail.trim()) {
      return
    }

    setAuthLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: window.location.origin,
      })

      if (error) {
        throw error
      }

      setForgotEmail('')
      setAuthView('login')
      setMessage('Check your email for the password reset link.')
    } catch (error) {
      console.error('Password reset email failed', error)
      setMessage('Unable to send password reset email.')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const passwordError = getPasswordError(resetPassword, resetConfirmPassword)

    if (!supabase || passwordError) {
      setMessage(passwordError ?? 'Unable to update password.')
      return
    }

    setAuthLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: resetPassword,
      })

      if (error) {
        throw error
      }

      setResetPassword('')
      setResetConfirmPassword('')
      await supabase.auth.signOut()
      setSession(null)
      setAuthView('login')
      setMessage('Password updated. Log in with your new password.')
    } catch (error) {
      console.error('Password update failed', error)
      setMessage('Unable to update password.')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      return
    }

    await supabase.auth.signOut()
    setSession(null)
    setCurrentProfile(null)
    setFolders([])
    setMembers([])
    setTasks([])
    setStandaloneTasks([])
    setDeletedFolders([])
    setDeletedTasks([])
    setProgress([])
    setActions([])
    setSelectedFolderId(null)
    setRealtimeStatus('Idle')
  }

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !user) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const nextProfile = await updateProfile(supabase, user.id, {
        displayName: profileDisplayName.trim() || null,
        username: normalizeUsername(profileUsername),
      })

      setCurrentProfile(nextProfile)
      setProfileDisplayName(nextProfile.display_name ?? '')
      setProfileUsername(nextProfile.username ?? '')
      setProfilesById((current) => ({ ...current, [nextProfile.id]: nextProfile }))
      setMessage('Profile saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !user || !folderTitle.trim()) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const folder = await createFolder(
        supabase,
        folderTitle.trim(),
        folderDescription.trim() || null,
        folderCategory,
      )
      setFolders((current) => sortFolders(upsertById(current, folder)))
      setSelectedFolderId(folder.id)
      setFolderTitle('')
      setFolderDescription('')
      setFolderCategory('personal')
      await refreshFoldersRef.current()
    } catch (error) {
      console.error('Folder creation failed', error)
      setMessage('Unable to create folder.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateFolder(values: FolderEditValues) {
    if (!supabase || !activeFolder) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const folder = await updateFolder(supabase, {
        id: activeFolder.id,
        title: values.title,
        description: values.description,
        category: values.category,
        dueDate: values.dueDate,
        isActive: values.isActive,
      })

      setFolders((current) => sortFolders(upsertById(current, folder)))
      setIsEditingFolder(false)
      setMessage('Folder saved.')
      await refreshFoldersRef.current()
    } catch (error) {
      console.error('Folder update failed', error)
      setMessage('Unable to save folder.')
    } finally {
      setSaving(false)
    }
  }

  function requestDeleteFolder(folder: Folder) {
    setConfirmRequest({
      confirmLabel: 'Delete folder',
      message: `Delete "${folder.title}"? The folder will be hidden from normal views but kept in the database for recovery work later.`,
      onConfirm: async () => {
        if (!supabase) {
          return
        }

        try {
          await softDeleteFolder(supabase, folder.id)
          setFolders((current) => current.filter((currentFolder) => currentFolder.id !== folder.id))
          setDeletedFolders((current) =>
            sortFolders(upsertById(current, { ...folder, deleted_at: new Date().toISOString(), is_active: false })),
          )
          setSelectedFolderId((currentId) => (currentId === folder.id ? null : currentId))
          setMembers([])
          setTasks([])
          setProgress([])
          setActions([])
          setIsEditingFolder(false)
          setMessage('Folder deleted.')
          await refreshFoldersRef.current()
          await refreshArchive()
        } catch (error) {
          console.error('Folder delete failed', error)
          setMessage('Unable to delete folder.')
          throw error
        }
      },
      title: 'Delete folder',
    })
  }

  async function handleRestoreFolder(folder: Folder) {
    if (!supabase) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const restoredFolder = await restoreFolder(supabase, folder.id)
      setDeletedFolders((current) => current.filter((currentFolder) => currentFolder.id !== folder.id))
      setFolders((current) => sortFolders(upsertById(current, restoredFolder)))
      setMessage('Folder restored.')
      await Promise.all([refreshFoldersRef.current(), refreshArchive()])
    } catch (error) {
      console.error('Folder restore failed', error)
      setMessage('Unable to restore folder.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRestoreTask(task: Task) {
    if (!supabase) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const restoredTask = await restoreTask(supabase, task.id)
      setDeletedTasks((current) => current.filter((currentTask) => currentTask.id !== task.id))

      if (restoredTask.folder_id) {
        if (restoredTask.folder_id === activeFolder?.id) {
          setTasks((current) => sortByPositionAndCreatedAt(upsertById(current, restoredTask)))
        }
      } else {
        setStandaloneTasks((current) => sortByPositionAndCreatedAt(upsertById(current, restoredTask)))
      }

      setMessage('Task restored.')
      await Promise.all([refreshLiveSessionRef.current(), refreshStandaloneTasks(), refreshArchive()])
    } catch (error) {
      console.error('Task restore failed', error)
      setMessage('Unable to restore task.')
    } finally {
      setSaving(false)
    }
  }

  async function handleInviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !activeFolder || !memberUsername.trim()) {
      return
    }

    if (!isSharedFolder(activeFolder)) {
      setMessage('Convert this folder to Shared before adding members.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const { member, profile } = await addFolderMemberByUsername(
        supabase,
        activeFolder.id,
        normalizeUsername(memberUsername) ?? memberUsername.trim(),
      )

      setProfilesById((current) => ({ ...current, [profile.id]: profile }))

      if (member) {
        setMembers((current) => upsertById(current, member))
        setMessage(`${profile.display_name ?? profile.username ?? 'User'} can now open this folder.`)
      } else {
        setMessage(`${profile.display_name ?? profile.username ?? 'User'} already has access.`)
      }

      setMemberUsername('')
      await refreshLiveSessionRef.current()
    } catch (error) {
      console.error('Member invite failed', error)
      setMessage('Unable to add member.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateFolderTask(values: TaskCreateValues) {
    if (!supabase || !user || !activeFolder) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const task = await createTask(supabase, {
        folderId: activeFolder.id,
        title: values.title,
        description: values.description,
        category: values.category,
      })
      setTasks((current) => sortByPositionAndCreatedAt(upsertById(current, task)))
      await refreshLiveSessionRef.current()
    } catch (error) {
      console.error('Task creation failed', error)
      setMessage('Unable to create task.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateStandaloneTask(values: TaskCreateValues) {
    if (!supabase || !user) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const task = await createStandaloneTask(supabase, {
        title: values.title,
        description: values.description,
        category: values.category,
        assignedUserId: null,
        dueDate: null,
      })
      setStandaloneTasks((current) => sortByPositionAndCreatedAt(upsertById(current, task)))
      await refreshStandaloneTasks()
    } catch (error) {
      console.error('Standalone task creation failed', error)
      setMessage('Unable to create task.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddTaskMember(task: Task, username: string) {
    if (!supabase) {
      return
    }

    const nextUsername = normalizeUsername(username)

    if (!nextUsername) {
      setMessage('Enter a username.')
      return
    }

    if (task.folder_id || task.category !== 'shared') {
      setMessage('Change this task to Shared before adding members.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const { member, profile } = await addTaskMemberByUsername(supabase, task.id, nextUsername)
      const profileLabel = profile.display_name ?? (profile.username ? `@${profile.username}` : 'Member')

      setTaskMembers((current) => sortTaskMembers(upsertById(current, member)))
      setProfilesById((current) => ({ ...current, [profile.id]: profile }))
      setMessage(`${profileLabel} can now open this task.`)
      await refreshStandaloneTasks()
    } catch (error) {
      console.error('Task member add failed', error)
      setMessage('Unable to add member.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveTaskMember(task: Task, userId: string) {
    if (!supabase) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const removedMember = await removeTaskMember(supabase, task.id, userId)

      setTaskMembers((current) => current.filter((member) => member.id !== removedMember.id))
      setMessage(`${getProfileLabel(userId)} was removed from this task.`)
      await refreshStandaloneTasks()
    } catch (error) {
      console.error('Task member remove failed', error)
      setMessage('Unable to remove member.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateTask(taskId: string, values: TaskEditValues) {
    if (!supabase) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const task = await updateTask(supabase, {
        id: taskId,
        title: values.title,
        description: values.description,
        category: values.category,
        dueDate: values.dueDate,
        isActive: values.isActive,
        assignedUserId: values.assignedUserId,
      })

      if (task.folder_id) {
        setTasks((current) => sortByPositionAndCreatedAt(upsertById(current, task)))
      } else {
        setStandaloneTasks((current) => sortByPositionAndCreatedAt(upsertById(current, task)))
      }
      setEditingTaskId(null)
      setMessage('Task saved.')
      await Promise.all([refreshLiveSessionRef.current(), refreshStandaloneTasks()])
    } catch (error) {
      console.error('Task update failed', error)
      setMessage('Unable to save task.')
    } finally {
      setSaving(false)
    }
  }

  function requestDeleteTask(task: Task) {
    setConfirmRequest({
      confirmLabel: 'Delete task',
      message: `Delete "${task.title}"? The task will be hidden from normal views but kept in the database for recovery work later.`,
      onConfirm: async () => {
        if (!supabase) {
          return
        }

        try {
          await softDeleteTask(supabase, task.id)
          if (task.folder_id) {
            setTasks((current) => current.filter((currentTask) => currentTask.id !== task.id))
          } else {
            setStandaloneTasks((current) => current.filter((currentTask) => currentTask.id !== task.id))
          }
          setProgress((current) => current.filter((item) => item.task_id !== task.id))
          setActions((current) => current.filter((action) => action.task_id !== task.id))
          setDeletedTasks((current) => sortByPositionAndCreatedAt(upsertById(current, { ...task, deleted_at: new Date().toISOString() })))
          setEditingTaskId((currentId) => (currentId === task.id ? null : currentId))
          setMessage('Task deleted.')
          await Promise.all([refreshLiveSessionRef.current(), refreshStandaloneTasks(), refreshArchive()])
        } catch (error) {
          console.error('Task delete failed', error)
          setMessage('Unable to delete task.')
          throw error
        }
      },
      title: 'Delete task',
    })
  }

  async function handleSetTaskStatus(taskId: string, status: TaskProgressStatus) {
    if (!supabase) {
      return
    }

    const actionId = `${taskId}:${status}`
    setPendingAction(actionId)
    setMessage('')

    try {
      const action = await setTaskProgress(supabase, taskId, null, status)
      setActions((current) => sortActions(upsertById(current, action)))
      await Promise.all([refreshLiveSessionRef.current(), refreshStandaloneTasks()])
    } catch (error) {
      console.error('Task status update failed', error)
      setMessage(error instanceof Error ? error.message : 'Unable to update task status.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleConfirmDialog() {
    if (!confirmRequest) {
      return
    }

    setSaving(true)

    try {
      await confirmRequest.onConfirm()
      setConfirmRequest(null)
    } catch {
      // Action-specific handlers log the real error and set a clean message.
    } finally {
      setSaving(false)
    }
  }

  async function handleUndoTaskStatus(action: TaskStatusAction) {
    if (!supabase) {
      return
    }

    setPendingAction(`undo:${action.id}`)
    setMessage('')

    try {
      const undoneAction = await undoTaskStatusAction(supabase, action.id)
      setActions((current) => sortActions(upsertById(current, undoneAction)))
      await Promise.all([refreshLiveSessionRef.current(), refreshStandaloneTasks()])
    } catch (error) {
      console.error('Task status undo failed', error)
      setMessage('Unable to undo task status.')
    } finally {
      setPendingAction(null)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <LoadingState
        message="Copy `.env.example` to `.env.local` and restart the dev server."
        title="GrowT needs Supabase env values."
      />
    )
  }

  if (!authReady) {
    return <LoadingState message="Checking your session." title="Opening GrowT" />
  }

  if (authView === 'reset' || !session) {
    return (
      <AuthPanel
        authLoading={authLoading}
        authView={authView}
        forgotEmail={forgotEmail}
        loginIdentifier={loginIdentifier}
        loginPassword={loginPassword}
        message={message}
        onForgotEmailChange={setForgotEmail}
        onLoginIdentifierChange={setLoginIdentifier}
        onLoginPasswordChange={setLoginPassword}
        onRegisterConfirmPasswordChange={setRegisterConfirmPassword}
        onRegisterEmailChange={setRegisterEmail}
        onRegisterPasswordChange={setRegisterPassword}
        onRegisterUsernameChange={setRegisterUsername}
        onRememberMeChange={setRememberMe}
        onResetConfirmPasswordChange={setResetConfirmPassword}
        onResetPasswordChange={setResetPassword}
        onSubmitForgot={handleForgotPassword}
        onSubmitLogin={handleLogin}
        onSubmitRegister={handleRegister}
        onSubmitReset={handleResetPassword}
        onViewChange={setAuthView}
        registerConfirmPassword={registerConfirmPassword}
        registerEmail={registerEmail}
        registerPassword={registerPassword}
        registerUsername={registerUsername}
        rememberMe={rememberMe}
        resetConfirmPassword={resetConfirmPassword}
        resetPassword={resetPassword}
      />
    )
  }

  return (
    <AppShell
      accountLabel={accountLabel}
      folderCount={folders.length}
      heroTitle={activeFolder?.title ?? (folders.length ? 'Select a folder to begin.' : 'Create a folder to begin.')}
      message={message}
      notificationCount={notificationCount}
      onSignOut={() => void handleSignOut()}
      realtimeLabel={activeFolder && dataLoading ? 'Syncing' : realtimeStatus}
      sidebar={
        <Sidebar
          activeFolderId={activeFolder?.id ?? null}
          deletedFolders={deletedFolders}
          filteredFolders={filteredFolders}
          folderCategory={folderCategory}
          folderDescription={folderDescription}
          folderTitle={folderTitle}
          foldersCount={folders.length}
          isSaving={saving}
          normalizedSearchQuery={normalizedSearchQuery}
          onCreateFolder={handleCreateFolder}
          onFolderCategoryChange={setFolderCategory}
          onFolderDescriptionChange={setFolderDescription}
          onFolderTitleChange={setFolderTitle}
          onProfileDisplayNameChange={setProfileDisplayName}
          onProfileUsernameChange={setProfileUsername}
          onRestoreFolder={handleRestoreFolder}
          onSaveProfile={handleUpdateProfile}
          onSearchChange={setSearchQuery}
          onSelectFolder={setSelectedFolderId}
          profileDisplayName={profileDisplayName}
          profileUsername={profileUsername}
          searchQuery={searchQuery}
        />
      }
      taskCount={tasks.length + standaloneTasks.length}
      confirmDialog={
        confirmRequest ? (
        <ConfirmDialog
          confirmLabel={confirmRequest.confirmLabel}
          isBusy={saving}
          message={confirmRequest.message}
          onCancel={() => setConfirmRequest(null)}
          onConfirm={() => void handleConfirmDialog()}
          title={confirmRequest.title}
        />
        ) : null
      }
    >
      <StandaloneTasksPanel
        assignableMembers={standaloneAssignableMembers}
        contributionsByTask={contributionsByTask}
        currentUserId={session.user.id}
        editingTaskId={editingTaskId}
        emptyMessage={
          normalizedSearchQuery ? 'No standalone tasks match this search.' : 'Add a standalone task anytime.'
        }
        getProfileLabel={getProfileLabel}
        isSaving={saving}
        onAddTaskMember={(task, username) => void handleAddTaskMember(task, username)}
        onCloseEdit={() => setEditingTaskId(null)}
        onCreateTask={(values) => void handleCreateStandaloneTask(values)}
        onDeleteTask={requestDeleteTask}
        onEditTask={(taskId) => setEditingTaskId((currentId) => (currentId === taskId ? null : taskId))}
        onRemoveTaskMember={(task, userId) => void handleRemoveTaskMember(task, userId)}
        onSetTaskStatus={(taskId, status) => void handleSetTaskStatus(taskId, status)}
        onUndoAction={(action) => void handleUndoTaskStatus(action)}
        onUpdateTask={(taskId, values) => void handleUpdateTask(taskId, values)}
        pendingAction={pendingAction}
        taskMembersByTask={taskMembersByTask}
        tasks={filteredStandaloneTasks}
      />

      <TaskRestorePanel
        getFolderLabel={(folderId) =>
          folderId ? folders.find((folder) => folder.id === folderId)?.title ?? 'Folder task' : 'Standalone'
        }
        isSaving={saving}
        onRestore={handleRestoreTask}
        tasks={deletedTasks}
      />

      <FolderDetail
        activeFolder={activeFolder}
        assignableMembers={assignableMembers}
        canInviteMembers={canInviteMembers}
        contributionsByTask={contributionsByTask}
        currentUserId={session.user.id}
        editingTaskId={editingTaskId}
        folderCount={folders.length}
        folderMemberUserIds={folderMemberUserIds}
        getContributionCounts={getContributionCounts}
        getProfileLabel={getProfileLabel}
        isEditingFolder={isEditingFolder}
        isSaving={saving}
        isSharedFolder={activeFolderIsShared}
        memberUsername={memberUsername}
        normalizedSearchQuery={normalizedSearchQuery}
        onCancelFolderEdit={() => setIsEditingFolder(false)}
        onCloseTaskEdit={() => setEditingTaskId(null)}
        onCreateFolderTask={(values) => void handleCreateFolderTask(values)}
        onDeleteFolder={requestDeleteFolder}
        onDeleteTask={requestDeleteTask}
        onEditTask={(taskId) => setEditingTaskId((currentId) => (currentId === taskId ? null : taskId))}
        onInviteMember={handleInviteMember}
        onMemberUsernameChange={setMemberUsername}
        onSetTaskStatus={(taskId, status) => void handleSetTaskStatus(taskId, status)}
        onToggleFolderEdit={() => setIsEditingFolder((current) => !current)}
        onUndoAction={(action) => void handleUndoTaskStatus(action)}
        onUpdateFolder={(values) => void handleUpdateFolder(values)}
        onUpdateTask={(taskId, values) => void handleUpdateTask(taskId, values)}
        pendingAction={pendingAction}
        statusTotals={statusTotals}
        tasks={filteredTasks}
      />
    </AppShell>
  )
}

export default App
