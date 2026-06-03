import type { FormEvent } from 'react'
import type { TaskProgressStatus } from '../../lib/database.types'
import type { Folder } from '../../lib/growtData'
import { supabase } from '../../lib/supabase'
import { MemberPicker } from '../members/MemberPicker'
import { addFolderMemberByUsername } from './folderApi'

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
  memberUserIds,
}: FolderMembersPanelProps) {
  async function handleAddMember(username: string) {
    if (!supabase) {
      throw new Error('Supabase is not configured.')
    }

    await addFolderMemberByUsername(supabase, folder.id, username)
  }

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
        <MemberPicker
          currentUserId={currentUserId}
          existingMemberIds={memberUserIds}
          isDisabled={isSaving}
          label={`${folder.title} folder members`}
          onAddMember={handleAddMember}
          targetKey={`folder:${folder.id}`}
        />
      ) : null}
      {folder.owner_id === currentUserId && !isShared ? (
        <p className="invite-note">Convert this folder to Shared before adding members.</p>
      ) : null}
    </div>
  )
}
