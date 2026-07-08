import type { Task, TaskStatusAction } from './growtData'

export type RecipientCreditKind =
  | 'ongoing'
  | 'half_done'
  | 'fully_completed'
  | 'completed_other_half'

export type RecipientTaskState = RecipientCreditKind | 'not_started'

export type RecipientCredit = {
  amount: number
  kind: RecipientCreditKind
  taskAmount: number
  taskId: string
  taskTitle: string
  userId: string
}

export type RecipientUserSummary = {
  amount: number
  completedOtherHalf: number
  credits: RecipientCredit[]
  fullyCompleted: number
  halfDone: number
  ongoing: number
  userId: string
}

export type RecipientReport = {
  completedTaskCount: number
  paidAmount: number
  taskCount: number
  taskStates: Record<RecipientTaskState, number>
  users: RecipientUserSummary[]
}

export type RecipientFolderReview = {
  folderId: string
  folderTitle: string
  report: RecipientReport
}

export const recipientLegend = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'half_done', label: 'Half Done' },
  { key: 'fully_completed', label: 'Fully Completed' },
  { key: 'completed_other_half', label: 'Completed Other Half' },
] as const

const currencyFormatter = new Intl.NumberFormat(undefined, {
  currency: 'USD',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'currency',
})

export function formatCurrency(amount: number) {
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function parseRecipientAmount(value: string) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) {
    return 0
  }

  return Math.round(amount * 100) / 100
}

function normalizeAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0
  }

  return Math.round(amount * 100) / 100
}

function splitAmount(amount: number) {
  return Math.round((amount / 2) * 100) / 100
}

function compareActionAsc(first: TaskStatusAction, second: TaskStatusAction) {
  const createdAtDiff = Date.parse(first.created_at) - Date.parse(second.created_at)
  if (createdAtDiff !== 0) {
    return createdAtDiff
  }

  return first.id.localeCompare(second.id)
}

function applyCredit(
  summaries: Map<string, RecipientUserSummary>,
  credit: RecipientCredit,
) {
  const summary =
    summaries.get(credit.userId) ??
    {
      amount: 0,
      completedOtherHalf: 0,
      credits: [],
      fullyCompleted: 0,
      halfDone: 0,
      ongoing: 0,
      userId: credit.userId,
    }

  summary.amount = normalizeAmount(summary.amount + credit.amount)
  summary.credits.push(credit)

  if (credit.kind === 'ongoing') {
    summary.ongoing += 1
  } else if (credit.kind === 'half_done') {
    summary.halfDone += 1
  } else if (credit.kind === 'fully_completed') {
    summary.fullyCompleted += 1
  } else {
    summary.completedOtherHalf += 1
  }

  summaries.set(credit.userId, summary)
}

