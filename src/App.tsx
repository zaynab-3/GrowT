import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { AuthPanel, type AuthView } from './auth/AuthPanel'
import { ConfirmDialog } from './components/ConfirmDialog'
import { LoadingState } from './components/LoadingState'
import { IntroLoader } from './landing/IntroLoader'
import { LandingPage } from './landing/LandingPage'
import type { FolderEditValues } from './features/folders/FolderEditForm'
import {
  addFolderMemberByUsername,
  createFolder,
  hardDeleteFolder,
  listDeletedFolders,
  listFolderMembers,
  listFolders,
  removeFolderMember,
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
  hardDeleteTask,
  listDeletedTasks,
  listStandaloneTasks,
  listTaskActionsForTasks,
  listTaskLevelsForTasks,
  listTaskMembers,
  listTaskProgressForTasks,
  listTasks,
  reorderTask,
  removeTaskMember,
  restoreTask,
  setTaskExported,
  setTaskProgress,
  softDeleteTask,
  syncTaskLevels,
  undoLatestTaskProgress,
  undoTaskStatusAction,
  updateTask,
} from './features/tasks/taskApi'
import {
  searchProfilesWithRelationship,
  sendAcquaintanceRequest,
} from './features/members/memberPickerApi'
import { AppShell } from './layout/AppShell'
import { Sidebar } from './layout/Sidebar'
import { AppViewRouter } from './views/AppViewRouter'
import { PublicTaskSharePage } from './views/PublicTaskSharePage'
import { getRouteView, parseAppRoute, routeForView, routeToPath, routeFolderId, type AppRoute, type AppView, type AppViewNavItem } from './views/viewTypes'
import { useGrowTData } from './hooks/useGrowTData'
import { useAuthSession } from './hooks/useAuthSession'
import { useGrowTRealtime } from './hooks/useGrowTRealtime'
import {
  isSharedFolder,
  normalizeUsername,
} from './lib/growtDisplay'
import { parseRecipientAmount } from './lib/recipient'
import { defaultAvatarChoice, defaultColorPalette, defaultThemeMode, getAvatarSrc, isThemeMode, resolveThemeMode } from './lib/appearance'
import {
  getPasswordError,
  replaceRowsForTasks,
  sortActions,
  sortByPositionAndCreatedAt,
  sortFolders,
  sortStandaloneTasks,
  sortTaskMembers,
  upsertById,
} from './lib/growtState'
import { listTasksInActiveFolders } from './services/activeTaskService'
import * as authService from './services/authService'
import { isSupabaseConfigured } from './services/clientService'
import { createInviteWithUser } from './services/inviteService'
import {
  ensureProfile,
  listProfiles,
  resolveLoginEmail,
  updateProfile,
} from './services/profileService'
import type {
  Folder,
  FolderMember,
  Profile,
  ProfileSummary,
  Task,
  TaskLevel,
  TaskMember,
  TaskProgress,
  TaskStatusAction,
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
const PENDING_INVITE_PATH_KEY = 'growt:pendingInvitePath'

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

function getPendingInvitePath() {
  try {
    const path = window.sessionStorage.getItem(PENDING_INVITE_PATH_KEY)
    return path && /^\/invite\/[^/]+$/.test(path) ? path : null
  } catch {
    return null
  }
}

function setPendingInvitePath(path: string | null) {
  try {
    if (path) {
      window.sessionStorage.setItem(PENDING_INVITE_PATH_KEY, path)
      return
    }

    window.sessionStorage.removeItem(PENDING_INVITE_PATH_KEY)
  } catch {
    // Keep authentication usable when session storage is unavailable.
  }
}

function runViewTransition(update: () => void) {
  const transitionDocument = document as Document & {
    startViewTransition?: (callback: () => void) => void
  }

  if (
    typeof transitionDocument.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    update()
    return
  }

  transitionDocument.startViewTransition(() => {
    flushSync(update)
  })
}

function getCurrentPath() {
  return window.location.pathname.replace(/\/+$/g, '') || '/'
}

function logBackgroundError(label: string, error: unknown) {
  console.error(label, error)
}

function mergeTaskActions(current: TaskStatusAction[], nextActions: TaskStatusAction[]) {
  return sortActions(nextActions.reduce((rows, action) => upsertById(rows, action), current))
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
  const [folderContainsExportVideos, setFolderContainsExportVideos] = useState(false)
  const [folderRecipientTaskAmount, setFolderRecipientTaskAmount] = useState('')
  const [members, setMembers] = useState<FolderMember[]>([])
  const [memberUsername, setMemberUsername] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [standaloneTasks, setStandaloneTasks] = useState<Task[]>([])
  const [taskLevels, setTaskLevels] = useState<TaskLevel[]>([])
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
  const [initialDataReady, setInitialDataReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState('Idle')

  const user = session?.user ?? null
  const userId = user?.id ?? null
  const emailUsername = user?.email?.split('@')[0]
  const authDisplayName = user?.user_metadata?.display_name
    || user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || emailUsername
    || 'User'
  const authUsername = user?.user_metadata?.username || emailUsername || 'user'
  // Access tokens rotate when a tab or PWA resumes. Use the stable user id for
  // request ownership so a background token refresh is not treated as a new login.
  const sessionKey = userId
  const activeSessionKeyRef = useRef<string | null>(null)
  const liveScopeKeyRef = useRef<string>('all-active-folders')
  const previousUserIdRef = useRef<string | null>(null)
  const initialDataUserIdRef = useRef<string | null>(null)
  const profilesByIdRef = useRef<Record<string, ProfileSummary>>({})
  const taskIdsRef = useRef<Set<string>>(new Set())
  const standaloneTaskIdsRef = useRef<Set<string>>(new Set())
  const progressRef = useRef<TaskProgress[]>([])
  const actionsRef = useRef<TaskStatusAction[]>([])
  const refreshFoldersRef = useRef<() => Promise<void>>(async () => undefined)
  const refreshLiveSessionRef = useRef<() => Promise<void>>(async () => undefined)

  const navigateToAuthView = useCallback((view: AuthView, mode: 'push' | 'replace' = 'push') => {
    runViewTransition(() => {
      setAuthView(view)
      setMessage('')

      if (view === 'reset') {
        return
      }

      const method = mode === 'replace' ? 'replaceState' : 'pushState'
      const nextPath = authPathByView[view]
      window.history[method]({}, '', nextPath)
      setPublicPath(nextPath)
    })
  }, [setAuthView])

  const navigateToDashboard = useCallback(() => {
    runViewTransition(() => {
      const dashboardRoute: AppRoute = { name: 'dashboard' }
      setRoute(dashboardRoute)
      setActiveView('dashboard')
      const dashboardPath = routeToPath(dashboardRoute)
      window.history.replaceState({}, '', dashboardPath)
      setPublicPath(dashboardPath)
    })
  }, [])

  const restorePendingInviteRoute = useCallback(() => {
    const pendingPath = getPendingInvitePath()
    if (!pendingPath) return false

    const pendingRoute = parseAppRoute(pendingPath)
    if (pendingRoute.name !== 'invite') {
      setPendingInvitePath(null)
      return false
    }

    runViewTransition(() => {
      setRoute(pendingRoute)
      setActiveView(getRouteView(pendingRoute))
      window.history.replaceState({}, '', pendingPath)
      setPublicPath(pendingPath)
    })
    setPendingInvitePath(null)
    return true
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
    if (authReady && !session && route.name === 'invite' && route.inviteId) {
      setPendingInvitePath(routeToPath(route))
    }
  }, [authReady, route, session])

  useEffect(() => {
    if (!authReady || !session) {
      return
    }

    const pathname = getCurrentPath()
    if (restorePendingInviteRoute()) {
      return
    }

    if (pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/forgot') {
      navigateToDashboard()
    }
  }, [authReady, navigateToDashboard, restorePendingInviteRoute, session])

  useEffect(() => {
    const folderId = routeFolderId(route)
    if (folderId !== selectedFolderId) {
      const previousTaskIds = new Set(tasks.map((task) => task.id))
      setSelectedFolderId(folderId)
      setTasks([])
      setMembers([])
      setTaskLevels((current) => current.filter((level) => !previousTaskIds.has(level.task_id)))
      setProgress((current) => current.filter((item) => !previousTaskIds.has(item.task_id)))
      setActions((current) => current.filter((action) => !previousTaskIds.has(action.task_id)))
      setEditingTaskId(null)
    }
  }, [route, selectedFolderId, tasks])

  useEffect(() => {
    liveScopeKeyRef.current = selectedFolderId ?? 'all-active-folders'
  }, [selectedFolderId])

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
    recipientReportsByFolder,
    recipientReportsByTask,
    standaloneAssignableMembers,
    statusTotals,
    statusHistoryByTask,
    taskLevelCompletedIdsByTask,
    taskLevelsByTask,
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
    taskLevels,
    taskMembers,
    tasks,
    userId,
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
        label: 'Profile',
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
    runViewTransition(() => {
      const nextPath = routeToPath(newRoute)
      setRoute(newRoute)
      setActiveView(getRouteView(newRoute))
      window.history.pushState({}, '', nextPath)
      setPublicPath(nextPath)
    })
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

    const nextUserId = userId
    const previousUserId = previousUserIdRef.current

    if (previousUserId && !nextUserId) {
      activeSessionKeyRef.current = null
      setMessage('')
      setCurrentProfile(null)
      setFolders([])
      setMembers([])
      setTasks([])
      setStandaloneTasks([])
      setTaskLevels([])
      setTaskMembers([])
      setDeletedFolders([])
      setDeletedTasks([])
      setProgress([])
      setActions([])
      setSelectedFolderId(null)
      setConfirmRequest(null)
      setDataLoading(false)
      setInitialDataReady(false)
      setSaving(false)
      setPendingAction(null)
      setRealtimeStatus('Idle')
      initialDataUserIdRef.current = null
    }

    previousUserIdRef.current = nextUserId
  }, [authReady, userId])

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
    if (!isSupabaseConfigured || !sessionKey) {
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
      const nextProfiles = await listProfiles(missingIds)

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
    if (!authReady || !isSupabaseConfigured || !userId || !sessionKey) {
      return
    }

    const requestSessionKey = sessionKey

    try {
      const nextFolders = await listFolders()

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
  }, [authReady, isCurrentSession, sessionKey, userId])

  useEffect(() => {
    refreshFoldersRef.current = refreshFolders
  }, [refreshFolders])

  const refreshStandaloneTasks = useCallback(async () => {
    if (!authReady || !isSupabaseConfigured || !userId || !sessionKey) {
      return
    }

    const requestSessionKey = sessionKey

    try {
      const nextTasks = await listStandaloneTasks()
      const taskIds = nextTasks.map((task) => task.id)
      const sharedTaskIds = nextTasks
        .filter((task) => task.category === 'shared')
        .map((task) => task.id)
      const [nextLevels, nextProgress, nextActions, nextMembersByTask] = await Promise.all([
        listTaskLevelsForTasks(taskIds),
        listTaskProgressForTasks(taskIds),
        listTaskActionsForTasks(taskIds),
        Promise.all(sharedTaskIds.map((taskId) => listTaskMembers(taskId))),
      ])
      const nextTaskMembers = nextMembersByTask.flat()

      if (!isCurrentSession(requestSessionKey)) {
        return
      }

      setStandaloneTasks(sortStandaloneTasks(nextTasks))
      setTaskLevels((current) => replaceRowsForTasks(current, taskIds, nextLevels))
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
  }, [authReady, isCurrentSession, loadProfilesForIds, sessionKey, userId])

  const refreshArchive = useCallback(async () => {
    if (!authReady || !isSupabaseConfigured || !userId || !sessionKey) {
      return
    }

    const requestSessionKey = sessionKey

    try {
      const [nextDeletedFolders, nextDeletedTasks] = await Promise.all([
        listDeletedFolders(),
        listDeletedTasks(),
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
  }, [authReady, isCurrentSession, sessionKey, userId])

  const loadUserData = useCallback(async () => {
    if (!authReady) {
      return
    }

    if (!isSupabaseConfigured || !userId || !sessionKey) {
      initialDataUserIdRef.current = null
      setCurrentProfile(null)
      setFolders([])
      setStandaloneTasks([])
      setTaskLevels([])
      setTaskMembers([])
      setDeletedFolders([])
      setDeletedTasks([])
      setSelectedFolderId(null)
      setInitialDataReady(false)
      return
    }

    const requestSessionKey = sessionKey
    const isInitialLoadForUser = initialDataUserIdRef.current !== userId

    setDataLoading(true)
    if (isInitialLoadForUser) {
      setInitialDataReady(false)
    }
    setMessage('')

    try {
      const nextProfile = await ensureProfile(userId, authDisplayName, authUsername)

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
        initialDataUserIdRef.current = userId
        setDataLoading(false)
        setInitialDataReady(true)
      }
    }
  }, [authDisplayName, authReady, authUsername, isCurrentSession, refreshArchive, refreshFolders, refreshStandaloneTasks, sessionKey, userId])

  useEffect(() => {
    void loadUserData()
  }, [loadUserData])

  useEffect(() => {
    if (!authReady || !userId) {
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
  }, [authReady, refreshArchive, refreshStandaloneTasks, userId])

  const refreshLiveSession = useCallback(async () => {
    if (!authReady) {
      return
    }

    if (!isSupabaseConfigured || !sessionKey) {
      setMembers([])
      setTasks([])
      setRealtimeStatus('Idle')
      return
    }

    const requestSessionKey = sessionKey
    const requestScopeKey = activeFolder?.id ?? 'all-active-folders'

    setDataLoading(true)
    setMessage('')

    try {
      let nextTasks;
      let nextMembers: FolderMember[] = [];
      
      if (activeFolder) {
        [nextTasks, nextMembers] = await Promise.all([
          listTasks(activeFolder.id),
          listFolderMembers(activeFolder.id),
        ])
      } else {
        nextTasks = await listTasksInActiveFolders()
      }
      const taskIds = nextTasks.map((task) => task.id)
      const [nextLevels, nextProgress, nextActions] = await Promise.all([
        listTaskLevelsForTasks(taskIds),
        listTaskProgressForTasks(taskIds),
        listTaskActionsForTasks(taskIds),
      ])

      if (!isCurrentSession(requestSessionKey) || liveScopeKeyRef.current !== requestScopeKey) {
        return
      }

      setTasks(sortByPositionAndCreatedAt(nextTasks))
      setMembers(nextMembers)
      setTaskLevels((current) => replaceRowsForTasks(current, taskIds, nextLevels))
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
    userId,
  })

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const username = normalizeUsername(registerUsername)
    const passwordError = getPasswordError(registerPassword, registerConfirmPassword)

    if (!isSupabaseConfigured || !registerEmail.trim() || !username) {
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
      const { data, error } = await authService.signUpWithEmail(
        registerEmail.trim(),
        registerPassword,
        username,
        window.location.origin,
      )

      if (error) {
        throw error
      }

      if (data.session && data.user) {
        await ensureProfile(data.user.id, username, username)
        await authService.signOut()
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

    if (!isSupabaseConfigured || !identifier || !loginPassword) {
      return
    }

    setAuthLoading(true)
    setMessage('')

    try {
      const email = identifier.includes('@')
        ? identifier
        : await resolveLoginEmail(identifier)

      if (!email) {
        throw new Error('Login identifier not found.')
      }

      const { error } = await authService.signInWithPassword(email, loginPassword)

      if (error) {
        throw error
      }

      setStoredSkipLanding(rememberMe)
      setShouldSkipLanding(rememberMe)
      setLoginPassword('')
      if (!restorePendingInviteRoute()) {
        navigateToDashboard()
      }
    } catch (error) {
      console.error('Login failed', error)
      setMessage('Invalid username/email or password')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleGoogleLogin() {
    if (!isSupabaseConfigured) return

    setAuthLoading(true)
    setMessage('')

    try {
      const shouldRememberGoogleLogin = authView === 'login' && rememberMe
      const currentRoute = parseAppRoute(window.location.pathname)
      if (currentRoute.name === 'invite' && currentRoute.inviteId) {
        setPendingInvitePath(routeToPath(currentRoute))
      }

      const { error } = await authService.signInWithGoogle(`${window.location.origin}/dashboard`)

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

    if (!isSupabaseConfigured || !forgotEmail.trim()) {
      return
    }

    setAuthLoading(true)
    setMessage('')

    try {
      const { error } = await authService.sendPasswordResetEmail(forgotEmail.trim(), window.location.origin)

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

    if (!isSupabaseConfigured || passwordError) {
      setMessage(passwordError ?? 'Unable to update password.')
      return
    }

    setAuthLoading(true)
    setMessage('')

    try {
      const { error } = await authService.updatePassword(resetPassword)

      if (error) {
        throw error
      }

      setResetPassword('')
      setResetConfirmPassword('')
      await authService.signOut()
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
    if (!isSupabaseConfigured) {
      return
    }

    activeSessionKeyRef.current = null
    await authService.signOut()
    setSession(null)
    setMessage('')
    setCurrentProfile(null)
    setFolders([])
    setMembers([])
    setTasks([])
    setStandaloneTasks([])
    setTaskLevels([])
    setTaskMembers([])
    setDeletedFolders([])
    setDeletedTasks([])
    setProgress([])
    setActions([])
    setSelectedFolderId(null)
    setConfirmRequest(null)
    setDataLoading(false)
    setInitialDataReady(false)
    setSaving(false)
    setPendingAction(null)
    setRealtimeStatus('Idle')
  }

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isSupabaseConfigured || !user) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const nextProfile = await updateProfile(user.id, {
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

  async function handleChangeEmail(nextEmail: string) {
    if (!isSupabaseConfigured || !user) {
      throw new Error('You need to be signed in to change your email.')
    }

    const normalizedEmail = nextEmail.trim().toLowerCase()
    if (!normalizedEmail || normalizedEmail === (user.email ?? '').toLowerCase()) {
      throw new Error('Enter a different email address.')
    }

    const { error } = await authService.updateEmail(
      normalizedEmail,
      `${window.location.origin}/profile`,
    )

    if (error) throw error
    setMessage('Confirmation links were sent. Confirm the change from your email.')
  }

  async function handleChangePassword(currentPassword: string, nextPassword: string) {
    if (!isSupabaseConfigured || !user?.email) {
      throw new Error('Password changes require an email sign-in.')
    }

    const passwordError = getPasswordError(nextPassword, nextPassword)
    if (passwordError) throw new Error(passwordError)

    const { error: verificationError } = await authService.signInWithPassword(
      user.email,
      currentPassword,
    )
    if (verificationError) {
      throw new Error('Your current password is incorrect.')
    }

    const { error } = await authService.updatePassword(nextPassword)
    if (error) throw error
    setMessage('Password changed successfully.')
  }

  async function handleCreateFolder(event: React.FormEvent, inviteUsernames?: string[]) {
    event.preventDefault()

    if (!isSupabaseConfigured || !user || !folderTitle.trim()) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const folder = await createFolder(
        folderTitle.trim(),
        folderDescription.trim() || null,
        folderCategory,
        folderContainsExportVideos,
        parseRecipientAmount(folderRecipientTaskAmount),
      )
      setFolders((current) => [folder, ...current.filter((item) => item.id !== folder.id)])
      setSelectedFolderId(folder.id)
      setFolderTitle('')
      setFolderDescription('')
      setFolderCategory('personal')
      setFolderContainsExportVideos(false)
      setFolderRecipientTaskAmount('')

      if (route.name === 'folder-new') {
        navigateToRoute({ name: 'folder-detail', folderId: folder.id })
      }

      if (inviteUsernames && inviteUsernames.length > 0) {
        void (async () => {
          for (const username of inviteUsernames) {
            try {
              await addFolderMemberByUsername(
                folder.id,
                normalizeUsername(username) ?? username.trim()
              )
            } catch (error) {
              logBackgroundError(`Failed to invite user ${username}`, error)
            }
          }
          await refreshFoldersRef.current()
          setFolders((current) => [folder, ...current.filter((item) => item.id !== folder.id)])
        })().catch((error) => logBackgroundError('Folder invite refresh failed', error))
      }
    } catch (error) {
      console.error('Folder creation failed', error)
      setMessage('Unable to create folder.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateFolder(values: FolderEditValues) {
    if (!isSupabaseConfigured || !activeFolder) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const folder = await updateFolder({
        id: activeFolder.id,
        title: values.title,
        description: values.description,
        category: values.category,
        containsExportVideos: values.containsExportVideos,
        dueDate: values.dueDate,
        isActive: values.isActive,
        recipientTaskAmount: values.recipientTaskAmount,
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
    if (!isSupabaseConfigured || !user) return

    try {
      setSaving(true)
      const invite = await createInviteWithUser(resourceType, resourceId, user.id)
      const isStandaloneTask = resourceType === 'task'
        && standaloneTasks.some((task) => task.id === resourceId && task.owner_id === user.id)
      const inviteUrl = isStandaloneTask
        ? `${window.location.origin}/share/tasks/${invite.id}`
        : `${window.location.origin}/invite/${invite.id}`
      await navigator.clipboard.writeText(inviteUrl)
      setMessage(isStandaloneTask ? 'View-only task link copied.' : 'Invite link copied.')
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
        if (!isSupabaseConfigured) {
          return
        }

        try {
          await softDeleteFolder(folder.id)
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
    if (!isSupabaseConfigured) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const restoredFolder = await restoreFolder(folder.id)
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
    if (!isSupabaseConfigured) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const nextFolders = await reorderFolder(folder.id, direction, scopedFolderIds)
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
    if (!isSupabaseConfigured) {
      return
    }
    
    setConfirmRequest({
      actionLabel: 'Delete Forever',
      confirmLabel: 'Delete Forever',
      message: `Are you sure you want to permanently delete "${folder.title}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await hardDeleteFolder(folder.id)
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
    if (!isSupabaseConfigured) {
      return
    }
    
    setConfirmRequest({
      actionLabel: 'Delete Forever',
      confirmLabel: 'Delete Forever',
      message: `Are you sure you want to permanently delete "${task.title}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await hardDeleteTask(task.id)
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
    if (!isSupabaseConfigured) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const restoredTask = await restoreTask(task.id)
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
        setStandaloneTasks((current) => sortStandaloneTasks(upsertById(current, restoredTask)))
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
    if (!isSupabaseConfigured) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const nextTasks = await reorderTask(task.id, direction, scopedTaskIds)

      if (task.folder_id) {
        setTasks(sortByPositionAndCreatedAt(nextTasks))
        await refreshLiveSessionRef.current()
      } else {
        setStandaloneTasks(sortStandaloneTasks(nextTasks))
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

    if (!isSupabaseConfigured || !activeFolder || !memberUsername.trim()) {
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
      let invitedRelationshipStatus:
        | 'acquaintance'
        | 'pending_incoming'
        | 'pending_outgoing'
        | 'none'
        | null = null

      try {
        const relationshipMatches = await searchProfilesWithRelationship(nextUsername)
        invitedRelationshipStatus = relationshipMatches.find(
          (candidate) => normalizeUsername(candidate.username) === normalizeUsername(nextUsername),
        )?.relationship_status ?? null
      } catch (relationshipError) {
        logBackgroundError('Folder collaborator relationship lookup failed', relationshipError)
      }

      const { member, profile } = await addFolderMemberByUsername(
        activeFolder.id,
        nextUsername,
      )
      let acquaintanceRequestSent = false

      if (invitedRelationshipStatus === 'none') {
        try {
          await sendAcquaintanceRequest(nextUsername)
          acquaintanceRequestSent = true
        } catch (requestError) {
          logBackgroundError('Folder collaborator acquaintance request failed', requestError)
        }
      }

      setProfilesById((current) => ({ ...current, [profile.id]: profile }))

      if (member) {
        setMembers((current) => upsertById(current, member))
        const profileLabel = profile.display_name ?? profile.username ?? 'User'
        setMessage(
          acquaintanceRequestSent
            ? `${profileLabel} can now open this folder. An acquaintance request was also sent.`
            : `${profileLabel} can now open this folder.`,
        )
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

  async function handleRemoveFolderMember(userId: string) {
    if (
      !isSupabaseConfigured ||
      !user ||
      !activeFolder ||
      activeFolder.owner_id !== user.id ||
      userId === activeFolder.owner_id
    ) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const removedMember = await removeFolderMember(activeFolder.id, userId)

      setMembers((current) => current.filter((member) => member.id !== removedMember.id))
      setMessage(`${getProfileLabel(userId)} was removed from this folder.`)
      await refreshLiveSessionRef.current()
    } catch (error) {
      console.error('Folder member remove failed', error)
      setMessage('Unable to remove collaborator.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateFolderTask(values: TaskCreateValues) {
    if (!isSupabaseConfigured || !user || !activeFolder) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const task = await createTask({
        folderId: activeFolder.id,
        title: values.title,
        description: values.description,
        category: values.category,
        hasExportButton: values.hasExportButton,
        recipientAmount: activeFolder.owner_id === user.id ? values.recipientAmount : null,
      })
      const nextTaskLevels = await syncTaskLevels(
        task.id,
        values.checklistItems,
      )

      setTasks((current) => sortByPositionAndCreatedAt(upsertById(current, task)))
      setTaskLevels((current) => replaceRowsForTasks(current, [task.id], nextTaskLevels))
      if (route.name === 'task-new') {
        navigateToRoute({ name: 'folder-detail', folderId: activeFolder.id })
      }

      if (values.inviteUsernames && values.inviteUsernames.length > 0) {
        void (async () => {
          for (const username of values.inviteUsernames ?? []) {
            try {
              await addTaskMemberByUsername(
                task.id,
                normalizeUsername(username) ?? username.trim()
              )
            } catch (error) {
              logBackgroundError(`Failed to invite user ${username} to task`, error)
            }
          }
          await refreshLiveSessionRef.current()
        })().catch((error) => logBackgroundError('Task invite refresh failed', error))
      } else {
        void refreshLiveSessionRef.current().catch((error) => logBackgroundError('Task refresh failed', error))
      }
    } catch (error) {
      console.error('Task creation failed', error)
      setMessage('Unable to create task.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateStandaloneTask(values: TaskCreateValues) {
    if (!isSupabaseConfigured || !user) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const task = await createStandaloneTask({
        title: values.title,
        description: values.description,
        category: values.category,
        assignedUserId: null,
        dueDate: null,
        hasExportButton: values.hasExportButton,
        recipientAmount: values.recipientAmount,
      })
      const nextTaskLevels = await syncTaskLevels(
        task.id,
        values.checklistItems,
      )

      setStandaloneTasks((current) => sortStandaloneTasks(upsertById(current, task)))
      setTaskLevels((current) => replaceRowsForTasks(current, [task.id], nextTaskLevels))
      if (route.name === 'task-new') {
        navigateToRoute({ name: 'tasks' })
      }

      if (values.inviteUsernames && values.inviteUsernames.length > 0) {
        void (async () => {
          for (const username of values.inviteUsernames ?? []) {
            try {
              await addTaskMemberByUsername(
                task.id,
                normalizeUsername(username) ?? username.trim()
              )
            } catch (error) {
              logBackgroundError(`Failed to invite user ${username} to standalone task`, error)
            }
          }
          await refreshStandaloneTasks()
        })().catch((error) => logBackgroundError('Standalone task invite refresh failed', error))
      } else {
        void refreshStandaloneTasks().catch((error) => logBackgroundError('Standalone task refresh failed', error))
      }
    } catch (error) {
      console.error('Standalone task creation failed', error)
      setMessage('Unable to create task.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddTaskMember(task: Task, username: string) {
    if (!isSupabaseConfigured) {
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
      const { member, profile } = await addTaskMemberByUsername(task.id, nextUsername)
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
    if (!isSupabaseConfigured) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const removedMember = await removeTaskMember(task.id, userId)

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
    if (!isSupabaseConfigured) {
      return
    }

    const knownTask = findKnownTask(taskId)
    const owningFolder = knownTask?.folder_id
      ? folders.find((folder) => folder.id === knownTask.folder_id)
      : null
    const canEditRecipientAmount = !knownTask?.folder_id || owningFolder?.owner_id === user?.id

    setSaving(true)
    setMessage('')

    try {
      const task = await updateTask({
        id: taskId,
        title: values.title,
        description: values.description,
        category: values.category,
        dueDate: values.dueDate,
        hasExportButton: values.hasExportButton,
        isActive: values.isActive,
        assignedUserId: values.assignedUserId,
        recipientAmount: canEditRecipientAmount ? values.recipientAmount : null,
      })
      const nextTaskLevels = await syncTaskLevels(
        task.id,
        values.checklistItems,
      )

      if (task.folder_id) {
        setTasks((current) => sortByPositionAndCreatedAt(upsertById(current, task)))
      } else {
        setStandaloneTasks((current) => sortStandaloneTasks(upsertById(current, task)))
      }
      setTaskLevels((current) => replaceRowsForTasks(current, [task.id], nextTaskLevels))
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
        if (!isSupabaseConfigured) {
          return
        }

        try {
          await softDeleteTask(task.id)
          if (task.folder_id) {
            setTasks((current) => current.filter((currentTask) => currentTask.id !== task.id))
          } else {
            setStandaloneTasks((current) => current.filter((currentTask) => currentTask.id !== task.id))
          }
          setTaskLevels((current) => current.filter((level) => level.task_id !== task.id))
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
    if (!isSupabaseConfigured) {
      return
    }

    const actionId = `${taskId}:${status}`
    const levelsForTask = taskLevelsByTask.get(taskId) ?? []
    setPendingAction(actionId)
    setMessage('')

    try {
      const levelActions =
        status === 'completed' && levelsForTask.length
          ? await Promise.all(levelsForTask.map((level) => setTaskProgress(taskId, level.id, 'completed')))
          : []
      const action = await setTaskProgress(taskId, null, status)
      setActions((current) => mergeTaskActions(current, [...levelActions, action]))
      await Promise.all([refreshLiveSessionRef.current(), refreshStandaloneTasks()])
    } catch (error) {
      console.error('Task status update failed', error)
      setMessage(error instanceof Error ? error.message : 'Unable to update task status.')
    } finally {
      setPendingAction(null)
    }
  }

  const handleInviteAccepted = useCallback(async (resourceType: 'folder' | 'task', resourceId: string) => {
    if (resourceType === 'folder') {
      await refreshFolders()
      navigateToRoute({ name: 'folder-detail', folderId: resourceId })
      return
    }

    await refreshStandaloneTasks()
    navigateToRoute({ name: 'task-detail', taskId: resourceId })
  }, [navigateToRoute, refreshFolders, refreshStandaloneTasks])

  async function handleSetTaskExported(taskId: string, isExported = true) {
    if (!isSupabaseConfigured) {
      return
    }

    setPendingAction(`export:${taskId}`)
    setMessage('')

    try {
      const task = await setTaskExported(taskId, isExported)

      if (task.folder_id) {
        setTasks((current) => sortByPositionAndCreatedAt(upsertById(current, task)))
      } else {
        setStandaloneTasks((current) => sortStandaloneTasks(upsertById(current, task)))
      }

      await Promise.all([refreshLiveSessionRef.current(), refreshStandaloneTasks()])
    } catch (error) {
      console.error('Task export update failed', error)
      setMessage(error instanceof Error ? error.message : 'Unable to update export status.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleToggleTaskLevel(taskId: string, taskLevelId: string, checked: boolean) {
    if (!isSupabaseConfigured || !user) {
      return
    }

    setPendingAction(`level:${taskLevelId}`)
    setMessage('')

    try {
      if (checked) {
        const levelAction = await setTaskProgress(taskId, taskLevelId, 'completed')
        const completedLevelIds = new Set(taskLevelCompletedIdsByTask.get(taskId) ?? [])
        completedLevelIds.add(taskLevelId)

        const levelsForTask = taskLevelsByTask.get(taskId) ?? []
        const allLevelsCompleted =
          levelsForTask.length > 0 && levelsForTask.every((level) => completedLevelIds.has(level.id))
        const nextActions = [levelAction]

        if (allLevelsCompleted) {
          nextActions.push(await setTaskProgress(taskId, null, 'completed'))
        }

        setActions((current) => mergeTaskActions(current, nextActions))
      } else {
        const undoneLevelAction = await undoLatestTaskProgress(taskId, taskLevelId)
        const nextActions = [undoneLevelAction]
        const userRootCompleted = contributionsByTask
          .get(taskId)
          ?.completed.some((row) => row.userId === user.id)

        if (userRootCompleted) {
          try {
            nextActions.push(await undoLatestTaskProgress(taskId, null))
          } catch (error) {
            logBackgroundError('Root task completion undo skipped', error)
          }
        }

        setActions((current) => mergeTaskActions(current, nextActions))
      }

      await Promise.all([refreshLiveSessionRef.current(), refreshStandaloneTasks()])
    } catch (error) {
      console.error('Task checklist update failed', error)
      setMessage(error instanceof Error ? error.message : 'Unable to update checklist item.')
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
    if (!isSupabaseConfigured) {
      return
    }

    setPendingAction(`undo:${action.id}`)
    setMessage('')

    try {
      const undoneAction = await undoTaskStatusAction(action.id)
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

  if (route.name === 'task-share') {
    return <PublicTaskSharePage shareId={route.shareId} />
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

  if (!initialDataReady) {
    return (
      <LoadingState
        message="Loading your profile, workspaces, tasks, and live status."
        title="Preparing GrowT"
      />
    )
  }

  const currentUserId = session.user.id
  
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
      dashboardMode={true}
      message={message}
      navigationKey={routeToPath(route)}
      folders={folders}
      tasks={filteredTasks}
      onOpenFolder={(folderId) => navigateToRoute({ name: 'folder-detail', folderId })}
      onSearchChange={setSearchQuery}
      onNavigate={navigateToView}
      onSignOut={() => void handleSignOut()}
      searchQuery={searchQuery}
      userId={currentUserId}
      sidebar={
        <Sidebar
          activeView={activeView}
          onAddFolder={addFolderPage}
          onAddTask={() => addTaskPage()}
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
        currentUserId={currentUserId}
        dataLoading={dataLoading}
        deletedFolders={deletedFolders}
        deletedTasks={deletedTasks}
        editingTaskId={editingTaskId}
        filteredTasks={filteredTasks}
        folderCategory={folderCategory}
        folderContainsExportVideos={folderContainsExportVideos}
        folderDescription={folderDescription}
        folderMemberUserIds={folderMemberUserIds}
        folderRecipientTaskAmount={folderRecipientTaskAmount}
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
        onFolderContainsExportVideosChange={setFolderContainsExportVideos}
        onFolderDescriptionChange={setFolderDescription}
        onFolderRecipientTaskAmountChange={setFolderRecipientTaskAmount}
        onFolderTitleChange={setFolderTitle}
        onHardDeleteFolder={handleHardDeleteFolder}
        onHardDeleteTask={handleHardDeleteTask}
        onInviteMember={handleInviteMember}
        onInviteAccepted={handleInviteAccepted}
        onMemberUsernameChange={setMemberUsername}
        onMoveFolder={(folder, direction, scopedFolderIds) => void handleMoveFolder(folder, direction, scopedFolderIds)}
        onMoveTask={(task, direction, scopedTaskIds) => void handleMoveTask(task, direction, scopedTaskIds)}
        onNavigate={navigateToView}
        onOpenFolder={(folderId) => navigateToRoute({ name: 'folder-detail', folderId })}
        onOpenTask={(task) => navigateToRoute({ name: 'task-detail', taskId: task.id, folderId: task.folder_id || undefined })}
        onProfileAvatarChoiceChange={setProfileAvatarChoice}
        onChangeEmail={handleChangeEmail}
        onChangePassword={handleChangePassword}
        onProfileColorPaletteChange={setProfileColorPalette}
        onProfileDisplayNameChange={setProfileDisplayName}
        onProfileThemeModeChange={setProfileThemeMode}
        onProfileUsernameChange={setProfileUsername}
        onRemoveFolderMember={(memberId) => void handleRemoveFolderMember(memberId)}
        onRemoveTaskMember={(task, memberId) => void handleRemoveTaskMember(task, memberId)}
        onRestoreFolder={handleRestoreFolder}
        onRestoreTask={handleRestoreTask}
        onSaveProfile={handleUpdateProfile}
        onSelectFolder={setSelectedFolderId}
        onSetTaskExported={(taskId, isExported) => void handleSetTaskExported(taskId, isExported)}
        onSetTaskStatus={(taskId, status) => void handleSetTaskStatus(taskId, status)}
        onToggleTaskLevel={(taskId, taskLevelId, checked) => void handleToggleTaskLevel(taskId, taskLevelId, checked)}
        onUndoAction={(action) => void handleUndoTaskStatus(action)}
        onUpdateFolder={(values) => void handleUpdateFolder(values)}
        onUpdateTask={(taskId, values) => void handleUpdateTask(taskId, values)}
        pendingAction={pendingAction}
        profileAvatarChoice={profileAvatarChoice}
        profileColorPalette={profileColorPalette}
        profileDisplayName={profileDisplayName}
        profileEmail={user?.email ?? ''}
        profileThemeMode={profileThemeMode}
        profileUsername={profileUsername}
        realtimeLabel={realtimeStatus}
        recipientReportsByFolder={recipientReportsByFolder}
        recipientReportsByTask={recipientReportsByTask}
        route={route}
        sharedFolders={sharedFolders}
        sharedStandaloneTasks={sharedStandaloneTasks}
        standaloneAssignableMembers={standaloneAssignableMembers}
        standaloneTasks={standaloneTasks}
        statusTotals={statusTotals}
        statusHistoryByTask={statusHistoryByTask}
        taskLevelCompletedIdsByTask={taskLevelCompletedIdsByTask}
        taskLevelsByTask={taskLevelsByTask}
        taskMembersByTask={taskMembersByTask}
        tasks={tasks}
      />
    </AppShell>
  )
}

export default App
