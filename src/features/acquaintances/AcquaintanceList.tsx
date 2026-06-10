import type { AcquaintanceListItem } from './acquaintanceApi'
import { UserAvatar } from '../../components/UserAvatar'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="stitch-member-list">
        {acquaintances.map((acquaintance) => (
          <div className="stitch-member-row" key={acquaintance.relationship_id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UserAvatar label={acquaintance.display_name ?? acquaintance.username} avatarChoice={acquaintance.avatar_choice} avatarUrl={acquaintance.avatar_url} className="w-8 h-8 text-[12px]" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="stitch-member-name">{acquaintance.display_name ?? `@${acquaintance.username}`}</span>
                <span style={{ fontSize: '11px', color: 'var(--ink-3)' }}>@{acquaintance.username}</span>
              </div>
            </div>
            <button
              className="btn btn--danger btn--sm"
              disabled={isBusy || pendingAction === `remove:${acquaintance.user_id}`}
              onClick={() => onRemove(acquaintance.user_id)}
              type="button"
            >
              Remove
            </button>
          </div>
        ))}
        {!acquaintances.length ? <p className="stitch-empty-text">No acquaintances yet.</p> : null}
      </div>
    </div>
  )
}
