import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthPanel, type AuthView } from './auth/AuthPanel'
import { ConfirmDialog } from './components/ConfirmDialog'
import { LoadingState } from './components/LoadingState'
import { IntroLoader } from './landing/IntroLoader'
import { LandingPage } from './landing/LandingPage'
import type { FolderEditValues } from './features/folders/FolderEditForm'
import {
  addFolderMemberByUsername,
  createFolder,
  listDeletedFolders,
  listFolderMembers,
  listFolders,
  reorderFolder,
  restoreFolder,
  softDeleteFolder,
  updateFolder,
} from './features/folders/folderApi'
import type { TaskCreateValues } from './features/tasks/TaskForm'
import type { TaskEditValues } from './features/tasks/TaskEditForm'
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
  reorderTask,
  removeTaskMember,
  restoreTask,
  setTaskProgress,
  softDeleteTask,
  undoLatestTaskProgress,
  updateTask,
} from './features/tasks/taskApi'
import { hardDeleteFolder, hardDeleteTask } from './lib/growtData'
import { AppShell } from './layout/AppShell'
import { Sidebar } from './layout/Sidebar'
import { AppViewRouter } from './views/AppViewRouter'
import { getRouteView, parseAppRoute, routeForView, routeToPath, routeFolderId, type AppRoute, type AppView, type AppViewNavItem } from './views/viewTypes'
import { useGrowTData } from './hooks/useGrowTData'
import { useAuthSession } from './hooks/useAuthSession'
import { useGrowTRealtime } from './hooks/useGrowTRealtime'
import {
  isSharedFolder,
  normalizeUsername,
} from './lib/growtDisplay'
import { defaultAvatarChoice, defaultColorPalette, defaultThemeMode, getAvatarSrc, isThemeMode, resolveThemeMode } from './lib/appearance'
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
  createInviteWithUser,
  type Folder,
  type FolderMember,
  type Profile,
  type ProfileSummary,
  type Task,
  type TaskMember,
  type TaskProgress,
  type TaskStatusAction,
} from './lib/growtData'
import type { FolderCategory, ReorderDirection, TaskProgressStatus, AvatarChoice, ColorPalette, ThemeMode } from './lib/database.types'

type ConfirmRequest = {
  actionLabel?: string
  confirmLabel: string
  message: string
  onConfirm: () => Promise<void>
  title: string
}

const SKIP_LANDING_STORAGE_KEY = 'growt:skipLanding'
const THEME_MODE_STORAGE_KEY = 'growt:themeMode'

const authPathByView: Record<Exclude<AuthView, 'reset'>, string> = {
  forgot: '/forgot',
  login: '/login',
  register: '/register',
}

