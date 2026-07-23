import type { AcquaintanceListItem } from './acquaintanceApi'
import { Trash2 } from 'lucide-react'
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
        {isBusy && !acquaintances.length ? <p className="stitch-empty-text">Loading connections...</p> : null}
        {acquaintances.map((acquaintance) => (
          <div className="stitch-member-row" key={acquaintance.relationship_id}>
            <div className="stitch-member-row__identity">
              <UserAvatar label={acquaintance.display_name ?? acquaintance.username} avatarChoice={acquaintance.avatar_choice} avatarUrl={acquaintance.avatar_url} className="w-8 h-8 text-[12px]" />
              <div className="stitch-member-row__copy">
                <span className="stitch-member-name">{acquaintance.display_name ?? `@${acquaintance.username}`}</span>
                <span>@{acquaintance.username}</span>
              </div>
            </div>
            <button
              aria-label={`Remove ${acquaintance.display_name ?? acquaintance.username}`}
              className="acquaintance-remove-button"
              disabled={isBusy || pendingAction === `remove:${acquaintance.user_id}`}
              onClick={() => onRemove(acquaintance.user_id)}
              title="Remove connection"
              type="button"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {!isBusy && !acquaintances.length ? <p className="stitch-empty-text">No acquaintances yet.</p> : null}
      </div>
    </div>
  )
}
