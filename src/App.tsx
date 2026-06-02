import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import './App.css'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import {
  addFolderMemberByUsername,
  createFolder,
  createTask,
  ensureProfile,
  listFolderMembers,
  listFolders,
  listProfiles,
  listTaskActionsForTasks,
  listTaskProgressForTasks,
  listTasks,
  setTaskProgress,
  undoLatestTaskProgress,
  updateProfile,
  type Folder,
  type FolderMember,
  type Profile,
  type Task,
  type TaskProgress,
  type TaskStatusAction,
} from './lib/growtData'
import type { FolderCategory, TaskProgressStatus } from './lib/database.types'

type RealtimePayload<T extends { id: string }> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Partial<T>
  old: Partial<T>
}

const categoryOptions: { id: FolderCategory; label: string }[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'work', label: 'Work' },
  { id: 'shared', label: 'Shared' },
]

const statusColumns: { id: TaskProgressStatus; label: string }[] = [
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'half_done', label: 'Half Done' },
  { id: 'completed', label: 'Completed' },
]

function sortByPositionAndCreatedAt<T extends { position: number; created_at: string }>(items: T[]) {
  return [...items].sort((first, second) => {
    if (first.position !== second.position) {
      return first.position - second.position
    }

    return Date.parse(first.created_at) - Date.parse(second.created_at)
  })
}

function sortFolders(folders: Folder[]) {
  return [...folders].sort((first, second) => {
    if (first.position !== second.position) {
      return first.position - second.position
    }

    return Date.parse(second.updated_at) - Date.parse(first.updated_at)
  })
}

function sortActions(actions: TaskStatusAction[]) {
  return [...actions].sort((first, second) => {
    return Date.parse(second.created_at) - Date.parse(first.created_at)
  })
}

function upsertById<T extends { id: string }>(items: T[], nextItem: T) {
  const exists = items.some((item) => item.id === nextItem.id)

  if (!exists) {
    return [nextItem, ...items]
  }

  return items.map((item) => (item.id === nextItem.id ? nextItem : item))
}

function actionKey(taskId: string, taskLevelId: string | null) {
  return `${taskId}:${taskLevelId ?? 'root'}`
}

function normalizeUsername(username: string) {
  const nextUsername = username.trim().replace(/^@/, '').toLowerCase()
  return nextUsername.length ? nextUsername : null
}

