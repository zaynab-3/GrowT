export type AppView =
  | 'dashboard'
  | 'my-tasks'
  | 'shared'
  | 'acquaintances'
  | 'notifications'
  | 'restore'
  | 'settings'

export type AppViewNavItem = {
  description: string
  id: AppView
  label: string
  meta?: string
}
