import type { AcquaintanceRequestItem } from './acquaintanceApi'
import { UserAvatar } from '../../components/UserAvatar'

type OutgoingRequestsProps = {
  isBusy: boolean
  onCancel: (requestId: string) => void
  pendingAction: string | null
  requests: AcquaintanceRequestItem[]
}

export function OutgoingRequests({ isBusy, onCancel, pendingAction, requests }: OutgoingRequestsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="stitch-member-list">
        {isBusy && !requests.length ? <p className="stitch-empty-text">Loading requests...</p> : null}
        {requests.map((request) => (
          <div className="stitch-member-row" key={request.request_id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UserAvatar label={request.receiver_display_name ?? request.receiver_username} avatarChoice={request.receiver_avatar_choice} avatarUrl={request.receiver_avatar_url} className="w-8 h-8 text-[12px]" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="stitch-member-name">{request.receiver_display_name ?? `@${request.receiver_username}`}</span>
                <span style={{ fontSize: '11px', color: 'var(--ink-3)' }}>@{request.receiver_username}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="stitch-badge">Pending</span>
              <button
                className="btn btn--danger btn--sm"
                disabled={isBusy || pendingAction === `cancel:${request.request_id}`}
                onClick={() => onCancel(request.request_id)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
        {!isBusy && !requests.length ? <p className="stitch-empty-text">No outgoing requests.</p> : null}
      </div>
    </div>
  )
}
