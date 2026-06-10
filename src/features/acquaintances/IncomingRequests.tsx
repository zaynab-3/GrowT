import type { AcquaintanceRequestItem } from './acquaintanceApi'
import { UserAvatar } from '../../components/UserAvatar'

type IncomingRequestsProps = {
  isBusy: boolean
  onAccept: (requestId: string) => void
  onReject: (requestId: string) => void
  pendingAction: string | null
  requests: AcquaintanceRequestItem[]
}

export function IncomingRequests({
  isBusy,
  onAccept,
  onReject,
  pendingAction,
  requests,
}: IncomingRequestsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="stitch-member-list">
        {requests.map((request) => (
          <div className="stitch-member-row" key={request.request_id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UserAvatar label={request.sender_display_name ?? request.sender_username} avatarChoice={request.sender_avatar_choice} avatarUrl={request.sender_avatar_url} className="w-8 h-8 text-[12px]" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="stitch-member-name">{request.sender_display_name ?? `@${request.sender_username}`}</span>
                <span style={{ fontSize: '11px', color: 'var(--ink-3)' }}>@{request.sender_username}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn--secondary btn--sm"
                disabled={isBusy || pendingAction === `accept:${request.request_id}`}
                onClick={() => onAccept(request.request_id)}
                type="button"
              >
                Accept
              </button>
              <button
                className="btn btn--danger btn--sm"
                disabled={isBusy || pendingAction === `reject:${request.request_id}`}
                onClick={() => onReject(request.request_id)}
                type="button"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
        {!requests.length ? <p className="stitch-empty-text">No incoming requests.</p> : null}
      </div>
    </div>
  )
}
