import type { TaskProgressStatus } from '../../lib/database.types'
import {
  formatDateTime,
  getCategoryLabel,
  isSharedFolder,
  statusColumns,
} from '../../lib/growtDisplay'
import type { Folder } from '../../lib/growtData'
import { UserAvatar } from '../../components/UserAvatar'

type ContributionCounts = Record<TaskProgressStatus, number>

type FolderInfoPanelProps = {
  folder: Folder
  getContributionCounts: (userId: string) => ContributionCounts
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  memberUserIds: string[]
  statusTotals: ContributionCounts
  taskCount: number
}

export function FolderInfoPanel({
  folder,
  getContributionCounts,
  getProfileAvatar,
  getProfileLabel,
  memberUserIds,
  statusTotals,
  taskCount,
}: FolderInfoPanelProps) {
  return (
    <div className="folder-info" aria-label="Folder information">
      <div className="folder-info__grid">
        <span className="meta-chip">
          <small>Category</small>
          <strong>{getCategoryLabel(folder.category)}</strong>
        </span>
        <span className="meta-chip">
          <small>Access</small>
          <strong>{isSharedFolder(folder) ? 'Shared' : 'Private'}</strong>
        </span>
        <span className="meta-chip">
          <small>Status</small>
          <strong>{folder.is_active ? 'Active' : 'Inactive'}</strong>
        </span>
        <span className="meta-chip">
          <small>Due date</small>
          <strong>{folder.due_date ? formatDateTime(folder.due_date) : 'None'}</strong>
        </span>
        <span className="meta-chip">
          <small>Created</small>
          <strong>{formatDateTime(folder.created_at)}</strong>
        </span>
        <span className="meta-chip">
          <small>Updated</small>
          <strong>{formatDateTime(folder.updated_at)}</strong>
        </span>
        <span className="meta-chip">
          <small>Total tasks</small>
          <strong>{taskCount}</strong>
        </span>
        {statusColumns.map((status) => (
          <span className={`meta-chip meta-chip--${status.id}`} key={status.id}>
            <small>{status.label}</small>
            <strong>{statusTotals[status.id]}</strong>
          </span>
        ))}
      </div>

      <div className="member-summary" aria-label="Member contribution summary">
        <div className="member-summary__heading">
          <span className="section-label">Member counts</span>
          <strong>{memberUserIds.length}</strong>
        </div>
        <div className="member-summary__list">
          {memberUserIds.map((memberId) => {
            const counts = getContributionCounts(memberId)

            return (
              <span className="member-chip member-chip--summary" key={memberId}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <UserAvatar label={getProfileLabel(memberId)} avatarUrl={getProfileAvatar(memberId)} className="w-6 h-6 text-[10px]" />
                  <span>{getProfileLabel(memberId)}</span>
                </span>
                <span className="contribution-counts" aria-label="Contribution counts">
                  <span>
                    <i className="status-dot status-dot--ongoing" />
                    {counts.ongoing}
                  </span>
                  <span>
                    <i className="status-dot status-dot--half_done" />
                    {counts.half_done}
                  </span>
                  <span>
                    <i className="status-dot status-dot--completed" />
                    {counts.completed}
                  </span>
                </span>
              </span>
            )
          })}
          {!memberUserIds.length ? <span className="member-chip">Owner only</span> : null}
        </div>
      </div>
    </div>
  )
}
