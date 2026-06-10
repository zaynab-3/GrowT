import './DashboardView.css'
import { FolderOpen, CheckSquare, Share2, Archive, Activity, Wifi, Bell } from 'lucide-react'
import type { AppView } from './viewTypes'
import { useNotifications } from '../features/notifications/useNotifications'
import { formatDateTime } from '../lib/growtDisplay'

type DashboardViewProps = {
  activeFolderDescription: string
  activeFolderTitle: string
  deletedCount: number
  folderCount: number
  onNavigate: (view: AppView) => void
  realtimeLabel: string
  sharedCount: number
  statusTotals: {
    completed: number
    half_done: number
    ongoing: number
  }
  taskCount: number
  totalTasksCount: number
  folderGrowth: number | null
  taskGrowth: number | null
  sharedGrowth: number | null
  deletedGrowth: number | null
}

export function DashboardView({
  deletedCount,
  folderCount,
  onNavigate,
  realtimeLabel,
  sharedCount,
  statusTotals,
  taskCount,
  totalTasksCount,
  folderGrowth,
  taskGrowth,
  sharedGrowth,
  deletedGrowth,
}: DashboardViewProps) {
  const completedPercent = totalTasksCount > 0 ? Math.round((statusTotals.completed / totalTasksCount) * 100) : 0
  const halfDonePercent = totalTasksCount > 0 ? Math.round((statusTotals.half_done / totalTasksCount) * 100) : 0
  const ongoingPercent = totalTasksCount > 0 ? Math.round((statusTotals.ongoing / totalTasksCount) * 100) : 0

  const { notifications } = useNotifications()
  const recentNotifications = notifications.slice(0, 5)

  return (
    <section className="screen dashboard-screen">
      <div className="workspace-header-compact">
        <h1>Overview</h1>
        <p style={{ margin: '2px 0 0', color: 'var(--ink-3)', fontSize: '13.5px' }}>
          Here's what's happening in your workspace today.
        </p>
      </div>

      <div className="dashboard-bento-grid">
        {/* Stats Grid Container */}
        <div className="stats-grid-container">
          {/* Card 1: Folders */}
          <button 
            className="dashboard-stat-card stat-card--folders"
            onClick={() => onNavigate('folders')}
            type="button"
          >
            <div className="stat-card-header">
              <div className="stat-card-icon-wrapper">
                <FolderOpen size={20} />
              </div>
              {folderCount > 0 && folderGrowth !== null && (
                <span className={`stat-card-badge ${folderGrowth > 0 ? 'text-primary' : folderGrowth < 0 ? 'text-error' : ''}`}>
                  {folderGrowth > 0 ? '+' : ''}{folderGrowth}%
                </span>
              )}
            </div>
            <h3 className="stat-card-label">Total Folders</h3>
            <p className="stat-card-value">{folderCount}</p>
          </button>

          {/* Card 2: Tasks */}
          <button 
            className="dashboard-stat-card stat-card--tasks"
            onClick={() => onNavigate('tasks')}
            type="button"
          >
            <div className="stat-card-header">
              <div className="stat-card-icon-wrapper">
                <CheckSquare size={20} />
              </div>
              {taskCount > 0 && taskGrowth !== null && (
                <span className={`stat-card-badge ${taskGrowth > 0 ? 'text-primary' : taskGrowth < 0 ? 'text-error' : ''}`}>
                  {taskGrowth > 0 ? '+' : ''}{taskGrowth}%
                </span>
              )}
            </div>
            <h3 className="stat-card-label">My Tasks</h3>
            <p className="stat-card-value">{taskCount}</p>
          </button>

          {/* Card 3: Shared Items */}
          <div 
            className="dashboard-stat-card stat-card--shared"
            style={{ cursor: 'default', pointerEvents: 'none' }}
          >
            <div className="stat-card-header">
              <div className="stat-card-icon-wrapper">
                <Share2 size={20} />
              </div>
              {sharedCount > 0 && sharedGrowth !== null && (
                <span className={`stat-card-badge ${sharedGrowth > 0 ? 'text-primary' : sharedGrowth < 0 ? 'text-error' : ''}`}>
                  {sharedGrowth > 0 ? '+' : ''}{sharedGrowth}%
                </span>
              )}
            </div>
            <h3 className="stat-card-label">Shared Items</h3>
            <p className="stat-card-value">{sharedCount}</p>
          </div>

          {/* Card 4: Archive Items */}
          <button 
            className="dashboard-stat-card stat-card--archive"
            onClick={() => onNavigate('restore')}
            type="button"
          >
            <div className="stat-card-header">
              <div className="stat-card-icon-wrapper">
                <Archive size={20} />
              </div>
              {deletedCount > 0 && deletedGrowth !== null && (
                <span className={`stat-card-badge ${deletedGrowth > 0 ? 'text-error' : deletedGrowth < 0 ? 'text-primary' : ''}`}>
                  {deletedGrowth > 0 ? '+' : ''}{deletedGrowth}%
                </span>
              )}
            </div>
            <h3 className="stat-card-label">Archive Items</h3>
            <p className="stat-card-value">{deletedCount}</p>
          </button>
        </div>

        {/* Main Middle Split Section */}
        <div className="dashboard-main-section">
          {/* Task Completion (spans 2 cols) */}
          <div className="task-completion-col">
            <div className="dashboard-panel">
              <div className="panel-header-row">
                <div className="panel-title-container">
                  <h2 className="panel-heading">Task Completion</h2>
                  <p className="panel-subheading">Weekly progress overview</p>
                </div>
              </div>

              <div className="progress-bars-stack">
                {/* Completed */}
                <div className="progress-bar-item">
                  <div className="bar-info-row">
                    <span className="bar-label-group">
                      <span className="bar-color-dot bar-color-dot--completed" />
                      Completed
                    </span>
                    <span className="bar-percentage-value">{completedPercent}% ({statusTotals.completed})</span>
                  </div>
                  <div className="bar-track-line">
                    <div 
                      className="bar-fill-line bar-fill-line--completed" 
                      style={{ width: `${completedPercent}%` }} 
                    />
                  </div>
                </div>

                {/* Half Done */}
                <div className="progress-bar-item">
                  <div className="bar-info-row">
                    <span className="bar-label-group">
                      <span className="bar-color-dot bar-color-dot--halfdone" />
                      Half Done
                    </span>
                    <span className="bar-percentage-value">{halfDonePercent}% ({statusTotals.half_done})</span>
                  </div>
                  <div className="bar-track-line">
                    <div 
                      className="bar-fill-line bar-fill-line--halfdone" 
                      style={{ width: `${halfDonePercent}%` }} 
                    />
                  </div>
                </div>

                {/* Ongoing */}
                <div className="progress-bar-item">
                  <div className="bar-info-row">
                    <span className="bar-label-group">
                      <span className="bar-color-dot bar-color-dot--ongoing" />
                      Ongoing
                    </span>
                    <span className="bar-percentage-value">{ongoingPercent}% ({statusTotals.ongoing})</span>
                  </div>
                  <div className="bar-track-line">
                    <div 
                      className="bar-fill-line bar-fill-line--ongoing" 
                      style={{ width: `${ongoingPercent}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Activity (spans 1 col) */}
          <div className="live-activity-col">
            <div className="dashboard-panel dashboard-panel--activity">
              <div className="panel-header-row">
                <h2 className="panel-heading">Live Activity</h2>
                <div className="panel-header-icon active-pulse">
                  <Activity size={18} />
                </div>
              </div>

              {recentNotifications.length > 0 ? (
                <div className="flex flex-col gap-2 mt-4 max-h-[300px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                  {recentNotifications.map(notification => (
                    <div key={notification.id} className={`flex items-start gap-3 p-3 rounded-xl border ${notification.read_at ? 'bg-transparent border-surface-variant/30' : 'bg-primary/5 border-primary/20'} transition-colors`}>
                      <div className={`mt-0.5 rounded-full p-1.5 ${notification.read_at ? 'bg-surface-variant text-on-surface-variant' : 'bg-primary/20 text-primary'}`}>
                        <Bell size={14} />
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className={`text-sm font-medium ${notification.read_at ? 'text-on-surface' : 'text-on-surface font-semibold'} break-words`}>
                          {notification.title}
                        </span>
                        <span className="text-xs text-on-surface-variant line-clamp-2">
                          {notification.message}
                        </span>
                        <span className="text-[10px] text-on-surface-variant/70 mt-1 uppercase tracking-wider font-bold">
                          {formatDateTime(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="activity-empty-state">
                  <div className="empty-state-icon-circle">
                    <Wifi size={24} />
                  </div>
                  <h3 className="empty-state-title">No Recent Activity</h3>
                  <p className="empty-state-text">
                    Collaborative updates and changes in your workspace will stream here in real-time.
                  </p>
                </div>
              )}

              <button 
                className="activity-footer-button" 
                onClick={() => onNavigate('notifications')}
                type="button"
              >
                Sync Status: {realtimeLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
