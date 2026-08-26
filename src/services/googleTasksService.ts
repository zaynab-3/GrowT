import type { Task } from '../lib/growtData'
import { finishGoogleTasksSync, syncGoogleTask } from './taskService'

const GOOGLE_TASKS_API = 'https://tasks.googleapis.com/tasks/v1'

type GoogleTaskList = {
  id: string
  title: string
}

type GoogleTask = {
  deleted?: boolean
  due?: string
  hidden?: boolean
  id: string
  links?: Array<{ link?: string }>
  notes?: string
  status?: 'completed' | 'needsAction'
  title?: string
  updated?: string
  webViewLink?: string
  assignmentInfo?: {
    linkToTask?: string
  }
}

type GooglePage<T> = {
  items?: T[]
  nextPageToken?: string
}

export type GoogleTasksSyncResult = {
  deactivated: number
  imported: number
  lists: number
  tasks: Task[]
}

export class GoogleTasksAuthorizationError extends Error {
  constructor(message = 'Google Tasks access needs to be reconnected.') {
    super(message)
    this.name = 'GoogleTasksAuthorizationError'
  }
}

async function getGooglePage<T>(url: URL, providerToken: string): Promise<GooglePage<T>> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${providerToken}`,
    },
  })

  if (response.status === 401 || response.status === 403) {
    throw new GoogleTasksAuthorizationError()
  }

  if (!response.ok) {
    let message = `Google Tasks returned ${response.status}.`

    try {
      const body = await response.json() as { error?: { message?: string } }
      message = body.error?.message || message
    } catch {
      // Keep the status-based message when Google did not return JSON.
    }

    throw new Error(message)
  }

  return response.json() as Promise<GooglePage<T>>
}

async function listAllPages<T>(
  createUrl: (pageToken: string | null) => URL,
  providerToken: string,
) {
  const items: T[] = []
  let pageToken: string | null = null

  do {
    const page: GooglePage<T> = await getGooglePage<T>(createUrl(pageToken), providerToken)
    items.push(...(page.items ?? []))
    pageToken = page.nextPageToken ?? null
  } while (pageToken)

  return items
}

async function listGoogleTaskLists(providerToken: string) {
  return listAllPages<GoogleTaskList>((pageToken) => {
    const url = new URL(`${GOOGLE_TASKS_API}/users/@me/lists`)
    url.searchParams.set('maxResults', '100')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    return url
  }, providerToken)
}

async function listOpenGoogleTasks(providerToken: string, taskListId: string) {
  return listAllPages<GoogleTask>((pageToken) => {
    const url = new URL(`${GOOGLE_TASKS_API}/lists/${encodeURIComponent(taskListId)}/tasks`)
    url.searchParams.set('maxResults', '100')
    url.searchParams.set('showAssigned', 'true')
    url.searchParams.set('showCompleted', 'false')
    url.searchParams.set('showDeleted', 'false')
    url.searchParams.set('showHidden', 'false')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    return url
  }, providerToken)
}

export async function syncGoogleTasksIntoGrowT(providerToken: string): Promise<GoogleTasksSyncResult> {
  const taskLists = await listGoogleTaskLists(providerToken)
  const syncedTasks: Task[] = []
  let deactivated = 0

  // Keep writes sequential so newly imported tasks receive stable positions.
  for (const taskList of taskLists) {
    const googleTasks = await listOpenGoogleTasks(providerToken, taskList.id)
    const activeGoogleTaskIds: string[] = []

    for (const googleTask of googleTasks) {
      const title = googleTask.title?.trim()
      if (!title || googleTask.deleted || googleTask.hidden || googleTask.status === 'completed') {
        continue
      }

      activeGoogleTaskIds.push(googleTask.id)
      syncedTasks.push(await syncGoogleTask({
        description: googleTask.notes?.trim() || null,
        dueDate: googleTask.due ?? null,
        externalListId: taskList.id,
        externalTaskId: googleTask.id,
        externalUpdatedAt: googleTask.updated ?? null,
        externalUrl: googleTask.webViewLink
          ?? googleTask.assignmentInfo?.linkToTask
          ?? googleTask.links?.find((link) => link.link?.startsWith('https://'))?.link
          ?? null,
        title,
      }))
    }

    deactivated += await finishGoogleTasksSync(taskList.id, activeGoogleTaskIds)
  }

  return {
    deactivated,
    imported: syncedTasks.length,
    lists: taskLists.length,
    tasks: syncedTasks,
  }
}
