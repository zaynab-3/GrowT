import type { AcquaintanceListItem } from './acquaintanceApi'

type AcquaintanceListProps = {
  acquaintances: AcquaintanceListItem[]
  isBusy: boolean
  onRemove: (userId: string) => void
  pendingAction: string | null
}

export function AcquaintanceList({
  acquaintances,
  isBusy,
  onRemove,
  pendingAction,
}: AcquaintanceListProps) {
  return (
    <div className="acquaintance-section">
      <div className="restore-panel__heading">
        <span className="section-label">Acquaintances</span>
        <strong>{acquaintances.length}</strong>
      </div>
      <div className="restore-list">
        {acquaintances.map((acquaintance) => (
          <div className="restore-row" key={acquaintance.relationship_id}>
            <div>
              <strong>{acquaintance.display_name ?? `@${acquaintance.username}`}</strong>
              <span>@{acquaintance.username}</span>
            </div>
            <button
              className="button button--danger"
              disabled={isBusy || pendingAction === `remove:${acquaintance.user_id}`}
              onClick={() => onRemove(acquaintance.user_id)}
              type="button"
            >
              Remove
            </button>
          </div>
        ))}
        {!acquaintances.length ? <p className="empty-state">No acquaintances yet.</p> : null}
      </div>
    </div>
  )
}
