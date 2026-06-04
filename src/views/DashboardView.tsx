import type { ReactNode } from 'react'
import type { AppView } from './viewTypes'
import { ViewHeader } from './ViewHeader'

type DashboardViewProps = {
  activeFolderDescription: string
  activeFolderTitle: string
  deletedCount: number
  folderCount: number
  onNavigate: (view: AppView) => void
  realtimeLabel: string
  sharedCount: number
  taskCount: number
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string
  tone?: 'sky' | 'sun'
  value: ReactNode
}) {
  return (
    <div className={`metric${tone ? ` metric--${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function DashboardView({
  activeFolderDescription,
  activeFolderTitle,
  deletedCount,
  folderCount,
  onNavigate,
  realtimeLabel,
  sharedCount,
  taskCount,
}: DashboardViewProps) {
  return (
    <section className="view-stack dashboard-view">
      <ViewHeader
        description="A calm command view for your folders, tasks, realtime status, and recovery queue."
        label="Dashboard"
        title="GrowT overview"
        actions={
          <>
            <button className="button button--primary" onClick={() => onNavigate('my-tasks')} type="button">
              Open My Tasks
            </button>
            <button className="button button--secondary" onClick={() => onNavigate('shared')} type="button">
              Open Shared
            </button>
          </>
        }
      />

      <div className="summary-grid">
        <MetricCard label="Folders" value={folderCount} />
        <MetricCard label="Tasks" tone="sky" value={taskCount} />
        <MetricCard label="Realtime" tone="sun" value={realtimeLabel} />
      </div>

      <div className="view-grid view-grid--two">
        <section className="view-panel">
          <p className="section-label">Current focus</p>
          <h2>{activeFolderTitle}</h2>
          <p className="hero-text">{activeFolderDescription}</p>
        </section>

        <section className="view-panel">
          <p className="section-label">Queues</p>
          <div className="view-stat-list">
            <button className="view-stat-row" onClick={() => onNavigate('shared')} type="button">
              <span>Shared spaces</span>
              <strong>{sharedCount}</strong>
            </button>
            <button className="view-stat-row" onClick={() => onNavigate('restore')} type="button">
              <span>Restore items</span>
              <strong>{deletedCount}</strong>
            </button>
            <button className="view-stat-row" onClick={() => onNavigate('notifications')} type="button">
              <span>Notifications</span>
              <strong>Open</strong>
            </button>
          </div>
        </section>
      </div>
    </section>
  )
}
