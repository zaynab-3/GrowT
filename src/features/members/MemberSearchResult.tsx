import type { MemberRelationshipStatus } from '../../lib/database.types'
import type { MemberPickerProfile } from './memberPickerApi'
import { UserAvatar } from '../../components/UserAvatar'

type MemberSearchResultProps = {
  isBusy: boolean
  isMember: boolean
  onAccept: (profile: MemberPickerProfile) => void
  onAdd: (profile: MemberPickerProfile) => void
  onCancelRequest: (profile: MemberPickerProfile) => void
  onReject: (profile: MemberPickerProfile) => void
  onSendRequest: (profile: MemberPickerProfile) => void
  profile: MemberPickerProfile
}

const relationshipLabels: Record<MemberRelationshipStatus, string> = {
  acquaintance: 'Acquaintance',
  pending_outgoing: 'Pending',
  pending_incoming: 'Pending incoming',
  none: 'Not acquaintance',
}

export function MemberSearchResult({
  isBusy,
  isMember,
  onAccept,
  onAdd,
  onCancelRequest,
  onReject,
  onSendRequest,
  profile,
}: MemberSearchResultProps) {
  const label = profile.display_name || profile.username
  const statusLabel = isMember ? 'Member' : relationshipLabels[profile.relationship_status]

  return (
    <div className="flex items-center justify-between p-2 hover:bg-surface-variant/50 rounded-xl transition-colors group">
      <div className="flex items-center gap-3">
        <UserAvatar label={label} avatarChoice={profile.avatar_choice} avatarUrl={profile.avatar_url} className="w-8 h-8 text-[12px]" />
        <div className="flex flex-col">
          <span className="font-label-md text-on-surface">{label}</span>
          <span className="text-[11px] text-on-surface-variant">@{profile.username} · {statusLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isMember ? (
          <button className="btn btn--secondary btn--sm opacity-50" disabled type="button">
            Member
          </button>
        ) : null}

        {!isMember && profile.relationship_status === 'acquaintance' ? (
          <button className="btn btn--primary btn--sm" disabled={isBusy} onClick={() => onAdd(profile)} type="button">
            Add
          </button>
        ) : null}

        {!isMember && profile.relationship_status === 'none' ? (
          <button
            className="btn btn--secondary btn--sm"
            disabled={isBusy}
            onClick={() => onSendRequest(profile)}
            type="button"
          >
            Add Friend
          </button>
        ) : null}

        {!isMember && profile.relationship_status === 'pending_outgoing' ? (
          <>
            <button className="btn btn--secondary btn--sm opacity-50" disabled type="button">
              Pending
            </button>
            <button
              className="btn btn--danger btn--sm"
              disabled={isBusy || !profile.request_id}
              onClick={() => onCancelRequest(profile)}
              type="button"
            >
              Cancel
            </button>
          </>
        ) : null}

        {!isMember && profile.relationship_status === 'pending_incoming' ? (
          <>
            <button
              className="btn btn--secondary btn--sm"
              disabled={isBusy || !profile.request_id}
              onClick={() => onAccept(profile)}
              type="button"
            >
              Accept
            </button>
            <button
              className="btn btn--danger btn--sm"
              disabled={isBusy || !profile.request_id}
              onClick={() => onReject(profile)}
              type="button"
            >
              Reject
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
