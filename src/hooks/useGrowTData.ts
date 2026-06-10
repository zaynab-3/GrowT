import { useCallback, useMemo } from 'react'
import {
  getCategoryLabel,
  isSharedFolder,
  statusColumns,
} from '../lib/growtDisplay'
import type { TaskProgressStatus } from '../lib/database.types'
import type {
  Folder,
  FolderMember,
  Profile,
  ProfileSummary,
  Task,
  TaskMember,
  TaskStatusAction,
} from '../lib/growtData'
import {
  contributionKey,
  emptyStatusCounts,
  matchesSearch,
  sortActions,
  sortTaskMembers,
  calculateUserProgress,
  type ContributionCounts,
  type StatusContribution,
} from '../lib/growtState'
import { getAvatarSrc } from '../lib/appearance'

type UseGrowTDataParams = {
  actions: TaskStatusAction[]
  currentProfile: Profile | null
  folders: Folder[]
  members: FolderMember[]
  profilesById: Record<string, ProfileSummary>
  searchQuery: string
  selectedFolderId: string | null
  standaloneTasks: Task[]
  taskMembers: TaskMember[]
  tasks: Task[]
  userId: string | null
}

export function useGrowTData({
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
  userId,
}: UseGrowTDataParams) {
  const activeFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) ?? null,
    [selectedFolderId, folders],
  )
  const accountLabel =
    currentProfile?.display_name ?? (currentProfile?.username ? `@${currentProfile.username}` : 'Account')

  const activeActions = useMemo(() => actions.filter((action) => !action.is_undone), [actions])
  const folderTaskIdSet = useMemo(() => new Set(tasks.map((task) => task.id)), [tasks])

  const taskMembersByTask = useMemo(() => {
    const grouped = new Map<string, TaskMember[]>()

    for (const member of taskMembers) {
      grouped.set(member.task_id, [...(grouped.get(member.task_id) ?? []), member])
    }

    for (const [taskId, membersForTask] of grouped) {
      grouped.set(taskId, sortTaskMembers(membersForTask))
    }

    return grouped
  }, [taskMembers])

  const contributionsByTask = useMemo(() => {
    const grouped = new Map<string, Record<TaskProgressStatus, StatusContribution[]>>()
    const seenContributions = new Set<string>()

    for (const action of sortActions(activeActions)) {
      const key = contributionKey(action)
      if (seenContributions.has(key)) {
        continue
      }

      seenContributions.add(key)
      const taskGroup =
        grouped.get(action.task_id) ??
        ({
          ongoing: [],
          half_done: [],
          completed: [],
        } satisfies Record<TaskProgressStatus, StatusContribution[]>)

      taskGroup[action.new_status] = [
        ...taskGroup[action.new_status],
        { action, userId: action.user_id },
      ]
      grouped.set(action.task_id, taskGroup)
    }

    return grouped
  }, [activeActions])

  const statusHistoryByTask = useMemo(() => {
    const grouped = new Map<string, Record<TaskProgressStatus, StatusContribution[]>>()
    const seenStatusMarks = new Set<string>()

    for (const action of sortActions(activeActions)) {
      const key = `${action.task_id}:${action.task_level_id ?? 'root'}:${action.new_status}:${action.user_id}`
      if (seenStatusMarks.has(key)) {
        continue
      }

      seenStatusMarks.add(key)
      const taskGroup =
        grouped.get(action.task_id) ??
        ({
          ongoing: [],
          half_done: [],
          completed: [],
        } satisfies Record<TaskProgressStatus, StatusContribution[]>)

      taskGroup[action.new_status] = [
        ...taskGroup[action.new_status],
        { action, userId: action.user_id },
      ]
      grouped.set(action.task_id, taskGroup)
    }

    return grouped
  }, [activeActions])

  const statusTotals = useMemo(() => {
    const allActiveTasks = [...tasks, ...standaloneTasks]
    return calculateUserProgress(allActiveTasks, actions, userId ?? '')
  }, [tasks, standaloneTasks, actions, userId])

  const activeFolderIsShared = activeFolder ? isSharedFolder(activeFolder) : false
  const canInviteMembers = Boolean(activeFolder && activeFolderIsShared && activeFolder.owner_id === userId)

  const folderMemberUserIds = useMemo(() => {
    if (!activeFolder) {
      return []
    }

    return Array.from(new Set([activeFolder.owner_id, ...members.map((member) => member.user_id)]))
  }, [activeFolder, members])

  const memberContributionCounts = useMemo(() => {
    const countsByUser = new Map<string, ContributionCounts>()
    const seenContributions = new Set<string>()

    const ensureCounts = (memberId: string) => {
      const existing = countsByUser.get(memberId)
      if (existing) {
        return existing
      }

      const counts = emptyStatusCounts()
      countsByUser.set(memberId, counts)
      return counts
    }

    for (const memberId of folderMemberUserIds) {
      ensureCounts(memberId)
    }

    for (const action of activeActions) {
      if (!folderTaskIdSet.has(action.task_id)) {
        continue
      }

      const key = contributionKey(action)
      if (seenContributions.has(key)) {
        continue
      }

      seenContributions.add(key)
      ensureCounts(action.user_id)[action.new_status] += 1
    }

    return countsByUser
  }, [activeActions, folderMemberUserIds, folderTaskIdSet])

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()

  const assignableMembers = useMemo(
    () =>
      folderMemberUserIds.map((memberId) => {
        const profile = profilesById[memberId]
        const label =
          profile?.display_name ??
          (profile?.username ? `@${profile.username}` : memberId === userId ? 'You' : `User ${memberId.slice(0, 8)}`)

        return { id: memberId, label }
      }),
    [folderMemberUserIds, profilesById, userId],
  )

  const standaloneAssignableMembers = useMemo(() => {
    if (!userId) {
      return []
    }

    const profile = profilesById[userId]
    const label = profile?.display_name ?? (profile?.username ? `@${profile.username}` : 'You')

    return [{ id: userId, label }]
  }, [profilesById, userId])

  const filteredFolders = useMemo(() => {
    if (!normalizedSearchQuery) {
      return folders
    }

    return folders.filter((folder) => {
      const folderMembers = members.filter(m => m.folder_id === folder.id)
      const folderMemberValues = folderMembers.flatMap((member) => {
        const profile = profilesById[member.user_id]
        return [profile?.display_name, profile?.username, member.user_id === userId ? 'you' : null]
      })
      
      const ownerProfile = profilesById[folder.owner_id]
      if (ownerProfile) {
        folderMemberValues.push(ownerProfile.display_name, ownerProfile.username, folder.owner_id === userId ? 'you' : null)
      }

      return matchesSearch(normalizedSearchQuery, [
        folder.title,
        folder.description,
        folder.category,
        getCategoryLabel(folder.category),
        isSharedFolder(folder) ? 'shared' : 'private',
        ...folderMemberValues,
      ])
    })
  }, [folders, members, normalizedSearchQuery, profilesById, userId])

  const filteredTasks = useMemo(() => {
    if (!normalizedSearchQuery) {
      return tasks
    }

    return tasks.filter((task) => {
      const assignedProfile = task.assigned_user_id ? profilesById[task.assigned_user_id] : null
      const contributorValues = statusColumns.flatMap((status) => {
        const rows = contributionsByTask.get(task.id)?.[status.id] ?? []

        return rows.flatMap((row) => {
          const profile = profilesById[row.userId]
          return [profile?.display_name, profile?.username, status.label, status.id]
        })
      })

      return matchesSearch(normalizedSearchQuery, [
        task.title,
        task.description,
        task.category,
        getCategoryLabel(task.category),
        task.is_active ? 'active' : 'inactive',
        assignedProfile?.display_name,
        assignedProfile?.username,
        ...contributorValues,
      ])
    })
  }, [contributionsByTask, normalizedSearchQuery, profilesById, tasks])

  const filteredStandaloneTasks = useMemo(() => {
    if (!normalizedSearchQuery) {
      return standaloneTasks
    }

    return standaloneTasks.filter((task) => {
      const memberValues = (taskMembersByTask.get(task.id) ?? []).flatMap((member) => {
        const profile = profilesById[member.user_id]
        return [profile?.display_name, profile?.username, member.role]
      })
      const contributorValues = statusColumns.flatMap((status) => {
        const rows = contributionsByTask.get(task.id)?.[status.id] ?? []

        return rows.flatMap((row) => {
          const profile = profilesById[row.userId]
          return [profile?.display_name, profile?.username, status.label, status.id]
        })
      })

      return matchesSearch(normalizedSearchQuery, [
        task.title,
        task.description,
        task.category,
        getCategoryLabel(task.category),
        task.is_active ? 'active' : 'inactive',
        'standalone',
        'my tasks',
        ...memberValues,
        ...contributorValues,
      ])
    })
  }, [contributionsByTask, normalizedSearchQuery, profilesById, standaloneTasks, taskMembersByTask])

  const getProfileAvatar = useCallback(
    (profileId: string | undefined | null) => {
      if (!profileId) return null
      const profile = profilesById[profileId]
      if (!profile) return null
      return profile.avatar_url?.trim() || getAvatarSrc(profile.avatar_choice)
    },
    [profilesById],
  )

  const getProfileLabel = useCallback(
    (profileId: string | undefined | null) => {
      if (!profileId) {
        return 'Unknown User'
      }

      const profile = profilesById[profileId]

      if (profile?.display_name) {
        return profile.display_name
      }

      if (profile?.username) {
        return `@${profile.username}`
      }

      if (profileId === userId) {
        return 'You'
      }

      return `User ${profileId.slice(0, 8)}`
    },
    [profilesById, userId],
  )

  const getContributionCounts = useCallback(
    (memberId: string) => memberContributionCounts.get(memberId) ?? emptyStatusCounts(),
    [memberContributionCounts],
  )

  return {
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
    getProfileAvatar,
    getProfileLabel,
    normalizedSearchQuery,
    standaloneAssignableMembers,
    statusTotals,
    statusHistoryByTask,
    taskMembersByTask,
  }
}
