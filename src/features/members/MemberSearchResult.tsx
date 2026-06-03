import type { MemberRelationshipStatus } from '../../lib/database.types'
import type { MemberPickerProfile } from './memberPickerApi'

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
    <div className="restore-row member-picker__row">
      <div>
        <strong>{label}</strong>
        <span>
          @{profile.username} · {statusLabel}
        </span>
      </div>

      <div className="member-picker__actions">
        {isMember ? (
          <button className="button button--secondary" disabled type="button">
            Member
          </button>
        ) : null}

        {!isMember && profile.relationship_status === 'acquaintance' ? (
          <button className="button button--secondary" disabled={isBusy} onClick={() => onAdd(profile)} type="button">
            Add
          </button>
        ) : null}

        {!isMember && profile.relationship_status === 'none' ? (
          <button
            className="button button--secondary"
            disabled={isBusy}
            onClick={() => onSendRequest(profile)}
            type="button"
          >
            Add Friend
          </button>
        ) : null}

        {!isMember && profile.relationship_status === 'pending_outgoing' ? (
          <>
            <button className="button button--secondary" disabled type="button">
              Pending
            </button>
            <button
              className="chip-button"
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
              className="button button--secondary"
              disabled={isBusy || !profile.request_id}
              onClick={() => onAccept(profile)}
              type="button"
            >
              Accept
            </button>
            <button
              className="chip-button"
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