export function buildRecipientReport(tasks: Task[], actions: TaskStatusAction[]): RecipientReport {
  const taskStates: RecipientReport['taskStates'] = {
    completed_other_half: 0,
    fully_completed: 0,
    half_done: 0,
    not_started: 0,
    ongoing: 0,
  }
  const summaries = new Map<string, RecipientUserSummary>()
  const activeRootActions = actions
    .filter((action) => !action.is_undone && action.task_level_id === null)
    .sort(compareActionAsc)

  for (const task of tasks) {
    const taskActions = activeRootActions.filter((action) => action.task_id === task.id)
    const latestActionByUser = new Map<string, TaskStatusAction>()

    for (const action of taskActions) {
      latestActionByUser.set(action.user_id, action)
    }

    const currentActions = Array.from(latestActionByUser.values()).sort(compareActionAsc)
    const taskAmount = normalizeAmount(task.recipient_amount)
    const completionAction = currentActions.find((action) => action.new_status === 'completed')

    if (completionAction) {
      const currentHalfAction = [...currentActions]
        .filter(
          (action) =>
            action.new_status === 'half_done' &&
            compareActionAsc(action, completionAction) < 0,
        )
        .at(-1)

      if (currentHalfAction && currentHalfAction.user_id !== completionAction.user_id) {
        const halfAmount = splitAmount(taskAmount)
        taskStates.completed_other_half += 1
        applyCredit(summaries, {
          amount: halfAmount,
          kind: 'half_done',
          taskAmount,
          taskId: task.id,
          taskTitle: task.title,
          userId: currentHalfAction.user_id,
        })
        applyCredit(summaries, {
          amount: normalizeAmount(taskAmount - halfAmount),
          kind: 'completed_other_half',
          taskAmount,
          taskId: task.id,
          taskTitle: task.title,
          userId: completionAction.user_id,
        })
        continue
      }

      taskStates.fully_completed += 1
      applyCredit(summaries, {
        amount: taskAmount,
        kind: 'fully_completed',
        taskAmount,
        taskId: task.id,
        taskTitle: task.title,
        userId: completionAction.user_id,
      })
      continue
    }

    const halfAction = [...currentActions].filter((action) => action.new_status === 'half_done').at(-1)
    if (halfAction) {
      taskStates.half_done += 1
      applyCredit(summaries, {
        amount: splitAmount(taskAmount),
        kind: 'half_done',
        taskAmount,
        taskId: task.id,
        taskTitle: task.title,
        userId: halfAction.user_id,
      })
      continue
    }

    const ongoingAction = [...currentActions].filter((action) => action.new_status === 'ongoing').at(-1)
    if (ongoingAction) {
      taskStates.ongoing += 1
      applyCredit(summaries, {
        amount: 0,
        kind: 'ongoing',
        taskAmount,
        taskId: task.id,
        taskTitle: task.title,
        userId: ongoingAction.user_id,
      })
      continue
    }

    taskStates.not_started += 1
  }

  const users = Array.from(summaries.values()).sort((first, second) => {
    if (second.amount !== first.amount) {
      return second.amount - first.amount
    }

    return first.userId.localeCompare(second.userId)
  })

  return {
    completedTaskCount: taskStates.fully_completed + taskStates.completed_other_half,
    paidAmount: normalizeAmount(users.reduce((sum, user) => sum + user.amount, 0)),
    taskCount: tasks.length,
    taskStates,
    users,
  }
}

export function combineRecipientReports(reports: RecipientReport[]): RecipientReport {
  const taskStates: RecipientReport['taskStates'] = {
    completed_other_half: 0,
    fully_completed: 0,
    half_done: 0,
    not_started: 0,
    ongoing: 0,
  }
  const summaries = new Map<string, RecipientUserSummary>()

  for (const report of reports) {
    taskStates.completed_other_half += report.taskStates.completed_other_half
    taskStates.fully_completed += report.taskStates.fully_completed
    taskStates.half_done += report.taskStates.half_done
    taskStates.not_started += report.taskStates.not_started
    taskStates.ongoing += report.taskStates.ongoing

    for (const user of report.users) {
      const summary =
        summaries.get(user.userId) ??
        {
          amount: 0,
          completedOtherHalf: 0,
          credits: [],
          fullyCompleted: 0,
          halfDone: 0,
          ongoing: 0,
          userId: user.userId,
        }

      summary.amount = normalizeAmount(summary.amount + user.amount)
      summary.completedOtherHalf += user.completedOtherHalf
      summary.credits.push(...user.credits)
      summary.fullyCompleted += user.fullyCompleted
      summary.halfDone += user.halfDone
      summary.ongoing += user.ongoing
      summaries.set(user.userId, summary)
    }
  }

  const users = Array.from(summaries.values()).sort((first, second) => {
    if (second.amount !== first.amount) {
      return second.amount - first.amount
    }

    return first.userId.localeCompare(second.userId)
  })

  return {
    completedTaskCount: taskStates.fully_completed + taskStates.completed_other_half,
    paidAmount: normalizeAmount(reports.reduce((sum, report) => sum + report.paidAmount, 0)),
    taskCount: reports.reduce((sum, report) => sum + report.taskCount, 0),
    taskStates,
    users,
  }
}
