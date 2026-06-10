export type AppView =
  | 'dashboard'
  | 'folders'
  | 'tasks'
  | 'acquaintances'
  | 'notifications'
  | 'restore'
  | 'settings'
  | 'invite'

export type AppRoute =
  | { name: 'dashboard' }
  | { name: 'folders' }
  | { name: 'folder-new' }
  | { name: 'folder-detail'; folderId: string }
  | { name: 'folder-edit'; folderId: string }
  | { name: 'tasks' }
  | { name: 'task-new'; folderId?: string }
  | { name: 'task-detail'; taskId: string; folderId?: string }
  | { name: 'task-edit'; taskId: string; folderId?: string }
  | { name: 'acquaintances' }
  | { name: 'notifications' }
  | { name: 'restore' }
  | { name: 'settings' }
  | { name: 'invite'; inviteId: string }

export type AppViewNavItem = {
  description: string
  id: AppView
  label: string
  meta?: string
}

const viewRoutes: Record<AppView, AppRoute> = {
  acquaintances: { name: 'acquaintances' },
  dashboard: { name: 'dashboard' },
  folders: { name: 'folders' },
  notifications: { name: 'notifications' },
  restore: { name: 'restore' },
  settings: { name: 'settings' },
  tasks: { name: 'tasks' },
  invite: { name: 'invite', inviteId: '' },
}

function encodeSegment(segment: string) {
  return encodeURIComponent(segment)
}

function decodeSegment(segment: string | undefined) {
  return segment ? decodeURIComponent(segment) : ''
}

export function routeForView(view: AppView): AppRoute {
  return viewRoutes[view]
}

export function getRouteView(route: AppRoute): AppView {
  switch (route.name) {
    case 'folder-detail':
    case 'folder-edit':
    case 'folder-new':
      return 'folders'
    case 'task-detail':
    case 'task-edit':
    case 'task-new':
      return 'tasks'
    case 'invite':
      return 'invite'
    default:
      return route.name
  }
}

export function routeFolderId(route: AppRoute) {
  switch (route.name) {
    case 'folder-detail':
    case 'folder-edit':
    case 'task-new':
      return route.folderId ?? null
    case 'task-detail':
    case 'task-edit':
      return route.folderId ?? null
    default:
      return null
  }
}

export function parseAppRoute(pathname = window.location.pathname): AppRoute {
  const segments = pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)

  if (!segments.length || segments[0] === 'dashboard') {
    return { name: 'dashboard' }
  }

  if (segments[0] === 'folders') {
    if (segments[1] === 'new') {
      return { name: 'folder-new' }
    }

    const folderId = decodeSegment(segments[1])

    if (!folderId) {
      return { name: 'folders' }
    }

    if (segments[2] === 'edit') {
      return { name: 'folder-edit', folderId }
    }

    if (segments[2] === 'tasks') {
      if (segments[3] === 'new') {
        return { name: 'task-new', folderId }
      }

      const taskId = decodeSegment(segments[3])

      if (taskId && segments[4] === 'edit') {
        return { name: 'task-edit', folderId, taskId }
      }

      if (taskId) {
        return { name: 'task-detail', folderId, taskId }
      }
    }

    return { name: 'folder-detail', folderId }
  }

  if (segments[0] === 'tasks') {
    if (segments[1] === 'new') {
      return { name: 'task-new' }
    }

    const taskId = decodeSegment(segments[1])

    if (taskId && segments[2] === 'edit') {
      return { name: 'task-edit', taskId }
    }

    if (taskId) {
      return { name: 'task-detail', taskId }
    }

    return { name: 'tasks' }
  }

  if (segments[0] === 'acquaintances') {
    return { name: 'acquaintances' }
  }

  if (segments[0] === 'notifications') {
    return { name: 'notifications' }
  }

  if (segments[0] === 'restore') {
    return { name: 'restore' }
  }

  if (segments[0] === 'settings') {
    return { name: 'settings' }
  }

  if (segments[0] === 'invite') {
    return { name: 'invite', inviteId: decodeSegment(segments[1]) }
  }

  return { name: 'dashboard' }
}

export function routeToPath(route: AppRoute): string {
  switch (route.name) {
    case 'dashboard':
      return '/dashboard'
    case 'folders':
      return '/folders'
    case 'folder-new':
      return '/folders/new'
    case 'folder-detail':
      return `/folders/${encodeSegment(route.folderId)}`
    case 'folder-edit':
      return `/folders/${encodeSegment(route.folderId)}/edit`
    case 'tasks':
      return '/tasks'
    case 'task-new':
      return route.folderId ? `/folders/${encodeSegment(route.folderId)}/tasks/new` : '/tasks/new'
    case 'task-detail':
      return route.folderId
        ? `/folders/${encodeSegment(route.folderId)}/tasks/${encodeSegment(route.taskId)}`
        : `/tasks/${encodeSegment(route.taskId)}`
    case 'task-edit':
      return route.folderId
        ? `/folders/${encodeSegment(route.folderId)}/tasks/${encodeSegment(route.taskId)}/edit`
        : `/tasks/${encodeSegment(route.taskId)}/edit`
    case 'acquaintances':
      return '/acquaintances'
    case 'notifications':
      return '/notifications'
    case 'restore':
      return '/restore'
    case 'settings':
      return '/settings'
    case 'invite':
      return `/invite/${encodeSegment(route.inviteId)}`
  }
}
