import type { AcquaintanceRequestItem } from './acquaintanceApi'

type OutgoingRequestsProps = {
  isBusy: boolean
  onCancel: (requestId: string) => void
  pendingAction: string | null
  requests: AcquaintanceRequestItem[]
}

export function OutgoingRequests({ isBusy, onCancel, pendingAction, requests }: OutgoingRequestsProps) {
  return (
    <div className="acquaintance-section">
      <div className="restore-panel__heading">
        <span className="section-label">Outgoing</span>
        <strong>{requests.length}</strong>
      </div>
      <div className="restore-list">
        {requests.map((request) => (
          <div className="restore-row" key={request.request_id}>
            <div>
              <strong>{request.receiver_display_name ?? `@${request.receiver_username}`}</strong>
              <span>@{request.receiver_username}</span>
            </div>
            <div className="member-picker__actions">
              <span className="empty-chip">Pending</span>
              <button
                className="chip-button"
                disabled={isBusy || pendingAction === `cancel:${request.request_id}`}
                onClick={() => onCancel(request.request_id)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
        {!requests.length ? <p className="empty-state">No outgoing requests.</p> : null}
      </div>
    </div>
  )
}
