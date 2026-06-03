import type { FormEvent } from 'react'
import type { TaskProgressStatus } from '../../lib/database.types'
import type { Folder } from '../../lib/growtData'

type ContributionCounts = Record<TaskProgressStatus, number>

type FolderMembersPanelProps = {
  canInviteMembers: boolean
  currentUserId: string
  folder: Folder
  getContributionCounts: (userId: string) => ContributionCounts
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  isShared: boolean
  memberUsername: string
  memberUserIds: string[]
  onInviteMember: (event: FormEvent<HTMLFormElement>) => void
  onMemberUsernameChange: (username: string) => void
}

export function FolderMembersPanel({
  canInviteMembers,
  currentUserId,
  folder,
  getContributionCounts,
  getProfileLabel,
  isSaving,
  isShared,
  memberUsername,
  memberUserIds,
  onInviteMember,
  onMemberUsernameChange,
}: FolderMembersPanelProps) {
  return (
    <div className="session-toolbar">
      <div className="member-strip">
        <span className="section-label">Members</span>
        <div>
          {memberUserIds.map((memberId) => {
            const counts = getContributionCounts(memberId)

            return (
              <span className="member-chip" key={memberId}>
                <span>{getProfileLabel(memberId)}</span>
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

      {canInviteMembers ? (
        <form className="invite-form" onSubmit={onInviteMember}>
          <input
            aria-label="Member username"
            onChange={(event) => onMemberUsernameChange(event.target.value)}
            placeholder="username"
            value={memberUsername}
          />
          <button className="button button--secondary" disabled={isSaving} type="submit">
            Add member
          </button>
        </form>
      ) : null}
      {folder.owner_id === currentUserId && !isShared ? (
        <p className="invite-note">Convert this folder to Shared before adding members.</p>
      ) : null}
    </div>
  )
}