function getStoredSkipLanding() {
  try {
    return window.localStorage.getItem(SKIP_LANDING_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function setStoredSkipLanding(value: boolean) {
  try {
    if (value) {
      window.localStorage.setItem(SKIP_LANDING_STORAGE_KEY, 'true')
      return
    }

    window.localStorage.removeItem(SKIP_LANDING_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in private or embedded browsers.
  }
}

function getStoredThemeMode(): ThemeMode {
  try {
    const storedThemeMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY)
    return isThemeMode(storedThemeMode) ? storedThemeMode : defaultThemeMode
  } catch {
    return defaultThemeMode
  }
}

function setStoredThemeMode(themeMode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode)
  } catch {
    // Storage can be unavailable in private or embedded browsers.
  }
}

function getCurrentPath() {
  return window.location.pathname.replace(/\/+$/g, '') || '/'
}

function App() {
  const { authReady, authView, session, setAuthView, setSession } = useAuthSession()
  const [introLoading, setIntroLoading] = useState(true)
  const [shouldSkipLanding, setShouldSkipLanding] = useState(getStoredSkipLanding)
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
  const [profileAvatarChoice, setProfileAvatarChoice] = useState<AvatarChoice>(defaultAvatarChoice)
  const [profileThemeMode, setProfileThemeMode] = useState<ThemeMode>(getStoredThemeMode)
  const [profileColorPalette, setProfileColorPalette] = useState<ColorPalette>(defaultColorPalette)
  const [profilesById, setProfilesById] = useState<Record<string, ProfileSummary>>({})
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
  const [publicPath, setPublicPath] = useState(getCurrentPath)
  const [route, setRoute] = useState<AppRoute>(() => parseAppRoute(window.location.pathname))
  const [activeView, setActiveView] = useState<AppView>(() => getRouteView(parseAppRoute(window.location.pathname)))
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState('Idle')

  const user = session?.user ?? null
  const sessionKey = session?.access_token ?? null
  const activeSessionKeyRef = useRef<string | null>(null)
  const previousUserIdRef = useRef<string | null>(null)
  const profilesByIdRef = useRef<Record<string, ProfileSummary>>({})
  const taskIdsRef = useRef<Set<string>>(new Set())
  const standaloneTaskIdsRef = useRef<Set<string>>(new Set())
  const progressRef = useRef<TaskProgress[]>([])
  const actionsRef = useRef<TaskStatusAction[]>([])
  const refreshFoldersRef = useRef<() => Promise<void>>(async () => undefined)
  const refreshLiveSessionRef = useRef<() => Promise<void>>(async () => undefined)

  const navigateToAuthView = useCallback((view: AuthView, mode: 'push' | 'replace' = 'push') => {
    setAuthView(view)
    setMessage('')

    if (view === 'reset') {
      return
    }

    const method = mode === 'replace' ? 'replaceState' : 'pushState'
    const nextPath = authPathByView[view]
    window.history[method]({}, '', nextPath)
    setPublicPath(nextPath)
  }, [setAuthView])

  const navigateToDashboard = useCallback(() => {
    const dashboardRoute: AppRoute = { name: 'dashboard' }
    setRoute(dashboardRoute)
    setActiveView('dashboard')
    const dashboardPath = routeToPath(dashboardRoute)
    window.history.replaceState({}, '', dashboardPath)
    setPublicPath(dashboardPath)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroLoading(false), 1200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const applyTheme = () => {
      const resolvedThemeMode = resolveThemeMode(profileThemeMode)

      root.classList.toggle('dark', resolvedThemeMode === 'dark')
      root.setAttribute('data-theme', resolvedThemeMode)
      root.setAttribute('data-theme-preference', profileThemeMode)
      root.setAttribute('data-palette', profileColorPalette)
    }

    applyTheme()
    setStoredThemeMode(profileThemeMode)

    if (profileThemeMode !== 'system' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => applyTheme()

    if (typeof systemTheme.addEventListener === 'function') {
      systemTheme.addEventListener('change', handleSystemThemeChange)
      return () => systemTheme.removeEventListener('change', handleSystemThemeChange)
    }

    systemTheme.addListener(handleSystemThemeChange)
    return () => systemTheme.removeListener(handleSystemThemeChange)
  }, [profileThemeMode, profileColorPalette])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  useEffect(() => {
    const handlePopState = () => {
      setPublicPath(getCurrentPath())
      const newRoute = parseAppRoute(window.location.pathname)
      setRoute(newRoute)
      setActiveView(getRouteView(newRoute))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!authReady || session || authView === 'reset') {
      return
    }

    const syncAuthPath = () => {
      const pathname = getCurrentPath()
      const viewByPath: Partial<Record<string, AuthView>> = {
        '/forgot': 'forgot',
        '/login': 'login',
        '/register': 'register',
      }
      const nextView = viewByPath[pathname]

      if (nextView && nextView !== authView) {
        setPublicPath(pathname)
        setAuthView(nextView)
        return
      }

      if (pathname === '/' && shouldSkipLanding) {
        navigateToAuthView('login', 'replace')
      }
    }

    syncAuthPath()
    window.addEventListener('popstate', syncAuthPath)
    return () => window.removeEventListener('popstate', syncAuthPath)
  }, [authReady, authView, navigateToAuthView, session, setAuthView, shouldSkipLanding])

  useEffect(() => {
    if (!authReady || !session) {
      return
    }

    const pathname = getCurrentPath()
    if (pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/forgot') {
      navigateToDashboard()
    }
  }, [authReady, navigateToDashboard, session])

  useEffect(() => {
    const folderId = routeFolderId(route)
    if (folderId !== selectedFolderId) {
      setSelectedFolderId(folderId)
    }
  }, [route, selectedFolderId])

  const {
    accountLabel,
    activeFolder,
    assignableMembers,
    contributionsByTask,
    filteredFolders,
    filteredStandaloneTasks,
    filteredTasks,
    folderMemberUserIds,
    getContributionCounts,
    getProfileAvatar,
    getProfileLabel,
    normalizedSearchQuery,
    standaloneAssignableMembers,
    statusTotals,
    statusHistoryByTask,
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

  const sharedFolders = useMemo(
    () => filteredFolders.filter((folder) => isSharedFolder(folder)),
    [filteredFolders],
  )
  const sharedStandaloneTasks = useMemo(
    () => filteredStandaloneTasks.filter((task) => task.category === 'shared'),
    [filteredStandaloneTasks],
  )
  const deletedItemsCount = deletedFolders.length + deletedTasks.length
  const appViewItems = useMemo<AppViewNavItem[]>(
    () => [
      {
        description: 'Summary',
        id: 'dashboard',
        label: 'Dashboard',
        meta: realtimeStatus,
      },
      {
        description: 'Your workspaces',
        id: 'folders',
        label: 'Folders',
        meta: String(folders.length),
      },
      {
        description: 'Personal + shared',
        id: 'tasks',
        label: 'My Tasks',
        meta: String(standaloneTasks.length),
      },
      {
        description: 'Requests + people',
        id: 'acquaintances',
        label: 'Acquaintances',
      },
      {
        description: 'Realtime inbox',
        id: 'notifications',
        label: 'Notifications',
      },
      {
        description: 'Deleted items',
        id: 'restore',
        label: 'Restore',
        meta: String(deletedItemsCount),
      },
      {
        description: 'Profile',
        id: 'settings',
        label: 'Settings',
      },
    ],
    [
      deletedItemsCount,
      folders.length,
      realtimeStatus,
      standaloneTasks.length,
    ],
  )


  const navigateToRoute = useCallback((newRoute: AppRoute) => {
    const nextPath = routeToPath(newRoute)
    setRoute(newRoute)
    setActiveView(getRouteView(newRoute))
    window.history.pushState({}, '', nextPath)
    setPublicPath(nextPath)
  }, [])

  const navigateToView = useCallback((view: AppView) => {
    navigateToRoute(routeForView(view))
  }, [navigateToRoute])

  const findKnownTask = useCallback((taskId: string) => {
    return tasks.find((t) => t.id === taskId) ?? standaloneTasks.find((t) => t.id === taskId)
  }, [standaloneTasks, tasks])

  const addFolderPage = useCallback(() => navigateToRoute({ name: 'folder-new' }), [navigateToRoute])
  const editFolderPage = useCallback((folderId: string) => navigateToRoute({ name: 'folder-edit', folderId }), [navigateToRoute])
  const addTaskPage = useCallback((folderId?: string) => navigateToRoute({ name: 'task-new', folderId }), [navigateToRoute])
  const editTaskPage = useCallback((taskId: string) => {
    const task = findKnownTask(taskId)
    navigateToRoute({ name: 'task-edit', taskId, folderId: task?.folder_id || undefined })
  }, [findKnownTask, navigateToRoute])

  useEffect(() => {
    if (!authReady) {
      return
    }

    const nextUserId = user?.id ?? null
    const previousUserId = previousUserIdRef.current

    if (previousUserId && !nextUserId) {
      activeSessionKeyRef.current = null
      setMessage('')
      setCurrentProfile(null)
      setFolders([])
      setMembers([])
      setTasks([])
      setStandaloneTasks([])
      setTaskMembers([])
      setDeletedFolders([])
      setDeletedTasks([])
      setProgress([])
      setActions([])
      setSelectedFolderId(null)
      setConfirmRequest(null)
      setDataLoading(false)
      setSaving(false)
      setPendingAction(null)
      setRealtimeStatus('Idle')
    }

    previousUserIdRef.current = nextUserId
  }, [authReady, user?.id])

  useEffect(() => {
    activeSessionKeyRef.current = sessionKey
  }, [sessionKey])

  const isCurrentSession = useCallback((requestSessionKey: string | null) => {
    return Boolean(requestSessionKey && activeSessionKeyRef.current === requestSessionKey)
  }, [])

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
    if (!supabase || !sessionKey) {
      return
    }

    const requestSessionKey = sessionKey
    const missingIds = Array.from(new Set(userIds))
      .filter(Boolean)
      .filter((userId) => !profilesByIdRef.current[userId])

    if (!missingIds.length) {
      return
    }

    try {
      const nextProfiles = await listProfiles(supabase, missingIds)

      if (!isCurrentSession(requestSessionKey)) {
        return
      }

      setProfilesById((current) => {
        const merged = { ...current }

        for (const profile of nextProfiles) {
          merged[profile.id] = profile
        }

        return merged
      })
    } catch (error) {
      if (isCurrentSession(requestSessionKey)) {
        setMessage(error instanceof Error ? error.message : 'Unable to load member profiles.')
      }
    }
  }, [isCurrentSession, sessionKey])

  const refreshFolders = useCallback(async () => {
    if (!authReady || !supabase || !user || !sessionKey) {
      return
    }

    const requestSessionKey = sessionKey

    try {
      const nextFolders = await listFolders(supabase)

      if (!isCurrentSession(requestSessionKey)) {
        return
      }

      setFolders(sortFolders(nextFolders))
      setSelectedFolderId((currentId) => {
        if (currentId && nextFolders.some((folder) => folder.id === currentId)) {
          return currentId
        }

        return null
      })
    } catch (error) {
      if (isCurrentSession(requestSessionKey)) {
        throw error
      }
    }
  }, [authReady, isCurrentSession, sessionKey, user])

  useEffect(() => {
    refreshFoldersRef.current = refreshFolders
  }, [refreshFolders])

  const refreshStandaloneTasks = useCallback(async () => {
    if (!authReady || !supabase || !user || !sessionKey) {
      return
    }

    const client = supabase
    const requestSessionKey = sessionKey

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

      if (!isCurrentSession(requestSessionKey)) {
        return
      }

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
      if (isCurrentSession(requestSessionKey)) {
        setMessage('Unable to load standalone tasks.')
      }
    }
  }, [authReady, isCurrentSession, loadProfilesForIds, sessionKey, user])

  const refreshArchive = useCallback(async () => {
    if (!authReady || !supabase || !user || !sessionKey) {
      return
    }

    const requestSessionKey = sessionKey

    try {
      const [nextDeletedFolders, nextDeletedTasks] = await Promise.all([
        listDeletedFolders(supabase),
        listDeletedTasks(supabase),
      ])

      if (!isCurrentSession(requestSessionKey)) {
        return
      }

      setDeletedFolders(sortFolders(nextDeletedFolders))
      setDeletedTasks(sortByPositionAndCreatedAt(nextDeletedTasks))
    } catch (error) {
      console.error('Archive load failed', error)
      if (isCurrentSession(requestSessionKey)) {
        setMessage('Unable to load deleted items.')
      }
    }
  }, [authReady, isCurrentSession, sessionKey, user])

  const loadUserData = useCallback(async () => {
    if (!authReady) {
      return
    }

    if (!supabase || !user || !sessionKey) {
      setCurrentProfile(null)
      setFolders([])
      setStandaloneTasks([])
      setTaskMembers([])
      setDeletedFolders([])
      setDeletedTasks([])
      setSelectedFolderId(null)
      return
    }

    const requestSessionKey = sessionKey

    setDataLoading(true)
    setMessage('')

    try {
      const meta = user.user_metadata || {}
      const fallbackDisplayName = meta.display_name || meta.full_name || meta.name || user.email?.split('@')[0] || 'User'
      const fallbackUsername = meta.username || user.email?.split('@')[0] || 'user'
      const nextProfile = await ensureProfile(supabase, user.id, fallbackDisplayName, fallbackUsername)

      if (!isCurrentSession(requestSessionKey)) {
        return
      }

      setCurrentProfile(nextProfile)
      setProfileDisplayName(nextProfile.display_name ?? '')
      setProfileUsername(nextProfile.username ?? '')
      setProfileAvatarChoice(nextProfile.avatar_choice ?? defaultAvatarChoice)
      setProfileThemeMode(nextProfile.theme_mode ?? defaultThemeMode)
      setProfileColorPalette(nextProfile.color_palette ?? defaultColorPalette)
      setProfilesById((current) => ({ ...current, [nextProfile.id]: nextProfile }))
      await refreshFolders()

      if (!isCurrentSession(requestSessionKey)) {
        return
      }

      await Promise.all([refreshStandaloneTasks(), refreshArchive()])
    } catch (error) {
      if (isCurrentSession(requestSessionKey)) {
        setMessage(error instanceof Error ? error.message : 'Unable to load GrowT data.')
      }
    } finally {
      if (isCurrentSession(requestSessionKey)) {
        setDataLoading(false)
      }
    }
  }, [authReady, isCurrentSession, refreshArchive, refreshFolders, refreshStandaloneTasks, sessionKey, user])

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

    if (!supabase || !sessionKey) {
      setMembers([])
      setTasks([])
      setRealtimeStatus('Idle')
      return
    }

    const requestSessionKey = sessionKey

    setDataLoading(true)
    setMessage('')

    try {
      let nextTasks;
      let nextMembers: FolderMember[] = [];
      
      if (activeFolder) {
        [nextTasks, nextMembers] = await Promise.all([
          listTasks(supabase, activeFolder.id),
          listFolderMembers(supabase, activeFolder.id),
        ])
      } else {
        const { data: folderData } = await supabase
          .from('folders')
          .select('id')
          .eq('is_active', true)
          .is('deleted_at', null);
        const activeFolderIds = new Set((folderData || []).map((f) => f.id));
        const { data } = await supabase.from('tasks').select('*').not('folder_id', 'is', null);
        nextTasks = (data || []).filter((task) => task.folder_id && activeFolderIds.has(task.folder_id));
      }
      const taskIds = nextTasks.map((task) => task.id)
      const [nextProgress, nextActions] = await Promise.all([
        listTaskProgressForTasks(supabase, taskIds),
        listTaskActionsForTasks(supabase, taskIds),
      ])

      if (!isCurrentSession(requestSessionKey)) {
        return
      }

      setTasks(sortByPositionAndCreatedAt(nextTasks))
      setMembers(nextMembers)
      setProgress((current) => replaceRowsForTasks(current, taskIds, nextProgress))
      setActions((current) => sortActions(replaceRowsForTasks(current, taskIds, nextActions)))

      void loadProfilesForIds([
        ...(activeFolder ? [activeFolder.owner_id] : []),
        ...nextTasks.map((task) => task.owner_id),
        ...nextTasks.flatMap((task) => [task.assigned_user_id ?? '']),
        ...nextMembers.map((member) => member.user_id),
        ...nextProgress.map((item) => item.user_id),
        ...nextActions.map((action) => action.user_id),
      ])
    } catch (error) {
      console.error('Live session load failed', error)
      if (isCurrentSession(requestSessionKey)) {
        setMessage('Unable to load live session.')
      }
    } finally {
      if (isCurrentSession(requestSessionKey)) {
        setDataLoading(false)
      }
    }
  }, [activeFolder, authReady, isCurrentSession, loadProfilesForIds, sessionKey])

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
    setProfilesById,
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
        await ensureProfile(supabase, data.user.id, username, username)
        await supabase.auth.signOut()
        setSession(null)
      }

      setRegisterEmail('')
      setRegisterUsername('')
      setRegisterPassword('')
      setRegisterConfirmPassword('')
      navigateToAuthView('login', 'replace')
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

      setStoredSkipLanding(rememberMe)
      setShouldSkipLanding(rememberMe)
      setLoginPassword('')
      navigateToDashboard()
    } catch (error) {
      console.error('Login failed', error)
      setMessage('Invalid username/email or password')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleGoogleLogin() {
    if (!supabase) return

    setAuthLoading(true)
    setMessage('')

    try {
      const shouldRememberGoogleLogin = authView === 'login' && rememberMe
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        throw error
      }

      setStoredSkipLanding(shouldRememberGoogleLogin)
      setShouldSkipLanding(shouldRememberGoogleLogin)
    } catch (error) {
      console.error('Google login failed', error)
      setMessage('Unable to sign in with Google.')
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
      navigateToAuthView('login', 'replace')
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
      navigateToAuthView('login', 'replace')
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

    activeSessionKeyRef.current = null
    await supabase.auth.signOut()
    setSession(null)
    setMessage('')
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
    setConfirmRequest(null)
    setDataLoading(false)
    setSaving(false)
    setPendingAction(null)
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
        avatarChoice: profileAvatarChoice,
        colorPalette: profileColorPalette,
        displayName: profileDisplayName.trim() || null,
        themeMode: profileThemeMode,
        username: normalizeUsername(profileUsername),
      })

      setCurrentProfile(nextProfile)
      setProfileDisplayName(nextProfile.display_name ?? '')
      setProfileUsername(nextProfile.username ?? '')
      setProfileAvatarChoice(nextProfile.avatar_choice ?? defaultAvatarChoice)
      setProfileThemeMode(nextProfile.theme_mode ?? defaultThemeMode)
      setProfileColorPalette(nextProfile.color_palette ?? defaultColorPalette)
      setProfilesById((current) => ({ ...current, [nextProfile.id]: nextProfile }))
      setMessage('Profile saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateFolder(event: React.FormEvent, inviteUsernames?: string[]) {
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

      if (inviteUsernames && inviteUsernames.length > 0) {
        for (const username of inviteUsernames) {
          try {
            await addFolderMemberByUsername(
              supabase,
              folder.id,
              normalizeUsername(username) ?? username.trim()
            )
          } catch (e) {
            console.error(`Failed to invite user ${username}`, e)
          }
        }
      }

      await refreshFoldersRef.current()
      if (route.name === 'folder-new') {
        navigateToRoute({ name: 'folder-detail', folderId: folder.id })
      }
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
      setMessage('Folder saved.')
      await refreshFoldersRef.current()
      if (route.name === 'folder-edit') {
        navigateToRoute({ name: 'folder-detail', folderId: folder.id })
      }
    } catch (error) {
      console.error('Folder update failed', error)
      setMessage('Unable to save folder.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCopyShareLink(resourceType: 'folder' | 'task', resourceId: string) {
    if (!supabase || !user) return

    try {
      setSaving(true)
      const invite = await createInviteWithUser(supabase, resourceType, resourceId, user.id)
      const inviteUrl = `${window.location.origin}/invite/${invite.id}`
      await navigator.clipboard.writeText(inviteUrl)
      setMessage('Share link copied to clipboard!')
    } catch (error) {
      console.error('Failed to create share link', error)
      setMessage('Unable to create share link. Please try again.')
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

  async function handleMoveFolder(folder: Folder, direction: ReorderDirection, scopedFolderIds?: string[]) {
    if (!supabase) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const nextFolders = await reorderFolder(supabase, folder.id, direction, scopedFolderIds)
      setFolders(sortFolders(nextFolders))
      setMessage(`Folder moved ${direction}.`)
      await refreshFoldersRef.current()
    } catch (error) {
      console.error('Folder reorder failed', error)
      setMessage('Unable to reorder folder.')
    } finally {
      setSaving(false)
    }
  }

  async function handleHardDeleteFolder(folder: Folder) {
    const client = supabase
    if (!client) {
      return
    }
    
    setConfirmRequest({
      actionLabel: 'Delete Forever',
      confirmLabel: 'Delete Forever',
      message: `Are you sure you want to permanently delete "${folder.title}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await hardDeleteFolder(client, folder.id)
          setDeletedFolders((current) => current.filter((f) => f.id !== folder.id))
          await refreshFolders()
          await refreshArchive()
          setMessage(`"${folder.title}" was permanently deleted.`)
        } catch (error) {
  console.error('Failed to permanently delete folder', error)

  if (
    error instanceof Error &&
    error.message.includes('Only the folder owner')
  ) {
    setMessage('Only the folder owner can permanently delete this folder.')
    return
  }

  setMessage('Unable to permanently delete folder.')
}
      },
      title: 'Permanently delete folder?',
    })
  }

  async function handleHardDeleteTask(task: Task) {
    const client = supabase
    if (!client) {
      return
    }
    
    setConfirmRequest({
      actionLabel: 'Delete Forever',
      confirmLabel: 'Delete Forever',
      message: `Are you sure you want to permanently delete "${task.title}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await hardDeleteTask(client, task.id)
          setDeletedTasks((current) => current.filter((t) => t.id !== task.id))
          await refreshStandaloneTasks()
          if (activeFolder) {
            await refreshLiveSessionRef.current()
          }
          await refreshArchive()
          setMessage(`"${task.title}" was permanently deleted.`)
        } catch (error) {
  console.error('Failed to permanently delete task', error)

  if (error instanceof Error && error.message === 'TASK_DELETE_NOT_ALLOWED_OR_NOT_FOUND') {
    setMessage('Only the task owner or folder owner can permanently delete this task.')
    return
  }

  setMessage('Unable to permanently delete task.')
}
      },
      title: 'Permanently delete task?',
    })
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
        const restoringCurrentFolderTask = restoredTask.folder_id === activeFolder?.id

        setSelectedFolderId(restoredTask.folder_id)

        if (restoringCurrentFolderTask) {
          setTasks((current) => sortByPositionAndCreatedAt(upsertById(current, restoredTask)))
        } else {
          setTasks([restoredTask])
        }
      } else {
        setStandaloneTasks((current) => sortByPositionAndCreatedAt(upsertById(current, restoredTask)))
      }

      setMessage('Task restored.')
      await Promise.all([
        restoredTask.folder_id === activeFolder?.id ? refreshLiveSessionRef.current() : refreshFoldersRef.current(),
        refreshStandaloneTasks(),
        refreshArchive(),
      ])
    } catch (error) {
      console.error('Task restore failed', error)
      setMessage('Unable to restore task.')
    } finally {
      setSaving(false)
    }
  }

  async function handleMoveTask(task: Task, direction: ReorderDirection, scopedTaskIds?: string[]) {
    if (!supabase) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const nextTasks = await reorderTask(supabase, task.id, direction, scopedTaskIds)

      if (task.folder_id) {
        setTasks(sortByPositionAndCreatedAt(nextTasks))
        await refreshLiveSessionRef.current()
      } else {
        setStandaloneTasks(sortByPositionAndCreatedAt(nextTasks))
        await refreshStandaloneTasks()
      }

      setMessage(`Task moved ${direction}.`)
    } catch (error) {
      console.error('Task reorder failed', error)
      setMessage('Unable to reorder task.')
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

    const nextUsername = normalizeUsername(memberUsername) ?? memberUsername.trim()
    const existingFolderMember = folderMemberUserIds.some((memberId) => {
      const profile = profilesByIdRef.current[memberId]
      return normalizeUsername(profile?.username ?? '') === normalizeUsername(nextUsername)
    })

    if (existingFolderMember) {
      setMessage('That collaborator already has access to this folder.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const { member, profile } = await addFolderMemberByUsername(
        supabase,
        activeFolder.id,
        nextUsername,
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

      if (values.inviteUsernames && values.inviteUsernames.length > 0) {
        for (const username of values.inviteUsernames) {
          try {
            await addTaskMemberByUsername(
              supabase,
              task.id,
              normalizeUsername(username) ?? username.trim()
            )
          } catch (e) {
            console.error(`Failed to invite user ${username} to task`, e)
          }
        }
      }

      setTasks((current) => sortByPositionAndCreatedAt(upsertById(current, task)))
      await refreshLiveSessionRef.current()
      if (route.name === 'task-new') {
        navigateToRoute({ name: 'folder-detail', folderId: activeFolder.id })
      }
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

      if (values.inviteUsernames && values.inviteUsernames.length > 0) {
        for (const username of values.inviteUsernames) {
          try {
            await addTaskMemberByUsername(
              supabase,
              task.id,
              normalizeUsername(username) ?? username.trim()
            )
          } catch (e) {
            console.error(`Failed to invite user ${username} to standalone task`, e)
          }
        }
      }

      setStandaloneTasks((current) => sortByPositionAndCreatedAt(upsertById(current, task)))
      await refreshStandaloneTasks()
      if (route.name === 'task-new') {
        navigateToRoute({ name: 'tasks' })
      }
    } catch (error) {
      console.error('Standalone task creation failed', error)
      setMessage('Unable to create task.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddTaskMember(task: Task, username: string) {
    if (!supabase) {
      throw new Error('Supabase is not configured.')
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

    const existingTaskMemberIds = new Set([
      task.owner_id,
      ...(taskMembersByTask.get(task.id)?.map((member) => member.user_id) ?? []),
    ])
    const existingTaskMember = Array.from(existingTaskMemberIds).some((memberId) => {
      const profile = profilesByIdRef.current[memberId]
      return normalizeUsername(profile?.username ?? '') === nextUsername
    })

    if (existingTaskMember) {
      setMessage('That collaborator already has access to this task.')
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
      throw error
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
      if (route.name === 'task-edit') {
        navigateToRoute(task.folder_id ? { name: 'folder-detail', folderId: task.folder_id } : { name: 'tasks' })
      }
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
      const undoneAction = await undoLatestTaskProgress(supabase, action.task_id, action.task_level_id)
      setActions((current) => sortActions(upsertById(current, undoneAction)))
      await Promise.all([refreshLiveSessionRef.current(), refreshStandaloneTasks()])
    } catch (error) {
      console.error('Task status undo failed', error)
      setMessage('Unable to undo task status.')
    } finally {
      setPendingAction(null)
    }
  }

  if (introLoading) {
    return <IntroLoader />
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

  const authPanel = (
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
      onViewChange={navigateToAuthView}
      onContinueWithGoogle={handleGoogleLogin}
      registerConfirmPassword={registerConfirmPassword}
      registerEmail={registerEmail}
      registerPassword={registerPassword}
      registerUsername={registerUsername}
      rememberMe={rememberMe}
      resetConfirmPassword={resetConfirmPassword}
      resetPassword={resetPassword}
    />
  )

  if (authView === 'reset') {
    return authPanel
  }

  if (!session) {
    if (publicPath === '/' && !shouldSkipLanding) {
      return (
        <LandingPage
          onLogin={() => navigateToAuthView('login')}
          onRegister={() => navigateToAuthView('register')}
        />
      )
    }

    return authPanel
  }

  const userId = session.user.id
  
  let contextLabel = appViewItems.find((v) => v.id === activeView)?.label
  if (route.name === 'folder-detail' || route.name === 'folder-edit') {
    contextLabel = activeFolder?.title || 'Workspace'
  } else if (route.name === 'folder-new') {
    contextLabel = 'New Workspace'
  } else if (route.name === 'task-detail' || route.name === 'task-edit') {
    contextLabel = 'Task Details'
  } else if (route.name === 'task-new') {
    contextLabel = 'New Task'
  }

  const accountAvatarUrl = currentProfile?.avatar_url?.trim() || getAvatarSrc(profileAvatarChoice)

  return (
    <AppShell
      accountLabel={accountLabel}
      accountAvatarUrl={accountAvatarUrl}
      contextLabel={contextLabel}
      message={message}
      folders={folders}
      tasks={filteredTasks}
      onOpenFolder={(folderId) => navigateToRoute({ name: 'folder-detail', folderId })}
      onSearchChange={setSearchQuery}
      onNavigate={navigateToView}
      onSignOut={() => void handleSignOut()}
      searchQuery={searchQuery}
      userId={userId}
      sidebar={
        <Sidebar
          activeView={activeView}
          onViewChange={navigateToView}
          viewItems={appViewItems}
        />
      }
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
      <AppViewRouter
        activeFolder={activeFolder}
        activeView={activeView}
        assignableMembers={assignableMembers}
        contributionsByTask={contributionsByTask}
        currentUserId={userId}
        dataLoading={dataLoading}
        deletedFolders={deletedFolders}
        deletedTasks={deletedTasks}
        editingTaskId={editingTaskId}
        filteredTasks={filteredTasks}
        folderCategory={folderCategory}
        folderDescription={folderDescription}
        folderMemberUserIds={folderMemberUserIds}
        folderTitle={folderTitle}
        folders={folders}
        getContributionCounts={getContributionCounts}
        getProfileAvatar={getProfileAvatar}
        getProfileLabel={getProfileLabel}
        hasUnsavedChanges={
          profileDisplayName !== (currentProfile?.display_name ?? '') ||
          profileUsername !== (currentProfile?.username ?? '') ||
          profileAvatarChoice !== (currentProfile?.avatar_choice ?? defaultAvatarChoice) ||
          profileThemeMode !== (currentProfile?.theme_mode ?? defaultThemeMode) ||
          profileColorPalette !== (currentProfile?.color_palette ?? defaultColorPalette)
        }
        isSaving={saving}
        memberUsername={memberUsername}
        normalizedSearchQuery={normalizedSearchQuery}
        onAddFolder={addFolderPage}
        onAddTask={addTaskPage}
        onAddTaskMember={(task, username) => void handleAddTaskMember(task, username)}
        onCloseTaskEdit={() => setEditingTaskId(null)}
        onCopyShareLink={(type, id) => void handleCopyShareLink(type, id)}
        onCreateFolder={handleCreateFolder}
        onCreateFolderTask={(values) => void handleCreateFolderTask(values)}
        onCreateStandaloneTask={(values) => void handleCreateStandaloneTask(values)}
        onDeleteFolder={requestDeleteFolder}
        onDeleteTask={requestDeleteTask}
        onEditFolder={editFolderPage}
        onEditTask={editTaskPage}
        onFolderCategoryChange={setFolderCategory}
        onFolderDescriptionChange={setFolderDescription}
        onFolderTitleChange={setFolderTitle}
        onHardDeleteFolder={handleHardDeleteFolder}
        onHardDeleteTask={handleHardDeleteTask}
        onInviteMember={handleInviteMember}
        onMemberUsernameChange={setMemberUsername}
        onMoveFolder={(folder, direction, scopedFolderIds) => void handleMoveFolder(folder, direction, scopedFolderIds)}
        onMoveTask={(task, direction, scopedTaskIds) => void handleMoveTask(task, direction, scopedTaskIds)}
        onNavigate={navigateToView}
        onOpenFolder={(folderId) => navigateToRoute({ name: 'folder-detail', folderId })}
        onOpenTask={(task) => navigateToRoute({ name: 'task-detail', taskId: task.id, folderId: task.folder_id || undefined })}
        onProfileAvatarChoiceChange={setProfileAvatarChoice}
        onProfileColorPaletteChange={setProfileColorPalette}
        onProfileDisplayNameChange={setProfileDisplayName}
        onProfileThemeModeChange={setProfileThemeMode}
        onProfileUsernameChange={setProfileUsername}
        onRemoveTaskMember={(task, memberId) => void handleRemoveTaskMember(task, memberId)}
        onRestoreFolder={handleRestoreFolder}
        onRestoreTask={handleRestoreTask}
        onSaveProfile={handleUpdateProfile}
        onSelectFolder={setSelectedFolderId}
        onSetTaskStatus={(taskId, status) => void handleSetTaskStatus(taskId, status)}
        onUndoAction={(action) => void handleUndoTaskStatus(action)}
        onUpdateFolder={(values) => void handleUpdateFolder(values)}
        onUpdateTask={(taskId, values) => void handleUpdateTask(taskId, values)}
        pendingAction={pendingAction}
        profileAvatarChoice={profileAvatarChoice}
        profileColorPalette={profileColorPalette}
        profileDisplayName={profileDisplayName}
        profileThemeMode={profileThemeMode}
        profileUsername={profileUsername}
        realtimeLabel={realtimeStatus}
        route={route}
        sharedFolders={sharedFolders}
        sharedStandaloneTasks={sharedStandaloneTasks}
        standaloneAssignableMembers={standaloneAssignableMembers}
        standaloneTasks={standaloneTasks}
        statusTotals={statusTotals}
        statusHistoryByTask={statusHistoryByTask}
        taskMembersByTask={taskMembersByTask}
        tasks={tasks}
      />
    </AppShell>
  )
}

export default App
