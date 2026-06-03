import type { FormEvent } from 'react'
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
    <div className="acquaintance-section">
      <span className="section-label">Find users</span>
      <form className="inline-form" onSubmit={onSearch}>
        <input
          aria-label="Search username"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="username"
          value={query}
        />
        <button className="button button--secondary" disabled={isSearching} type="submit">
          Search
        </button>
      </form>
      {results.length ? (
        <div className="restore-list">
          {results.map((profile) => (
            <div className="restore-row" key={profile.user_id}>
              <div>
                <strong>{profile.display_name ?? `@${profile.username}`}</strong>
                <span>@{profile.username}</span>
              </div>
              {profile.relationship_status === 'acquaintance' ? (
                <button className="button button--secondary" disabled type="button">
                  Acquaintance
                </button>
              ) : null}
              {profile.relationship_status === 'none' ? (
                <button
                  className="button button--secondary"
                  disabled={pendingAction === `send:${profile.username}`}
                  onClick={() => onSendRequest(profile.username)}
                  type="button"
                >
                  Add Friend
                </button>
              ) : null}
              {profile.relationship_status === 'pending_outgoing' ? (
                <div className="member-picker__actions">
                  <button className="button button--secondary" disabled type="button">
                    Pending
                  </button>
                  <button
                    className="chip-button"
                    disabled={!profile.request_id || pendingAction === `cancel:${profile.request_id}`}
                    onClick={() => profile.request_id && onCancelRequest(profile.request_id)}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
              {profile.relationship_status === 'pending_incoming' ? (
                <button className="button button--secondary" disabled type="button">
                  Incoming
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
