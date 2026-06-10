import { type Dispatch, type RefObject, type SetStateAction, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type {
  Folder,
  FolderMember,
  Profile,
  ProfileSummary,
  Task,
  TaskMember,
  TaskProgress,
  TaskStatusAction,
} from '../lib/growtData'
import {
  sortActions,
  sortByPositionAndCreatedAt,
  sortFolders,
  sortTaskMembers,
  upsertById,
  type RealtimePayload,
} from '../lib/growtState'

type RelatedTaskPayload = {
  new: { task_id?: string }
  old: { task_id?: string }
}

type UseGrowTRealtimeParams = {
  actionsRef: RefObject<TaskStatusAction[]>
  activeFolder: Folder | null
  authReady: boolean
  loadProfilesForIds: (userIds: string[]) => Promise<void>
  progressRef: RefObject<TaskProgress[]>
  refreshArchive: () => Promise<void>
  refreshFoldersRef: RefObject<() => Promise<void>>
  refreshLiveSessionRef: RefObject<() => Promise<void>>
  refreshStandaloneTasks: () => Promise<void>
  setActions: Dispatch<SetStateAction<TaskStatusAction[]>>
  setFolders: Dispatch<SetStateAction<Folder[]>>
  setMembers: Dispatch<SetStateAction<FolderMember[]>>
  setProfilesById: Dispatch<SetStateAction<Record<string, ProfileSummary>>>
  setProgress: Dispatch<SetStateAction<TaskProgress[]>>
  setRealtimeStatus: Dispatch<SetStateAction<string>>
  setSelectedFolderId: Dispatch<SetStateAction<string | null>>
  setStandaloneTasks: Dispatch<SetStateAction<Task[]>>
  setTaskMembers: Dispatch<SetStateAction<TaskMember[]>>
  setTasks: Dispatch<SetStateAction<Task[]>>
  standaloneTaskIdsRef: RefObject<Set<string>>
  taskIdsRef: RefObject<Set<string>>
  userId: string | null
}

export function useGrowTRealtime({
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
}: UseGrowTRealtimeParams) {
  useEffect(() => {
    if (!authReady || !supabase || !userId) {
      return
    }

    const realtimeClient = supabase

    const refreshUserFolders = () => {
      void refreshFoldersRef.current()
      void refreshLiveSessionRef.current()
      void refreshArchive()
    }

    const refreshUserTasks = () => {
      void refreshStandaloneTasks()
      void refreshArchive()
    }

    const applyProfileChange = (payload: RealtimePayload<Profile>) => {
      if (payload.eventType === 'UPDATE') {
        const updatedProfile = payload.new as Profile
        if (updatedProfile && updatedProfile.id) {
          setProfilesById((current) => {
            if (!current[updatedProfile.id]) {
              return current
            }
            return {
              ...current,
              [updatedProfile.id]: {
                ...current[updatedProfile.id],
                ...updatedProfile,
              },
            }
          })
        }
      }
    }

    const channel = realtimeClient
      .channel(`live-user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'folder_members',
          filter: `user_id=eq.${userId}`,
        },
        refreshUserFolders,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'folder_members',
          filter: `user_id=eq.${userId}`,
        },
        refreshUserFolders,
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'folder_members' },
        refreshUserFolders,
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'folders' },
        refreshUserFolders,
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'folders' },
        refreshUserFolders,
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'folders' },
        refreshUserFolders,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `owner_id=eq.${userId}` },
        refreshUserTasks,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_progress', filter: `user_id=eq.${userId}` },
        refreshUserTasks,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_status_actions', filter: `user_id=eq.${userId}` },
        refreshUserTasks,
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => applyProfileChange(payload as RealtimePayload<Profile>),
      )
      .subscribe()

    return () => {
      void realtimeClient.removeChannel(channel)
    }
  }, [
    authReady,
    refreshArchive,
    refreshFoldersRef,
    refreshLiveSessionRef,
    refreshStandaloneTasks,
    setProfilesById,
    userId,
  ])

  useEffect(() => {
    if (!authReady || !supabase || !userId) {
      return
    }

    const realtimeClient = supabase

    const removeStandaloneTask = (taskId: string) => {
      setStandaloneTasks((current) => current.filter((task) => task.id !== taskId))
      setTaskMembers((current) => current.filter((member) => member.task_id !== taskId))
      setProgress((current) => current.filter((item) => item.task_id !== taskId))
      setActions((current) => current.filter((action) => action.task_id !== taskId))
    }

    const applyStandaloneTaskChange = (payload: RealtimePayload<Task>) => {
      if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id
        if (deletedId && standaloneTaskIdsRef.current.has(deletedId)) {
          removeStandaloneTask(deletedId)
          void refreshArchive()
        }

        return
      }

      const changedTask = payload.new as Task
      const isVisible = standaloneTaskIdsRef.current.has(changedTask.id)

      if (changedTask.folder_id) {
        return
      }

      const currentUserCanSeeTask =
        changedTask.owner_id === userId || (changedTask.category === 'shared' && isVisible)

      if (changedTask.deleted_at || !currentUserCanSeeTask) {
        if (isVisible) {
          removeStandaloneTask(changedTask.id)
        }

        return
      }

      setStandaloneTasks((current) => sortByPositionAndCreatedAt(upsertById(current, changedTask)))
      void loadProfilesForIds([changedTask.owner_id, changedTask.assigned_user_id ?? ''])
      void refreshStandaloneTasks()
    }

    const applyStandaloneMemberChange = (payload: RealtimePayload<TaskMember>) => {
      if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id
        const deletedTaskId = payload.old.task_id
        const wasCurrentUser = payload.old.user_id === userId

        if (deletedId) {
          setTaskMembers((current) => current.filter((member) => member.id !== deletedId))
        }

        if (!deletedTaskId || standaloneTaskIdsRef.current.has(deletedTaskId) || wasCurrentUser) {
          void refreshStandaloneTasks()
        }

        return
      }

      const changedMember = payload.new as TaskMember
      const belongsToVisibleTask = standaloneTaskIdsRef.current.has(changedMember.task_id)

      if (changedMember.user_id !== userId && !belongsToVisibleTask) {
        return
      }

      setTaskMembers((current) => sortTaskMembers(upsertById(current, changedMember)))
      void loadProfilesForIds([changedMember.user_id])
      void refreshStandaloneTasks()
    }

    const applyStandaloneProgressChange = (payload: RealtimePayload<TaskProgress>) => {
      if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id
        if (deletedId && progressRef.current.some((item) => item.id === deletedId)) {
          setProgress((current) => current.filter((item) => item.id !== deletedId))
        }

        return
      }

      const changedProgress = payload.new as TaskProgress
      if (!standaloneTaskIdsRef.current.has(changedProgress.task_id)) {
        return
      }

      setProgress((current) => upsertById(current, changedProgress))
      void loadProfilesForIds([changedProgress.user_id])
    }

    const applyStandaloneActionChange = (payload: RealtimePayload<TaskStatusAction>) => {
      if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id
        if (deletedId && actionsRef.current.some((action) => action.id === deletedId)) {
          setActions((current) => current.filter((action) => action.id !== deletedId))
        }

        return
      }

      const changedAction = payload.new as TaskStatusAction
      if (!standaloneTaskIdsRef.current.has(changedAction.task_id)) {
        return
      }

      setActions((current) => sortActions(upsertById(current, changedAction)))
      void loadProfilesForIds([changedAction.user_id])
    }

    const refreshStandaloneOnRelatedChange = (payload: RelatedTaskPayload) => {
      const taskId = payload.new.task_id ?? payload.old.task_id

      if (taskId && standaloneTaskIdsRef.current.has(taskId)) {
        void refreshStandaloneTasks()
      }
    }

    const channel = realtimeClient
      .channel(`live-standalone:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => applyStandaloneTaskChange(payload as RealtimePayload<Task>),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_members' },
        (payload) => applyStandaloneMemberChange(payload as RealtimePayload<TaskMember>),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_levels' },
        (payload) => refreshStandaloneOnRelatedChange(payload as RelatedTaskPayload),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_progress' },
        (payload) => applyStandaloneProgressChange(payload as RealtimePayload<TaskProgress>),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_status_actions' },
        (payload) => applyStandaloneActionChange(payload as RealtimePayload<TaskStatusAction>),
      )
      .subscribe()

    return () => {
      void realtimeClient.removeChannel(channel)
    }
  }, [
    actionsRef,
    authReady,
    loadProfilesForIds,
    progressRef,
    refreshArchive,
    refreshStandaloneTasks,
    setActions,
    setProgress,
    setStandaloneTasks,
    setTaskMembers,
    standaloneTaskIdsRef,
    userId,
  ])

  useEffect(() => {
    if (!authReady || !supabase || !userId || !activeFolder) {
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

    const refreshOnRelatedChange = (payload: RelatedTaskPayload) => {
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
        (payload) => refreshOnRelatedChange(payload as RelatedTaskPayload),
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('Live')
          return
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('Offline')
          return
        }

        setRealtimeStatus('Connecting')
      })

    return () => {
      void realtimeClient.removeChannel(channel)
      setRealtimeStatus('Idle')
    }
  }, [
    actionsRef,
    activeFolder,
    authReady,
    loadProfilesForIds,
    progressRef,
    refreshFoldersRef,
    refreshLiveSessionRef,
    setActions,
    setFolders,
    setMembers,
    setProgress,
    setRealtimeStatus,
    setSelectedFolderId,
    setTasks,
    taskIdsRef,
    userId,
  ])
}