function defaultDisplayName(email: string | undefined) {
  if (!email) {
    return null
  }

  return email.split('@')[0] || email
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [email, setEmail] = useState('')
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
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [progress, setProgress] = useState<TaskProgress[]>([])
  const [actions, setActions] = useState<TaskStatusAction[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState('Offline')
  const [notificationCount, setNotificationCount] = useState(0)

  const user = session?.user ?? null
  const profilesByIdRef = useRef<Record<string, Profile>>({})
  const taskIdsRef = useRef<Set<string>>(new Set())
  const progressRef = useRef<TaskProgress[]>([])
  const actionsRef = useRef<TaskStatusAction[]>([])
  const refreshFoldersRef = useRef<() => Promise<void>>(async () => undefined)
  const refreshLiveSessionRef = useRef<() => Promise<void>>(async () => undefined)

  const activeFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) ?? folders[0] ?? null,
    [selectedFolderId, folders],
  )

  const progressByTask = useMemo(() => {
    const grouped = new Map<string, Record<TaskProgressStatus, TaskProgress[]>>()

    for (const item of progress) {
      const taskGroup =
        grouped.get(item.task_id) ??
        ({
          ongoing: [],
          half_done: [],
          completed: [],
        } satisfies Record<TaskProgressStatus, TaskProgress[]>)

      taskGroup[item.status] = [...taskGroup[item.status], item]
      grouped.set(item.task_id, taskGroup)
    }

    return grouped
  }, [progress])

  const latestUndoableActionByTask = useMemo(() => {
    const undoableActions = new Map<string, TaskStatusAction>()

    if (!user) {
      return undoableActions
    }

    for (const action of sortActions(actions)) {
      const key = actionKey(action.task_id, action.task_level_id)

      if (!action.is_undone && action.user_id === user.id && !undoableActions.has(key)) {
        undoableActions.set(key, action)
      }
    }

    return undoableActions
  }, [actions, user])

  const statusTotals = useMemo(() => {
    return statusColumns.reduce<Record<TaskProgressStatus, number>>(
      (totals, status) => {
        totals[status.id] = progress.filter((item) => item.status === status.id).length
        return totals
      },
      { ongoing: 0, half_done: 0, completed: 0 },
    )
  }, [progress])

  useEffect(() => {
    profilesByIdRef.current = profilesById
  }, [profilesById])

  useEffect(() => {
    taskIdsRef.current = new Set(tasks.map((task) => task.id))
  }, [tasks])

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    actionsRef.current = actions
  }, [actions])

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

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
    if (!supabase || !user) {
      return
    }

    const nextFolders = await listFolders(supabase)
    setFolders(sortFolders(nextFolders))
    setSelectedFolderId((currentId) => {
      if (currentId && nextFolders.some((folder) => folder.id === currentId)) {
        return currentId
      }

      return nextFolders[0]?.id ?? null
    })
  }, [user])

  useEffect(() => {
    refreshFoldersRef.current = refreshFolders
  }, [refreshFolders])

  const loadUserData = useCallback(async () => {
    if (!supabase || !user) {
      setCurrentProfile(null)
      setFolders([])
      setSelectedFolderId(null)
      return
    }

    setDataLoading(true)
    setMessage('')

    try {
      const nextProfile = await ensureProfile(supabase, user.id, defaultDisplayName(user.email))
      setCurrentProfile(nextProfile)
      setProfileDisplayName(nextProfile.display_name ?? '')
      setProfileUsername(nextProfile.username ?? '')
      setProfilesById((current) => ({ ...current, [nextProfile.id]: nextProfile }))
      await refreshFolders()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load GrowT data.')
    } finally {
      setDataLoading(false)
    }
  }, [refreshFolders, user])

  useEffect(() => {
    void loadUserData()
  }, [loadUserData])

  const refreshLiveSession = useCallback(async () => {
    if (!supabase || !activeFolder) {
      setMembers([])
      setTasks([])
      setProgress([])
      setActions([])
      setRealtimeStatus('Offline')
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
      setProgress(nextProgress)
      setActions(sortActions(nextActions))

      void loadProfilesForIds([
        activeFolder.owner_id,
        ...nextTasks.map((task) => task.owner_id),
        ...nextTasks.flatMap((task) => [task.assigned_user_id ?? '']),
        ...nextMembers.map((member) => member.user_id),
        ...nextProgress.map((item) => item.user_id),
        ...nextActions.map((action) => action.user_id),
      ])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load live session.')
    } finally {
      setDataLoading(false)
    }
  }, [activeFolder, loadProfilesForIds])

  useEffect(() => {
    refreshLiveSessionRef.current = refreshLiveSession
  }, [refreshLiveSession])

  useEffect(() => {
    void refreshLiveSession()
  }, [refreshLiveSession])

  useEffect(() => {
    if (!supabase || !user || !activeFolder) {
      return
    }

    const realtimeClient = supabase
    const folderId = activeFolder.id
    setRealtimeStatus('Connecting')

    const applyFolderChange = (payload: RealtimePayload<Folder>) => {
      if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id
        if (!deletedId) {
          return
        }

        setFolders((current) => current.filter((folder) => folder.id !== deletedId))
        setSelectedFolderId((currentId) => (currentId === deletedId ? null : currentId))
        void refreshFoldersRef.current()
        return
      }

      const changedFolder = payload.new as Folder

      if (changedFolder.deleted_at) {
        setFolders((current) => current.filter((folder) => folder.id !== changedFolder.id))
        return
      }

      setFolders((current) => sortFolders(upsertById(current, changedFolder)))
    }

    const applyMemberChange = (payload: RealtimePayload<FolderMember>) => {
      if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id
        if (deletedId) {
          setMembers((current) => current.filter((member) => member.id !== deletedId))
        }

        return
      }

      const changedMember = payload.new as FolderMember
      if (changedMember.folder_id !== folderId) {
        return
      }

      setMembers((current) => upsertById(current, changedMember))
      void loadProfilesForIds([changedMember.user_id])
    }

    const applyTaskChange = (payload: RealtimePayload<Task>) => {
      if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id
        if (!deletedId) {
          return
        }

        setTasks((current) => current.filter((task) => task.id !== deletedId))
        setProgress((current) => current.filter((item) => item.task_id !== deletedId))
        setActions((current) => current.filter((action) => action.task_id !== deletedId))
        return
      }

      const changedTask = payload.new as Task
      if (changedTask.folder_id !== folderId || changedTask.deleted_at) {
        setTasks((current) => current.filter((task) => task.id !== changedTask.id))
        return
      }

      setTasks((current) => sortByPositionAndCreatedAt(upsertById(current, changedTask)))
      void loadProfilesForIds([changedTask.owner_id, changedTask.assigned_user_id ?? ''])
      void refreshLiveSessionRef.current()
    }

    const applyProgressChange = (payload: RealtimePayload<TaskProgress>) => {
      if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id
        if (deletedId && progressRef.current.some((item) => item.id === deletedId)) {
          setProgress((current) => current.filter((item) => item.id !== deletedId))
        }

        return
      }

      const changedProgress = payload.new as TaskProgress
      if (!taskIdsRef.current.has(changedProgress.task_id)) {
        return
      }

      setProgress((current) => upsertById(current, changedProgress))
      void loadProfilesForIds([changedProgress.user_id])
    }

    const applyActionChange = (payload: RealtimePayload<TaskStatusAction>) => {
      if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id
        if (deletedId && actionsRef.current.some((action) => action.id === deletedId)) {
          setActions((current) => current.filter((action) => action.id !== deletedId))
        }

        return
      }

      const changedAction = payload.new as TaskStatusAction
      if (!taskIdsRef.current.has(changedAction.task_id)) {
        return
      }

      setActions((current) => sortActions(upsertById(current, changedAction)))
      void loadProfilesForIds([changedAction.user_id])
    }

    const refreshOnRelatedChange = (payload: { new: { task_id?: string }; old: { task_id?: string } }) => {
      const taskId = payload.new.task_id ?? payload.old.task_id

      if (!taskId || taskIdsRef.current.has(taskId)) {
        void refreshLiveSessionRef.current()
      }
    }

    const channel = realtimeClient
      .channel(`live-folder:${folderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'folders', filter: `id=eq.${folderId}` },
        (payload) => applyFolderChange(payload as RealtimePayload<Folder>),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'folders' },
        (payload) => applyFolderChange(payload as RealtimePayload<Folder>),
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'folder_members',
          filter: `folder_id=eq.${folderId}`,
        },
        (payload) => applyMemberChange(payload as RealtimePayload<FolderMember>),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'folder_members',
          filter: `folder_id=eq.${folderId}`,
        },
        (payload) => applyMemberChange(payload as RealtimePayload<FolderMember>),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'folder_members' },
        (payload) => applyMemberChange(payload as RealtimePayload<FolderMember>),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks', filter: `folder_id=eq.${folderId}` },
        (payload) => applyTaskChange(payload as RealtimePayload<Task>),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `folder_id=eq.${folderId}` },
        (payload) => applyTaskChange(payload as RealtimePayload<Task>),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tasks' },
        (payload) => applyTaskChange(payload as RealtimePayload<Task>),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_levels' },
        (payload) => refreshOnRelatedChange(payload as { new: { task_id?: string }; old: { task_id?: string } }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_progress' },
        (payload) => applyProgressChange(payload as RealtimePayload<TaskProgress>),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_status_actions' },
        (payload) => applyActionChange(payload as RealtimePayload<TaskStatusAction>),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => setNotificationCount((current) => current + 1),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('Live')
          return
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('Needs attention')
          return
        }

        setRealtimeStatus('Connecting')
      })

    return () => {
      void realtimeClient.removeChannel(channel)
    }
  }, [activeFolder, loadProfilesForIds, user])

  function getProfileLabel(userId: string) {
    const profile = profilesById[userId]

    if (profile?.display_name) {
      return profile.display_name
    }

    if (profile?.username) {
      return `@${profile.username}`
    }

    if (userId === user?.id) {
      return 'You'
    }

    return `User ${userId.slice(0, 8)}`
  }

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !email.trim()) {
      return
    }

    setAuthLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) {
        throw error
      }

      setMessage('Check your email for the GrowT sign-in link.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send sign-in link.')
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
    setProgress([])
    setActions([])
    setSelectedFolderId(null)
    setRealtimeStatus('Offline')
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
        user.id,
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
      setMessage(error instanceof Error ? error.message : 'Unable to create folder.')
    } finally {
      setSaving(false)
    }
  }

  async function handleInviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !activeFolder || !memberUsername.trim()) {
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
      setMessage(error instanceof Error ? error.message : 'Unable to add member.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !user || !activeFolder || !taskTitle.trim()) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const task = await createTask(supabase, {
        folderId: activeFolder.id,
        ownerId: user.id,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        category: activeFolder.category,
      })
      setTasks((current) => sortByPositionAndCreatedAt(upsertById(current, task)))
      setTaskTitle('')
      setTaskDescription('')
      await refreshLiveSessionRef.current()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create task.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSetTaskStatus(taskId: string, status: TaskProgressStatus) {
    if (!supabase) {
      return
    }

    const actionId = `${taskId}:${status}`
    setPendingAction(actionId)
    setMessage('')

    try {
      await setTaskProgress(supabase, taskId, null, status)
      await refreshLiveSessionRef.current()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update task status.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleUndoTaskStatus(taskId: string) {
    if (!supabase) {
      return
    }

    setPendingAction(`undo:${taskId}`)
    setMessage('')

    try {
      await undoLatestTaskProgress(supabase, taskId, null)
      await refreshLiveSessionRef.current()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to undo task status.')
    } finally {
      setPendingAction(null)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="app-shell app-shell--centered">
        <section className="auth-panel">
          <span className="brand-mark">GT</span>
          <h1>GrowT needs Supabase env values.</h1>
          <p>Copy `.env.example` to `.env.local` and restart the dev server.</p>
        </section>
      </main>
    )
  }

  if (!authReady) {
    return (
      <main className="app-shell app-shell--centered">
        <section className="auth-panel">
          <span className="brand-mark">GT</span>
          <h1>Opening GrowT</h1>
          <p>Checking your session.</p>
        </section>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="app-shell app-shell--centered">
        <section className="auth-panel">
          <span className="brand-mark">GT</span>
          <h1>GrowT</h1>
          <p>Sign in with email to open your live task sessions.</p>
          <form className="auth-form" onSubmit={handleMagicLink}>
            <label htmlFor="email">Email</label>
            <div className="inline-form">
              <input
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
              <button className="button button--primary" disabled={authLoading} type="submit">
                {authLoading ? 'Sending' : 'Send link'}
              </button>
            </div>
          </form>
          {message ? <p className="notice">{message}</p> : null}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#session" aria-label="GrowT live session">
          <span className="brand-mark">GT</span>
          <span>GrowT</span>
        </a>
        <div className="account-actions">
          <span>{currentProfile?.display_name ?? user?.email}</span>
          <button className="button button--secondary" onClick={handleSignOut} type="button">
            Sign out
          </button>
        </div>
      </header>

      <section className="workspace-hero" id="session">
        <div>
          <p className="section-label">Live session</p>
          <h1>{activeFolder?.title ?? 'Create a folder to begin.'}</h1>
          <p className="hero-text">
            Shared task status is written to Supabase and streamed back into this screen through
            Realtime.
          </p>
        </div>
        <div className="summary-grid">
          <div className="metric">
            <span>Folders</span>
            <strong>{folders.length}</strong>
          </div>
          <div className="metric metric--sky">
            <span>Tasks</span>
            <strong>{tasks.length}</strong>
          </div>
          <div className="metric metric--sun">
            <span>Realtime</span>
            <strong>{dataLoading ? 'Syncing' : realtimeStatus}</strong>
          </div>
        </div>
      </section>

      <section className="workspace-grid">
        <aside className="side-panel">
          <div className="panel-heading">
            <h2>Folders</h2>
            <span>{folders.length}</span>
          </div>

          <div className="folder-list" aria-label="GrowT folders">
            {folders.map((folder) => (
              <button
                className={`folder-row ${
                  folder.id === activeFolder?.id ? 'folder-row--selected' : ''
                }`}
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                type="button"
              >
                <strong>{folder.title}</strong>
                <span>{folder.description || `${folder.category} folder`}</span>
              </button>
            ))}
            {!folders.length ? <p className="empty-state">No folders yet.</p> : null}
          </div>

          <form className="stack-form" onSubmit={handleCreateFolder}>
            <label htmlFor="folder-title">New folder</label>
            <input
              id="folder-title"
              onChange={(event) => setFolderTitle(event.target.value)}
              placeholder="Launch plan"
              required
              value={folderTitle}
            />
            <textarea
              onChange={(event) => setFolderDescription(event.target.value)}
              placeholder="What this folder is for"
              rows={3}
              value={folderDescription}
            />
            <select
              aria-label="Folder category"
              onChange={(event) => setFolderCategory(event.target.value as FolderCategory)}
              value={folderCategory}
            >
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            <button className="button button--primary" disabled={saving} type="submit">
              Create folder
            </button>
          </form>

          <form className="stack-form profile-form" onSubmit={handleUpdateProfile}>
            <label htmlFor="profile-name">Profile</label>
            <input
              id="profile-name"
              onChange={(event) => setProfileDisplayName(event.target.value)}
              placeholder="Display name"
              value={profileDisplayName}
            />
            <input
              aria-label="Username"
              onChange={(event) => setProfileUsername(event.target.value)}
              placeholder="username"
              value={profileUsername}
            />
            <button className="button button--secondary" disabled={saving} type="submit">
              Save profile
            </button>
          </form>
        </aside>

        <section className="main-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Folder</p>
              <h2>{activeFolder?.title ?? 'No folder selected'}</h2>
            </div>
            {activeFolder ? <span>{activeFolder.description ?? activeFolder.category}</span> : null}
          </div>

          {activeFolder ? (
            <>
              <div className="session-toolbar">
                <div className="member-strip">
                  <span className="section-label">Members</span>
                  <div>
                    {members.map((member) => (
                      <span className="member-chip" key={member.id}>
                        {getProfileLabel(member.user_id)}
                      </span>
                    ))}
                    {!members.length ? <span className="member-chip">Owner only</span> : null}
                  </div>
                </div>

                {activeFolder.owner_id === session.user.id ? (
                  <form className="invite-form" onSubmit={handleInviteMember}>
                    <input
                      aria-label="Member username"
                      onChange={(event) => setMemberUsername(event.target.value)}
                      placeholder="username"
                      value={memberUsername}
                    />
                    <button className="button button--secondary" disabled={saving} type="submit">
                      Add member
                    </button>
                  </form>
                ) : null}
              </div>

              <form className="task-form" onSubmit={handleCreateTask}>
                <input
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Task title"
                  required
                  value={taskTitle}
                />
                <input
                  onChange={(event) => setTaskDescription(event.target.value)}
                  placeholder="Description"
                  value={taskDescription}
                />
                <button className="button button--primary" disabled={saving} type="submit">
                  Add task
                </button>
              </form>

              <div className="status-summary" aria-label="Status totals">
                {statusColumns.map((status) => (
                  <div className={`status-total status-total--${status.id}`} key={status.id}>
                    <span>{status.label}</span>
                    <strong>{statusTotals[status.id]}</strong>
                  </div>
                ))}
              </div>

              <div className="task-list">
                {tasks.map((task) => {
                  const taskProgress = progressByTask.get(task.id)
                  const undoableAction = latestUndoableActionByTask.get(actionKey(task.id, null))

                  return (
                    <article className="task-row" key={task.id}>
                      <div className="task-row__header">
                        <div>
                          <strong>{task.title}</strong>
                          <span>{task.description || 'No description yet'}</span>
                        </div>
                        <div className="status-actions">
                          {statusColumns.map((status) => (
                            <button
                              className={`button status-button status-button--${status.id}`}
                              disabled={pendingAction === `${task.id}:${status.id}`}
                              key={status.id}
                              onClick={() => void handleSetTaskStatus(task.id, status.id)}
                              type="button"
                            >
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="task-status-grid">
                        {statusColumns.map((status) => {
                          const rows = taskProgress?.[status.id] ?? []

                          return (
                            <div className="task-status-column" key={status.id}>
                              <span className={`status-heading status-heading--${status.id}`}>
                                {status.label}
                              </span>
                              <div className="contributor-list">
                                {rows.map((row) => {
                                  const canUndo =
                                    row.user_id === session.user.id &&
                                    undoableAction &&
                                    undoableAction.new_status === row.status

                                  return (
                                    <span className="contributor-chip" key={row.id}>
                                      {getProfileLabel(row.user_id)}
                                      {canUndo ? (
                                        <button
                                          disabled={pendingAction === `undo:${task.id}`}
                                          onClick={() => void handleUndoTaskStatus(task.id)}
                                          type="button"
                                        >
                                          Undo
                                        </button>
                                      ) : null}
                                    </span>
                                  )
                                })}
                                {!rows.length ? <span className="empty-chip">No one yet</span> : null}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </article>
                  )
                })}
                {!tasks.length ? (
                  <p className="empty-state">Add a task to start the live session.</p>
                ) : null}
              </div>
            </>
          ) : (
            <p className="empty-state">Create a folder to unlock the live session.</p>
          )}
        </section>
      </section>

      {message ? <p className="toast">{message}</p> : null}
      {notificationCount ? (
        <p className="notification-badge" aria-live="polite">
          {notificationCount}
        </p>
      ) : null}
    </main>
  )
}

export default App
