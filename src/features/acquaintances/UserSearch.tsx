import type { FormEvent } from 'react'
import { UserAvatar } from '../../components/UserAvatar'
import type { ProfileRelationshipSearchResult } from './acquaintanceApi'

type UserSearchProps = {
  isSearching: boolean
  onCancelRequest: (requestId: string) => void
  onQueryChange: (query: string) => void
  onSearch: (event: FormEvent<HTMLFormElement>) => void
  onSendRequest: (username: string) => void
  pendingAction: string | null
  query: string
  results: ProfileRelationshipSearchResult[]
}

export function UserSearch({
  isSearching,
  onCancelRequest,
  onQueryChange,
  onSearch,
  onSendRequest,
  pendingAction,
  query,
  results,
}: UserSearchProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <form onSubmit={onSearch} style={{ display: 'flex', gap: '8px' }}>
        <input
          aria-label="Search username"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Invite by username"
          value={query}
          className="stitch-input"
          style={{ flex: 1, minWidth: 0 }}
        />
        <button className="btn btn--primary" disabled={isSearching} type="submit">
          Search
        </button>
      </form>
      {results.length ? (
        <div className="stitch-member-list">
          {results.map((profile) => (
            <div className="stitch-member-row" key={profile.user_id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <UserAvatar label={profile.display_name ?? profile.username} avatarChoice={profile.avatar_choice} avatarUrl={profile.avatar_url} className="w-8 h-8 text-[12px]" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="stitch-member-name">{profile.display_name ?? `@${profile.username}`}</span>
                  <span style={{ fontSize: '11px', color: 'var(--ink-3)' }}>@{profile.username}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {profile.relationship_status === 'acquaintance' ? (
                  <span className="stitch-badge">Connected</span>
                ) : null}
                {profile.relationship_status === 'none' ? (
                  <button
                    className="btn btn--secondary btn--sm"
                    disabled={pendingAction === `send:${profile.username}`}
                    onClick={() => onSendRequest(profile.username)}
                    type="button"
                  >
                    Add Friend
                  </button>
                ) : null}
                {profile.relationship_status === 'pending_outgoing' ? (
                  <>
                    <span className="stitch-badge">Pending</span>
                    <button
                      className="btn btn--danger btn--sm"
                      disabled={!profile.request_id || pendingAction === `cancel:${profile.request_id}`}
                      onClick={() => profile.request_id && onCancelRequest(profile.request_id)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </>
                ) : null}
                {profile.relationship_status === 'pending_incoming' ? (
                  <span className="stitch-badge">Review in Incoming tab</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
