import type { AcquaintanceRequestItem } from './acquaintanceApi'

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
    <div className="acquaintance-section">
      <div className="restore-panel__heading">
        <span className="section-label">Incoming</span>
        <strong>{requests.length}</strong>
      </div>
      <div className="restore-list">
        {requests.map((request) => (
          <div className="restore-row" key={request.request_id}>
            <div>
              <strong>{request.sender_display_name ?? `@${request.sender_username}`}</strong>
              <span>@{request.sender_username}</span>
            </div>
            <div className="panel-actions">
              <button
                className="button button--secondary"
                disabled={isBusy || pendingAction === `accept:${request.request_id}`}
                onClick={() => onAccept(request.request_id)}
                type="button"
              >
                Accept
              </button>
              <button
                className="button button--danger"
                disabled={isBusy || pendingAction === `reject:${request.request_id}`}
                onClick={() => onReject(request.request_id)}
                type="button"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
        {!requests.length ? <p className="empty-state">No incoming requests.</p> : null}
      </div>
    </div>
  )
}
