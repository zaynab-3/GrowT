import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { normalizeUsername } from '../../lib/growtDisplay'
import { supabase } from '../../lib/supabase'
import {
  acceptAcquaintanceRequest,
  cancelAcquaintanceRequest,
  listAcquaintances,
  rejectAcquaintanceRequest,
  searchProfilesWithRelationship,
  sendAcquaintanceRequest,
  type MemberPickerAcquaintance,
  type MemberPickerProfile,
} from './memberPickerApi'
import { MemberSearchResult } from './MemberSearchResult'

type MemberPickerProps = {
  currentUserId: string
  existingMemberIds: string[]
  isDisabled: boolean
  label: string
  onAddMember: (username: string, userId: string) => Promise<void> | void
  targetKey: string
}

function acquaintanceToProfile(acquaintance: MemberPickerAcquaintance): MemberPickerProfile {
  return {
    user_id: acquaintance.user_id,
    username: acquaintance.username,
    display_name: acquaintance.display_name,
    avatar_url: acquaintance.avatar_url,
    relationship_status: 'acquaintance',
    request_id: null,
  }
}

function appendUniqueId(ids: string[], nextId: string) {
  return ids.includes(nextId) ? ids : [...ids, nextId]
}

export function MemberPicker({
  currentUserId,
  existingMemberIds,
  isDisabled,
  label,
  onAddMember,
  targetKey,
}: MemberPickerProps) {
  const [acquaintances, setAcquaintances] = useState<MemberPickerAcquaintance[]>([])
  const [localMemberIds, setLocalMemberIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MemberPickerProfile[]>([])
  const [isLoadingAcquaintances, setIsLoadingAcquaintances] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const searchQueryRef = useRef(searchQuery)

  useEffect(() => {
    searchQueryRef.current = searchQuery
  }, [searchQuery])

  const memberIdSet = useMemo(
    () => new Set([...existingMemberIds, ...localMemberIds]),
    [existingMemberIds, localMemberIds],
  )

  const acquaintanceProfiles = useMemo(
    () => acquaintances.map((acquaintance) => acquaintanceToProfile(acquaintance)),
    [acquaintances],
  )

  const loadAcquaintances = useCallback(
    async (quiet = false) => {
      if (!supabase || !currentUserId) {
        return
      }

      if (!quiet) {
        setIsLoadingAcquaintances(true)
      }

      try {
        const nextAcquaintances = await listAcquaintances(supabase)
        setAcquaintances(nextAcquaintances)
      } catch (error) {
        console.error('Member picker acquaintances load failed', error)
        if (!quiet) {
          setMessage('Unable to load acquaintances.')
        }
      } finally {
        if (!quiet) {
          setIsLoadingAcquaintances(false)
        }
      }
    },
    [currentUserId],
  )

  const searchUsers = useCallback(async (queryValue: string, quiet = false) => {
    if (!supabase) {
      return
    }

    const normalizedQuery = normalizeUsername(queryValue)
    if (!normalizedQuery) {
      setSearchResults([])
      if (!quiet) {
        setMessage('Enter a username to search.')
      }
      return
    }

    if (!quiet) {
      setIsSearching(true)
      setMessage('')
    }

    try {
      const results = await searchProfilesWithRelationship(supabase, normalizedQuery)
      setSearchResults(results)
      if (!quiet && !results.length) {
        setMessage('No users found.')
      }
    } catch (error) {
      console.error('Member picker search failed', error)
      if (!quiet) {
        setMessage('Unable to search users.')
      }
    } finally {
      if (!quiet) {
        setIsSearching(false)
      }
    }
  }, [])

  const refreshActiveSearch = useCallback(() => {
    if (normalizeUsername(searchQueryRef.current)) {
      void searchUsers(searchQueryRef.current, true)
    }
  }, [searchUsers])

  useEffect(() => {
    void loadAcquaintances()
  }, [loadAcquaintances])

  useEffect(() => {
    if (!supabase || !currentUserId) {
      return
    }

    const client = supabase
    const refreshPickerData = () => {
      void loadAcquaintances(true)
      refreshActiveSearch()
    }
    const channel = client
      .channel(`member-picker:${currentUserId}:${targetKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'acquaintance_requests',
          filter: `sender_id=eq.${currentUserId}`,
        },
        refreshPickerData,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'acquaintance_requests',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        refreshPickerData,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'acquaintances',
          filter: `user_id=eq.${currentUserId}`,
        },
        refreshPickerData,
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [currentUserId, loadAcquaintances, refreshActiveSearch, targetKey])

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await searchUsers(searchQuery)
  }

  async function handleAddMember(profile: MemberPickerProfile) {
    setPendingAction(`add:${profile.user_id}`)
    setMessage('')

    try {
      await onAddMember(profile.username, profile.user_id)
      setLocalMemberIds((current) => appendUniqueId(current, profile.user_id))
      setMessage(`Added @${profile.username}.`)
    } catch (error) {
      console.error('Member picker add member failed', error)
      setMessage('Unable to add member.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleSendRequest(profile: MemberPickerProfile) {
    if (!supabase) {
      return
    }

    setPendingAction(`send:${profile.user_id}`)
    setMessage('')

    try {
      const request = await sendAcquaintanceRequest(supabase, profile.username)
      setSearchResults((current) =>
        current.map((result) =>
          result.user_id === profile.user_id
            ? { ...result, relationship_status: 'pending_outgoing', request_id: request.id }
            : result,
        ),
      )
      setMessage(`Request sent to @${profile.username}.`)
      await loadAcquaintances(true)
      refreshActiveSearch()
    } catch (error) {
      console.error('Member picker acquaintance request send failed', error)
      setMessage('Unable to send request.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleCancelRequest(profile: MemberPickerProfile) {
    if (!supabase || !profile.request_id) {
      return
    }

    setPendingAction(`cancel:${profile.request_id}`)
    setMessage('')

    try {
      await cancelAcquaintanceRequest(supabase, profile.request_id)
      setSearchResults((current) =>
        current.map((result) =>
          result.user_id === profile.user_id
            ? { ...result, relationship_status: 'none', request_id: null }
            : result,
        ),
      )
      setMessage('Request cancelled.')
      await loadAcquaintances(true)
      refreshActiveSearch()
    } catch (error) {
      console.error('Member picker acquaintance request cancel failed', error)
      setMessage('Unable to cancel request.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleAcceptRequest(profile: MemberPickerProfile) {
    if (!supabase || !profile.request_id) {
      return
    }

    setPendingAction(`accept:${profile.request_id}`)
    setMessage('')

    try {
      await acceptAcquaintanceRequest(supabase, profile.request_id)
      setSearchResults((current) =>
        current.map((result) =>
          result.user_id === profile.user_id
            ? { ...result, relationship_status: 'acquaintance', request_id: null }
            : result,
        ),
      )
      setMessage(`Accepted @${profile.username}.`)
      await loadAcquaintances(true)
      refreshActiveSearch()
    } catch (error) {
      console.error('Member picker acquaintance request accept failed', error)
      setMessage('Unable to accept request.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleRejectRequest(profile: MemberPickerProfile) {
    if (!supabase || !profile.request_id) {
      return
    }

    setPendingAction(`reject:${profile.request_id}`)
    setMessage('')

    try {
      await rejectAcquaintanceRequest(supabase, profile.request_id)
      setSearchResults((current) =>
        current.map((result) =>
          result.user_id === profile.user_id
            ? { ...result, relationship_status: 'none', request_id: null }
            : result,
        ),
      )
      setMessage('Request rejected.')
      await loadAcquaintances(true)
      refreshActiveSearch()
    } catch (error) {
      console.error('Member picker acquaintance request reject failed', error)
      setMessage('Unable to reject request.')
    } finally {
      setPendingAction(null)
    }
  }

  function isProfileBusy(profile: MemberPickerProfile) {
    return (
      isDisabled ||
      pendingAction === `add:${profile.user_id}` ||
      pendingAction === `send:${profile.user_id}` ||
      (profile.request_id ? pendingAction === `accept:${profile.request_id}` : false) ||
      (profile.request_id ? pendingAction === `cancel:${profile.request_id}` : false) ||
      (profile.request_id ? pendingAction === `reject:${profile.request_id}` : false)
    )
  }

  return (
    <section className="member-picker" aria-label={label}>
      <div className="member-picker__section">
        <div className="restore-panel__heading">
          <span className="section-label">Acquaintances</span>
          <strong>{isLoadingAcquaintances ? '...' : acquaintanceProfiles.length}</strong>
        </div>

        <div className="restore-list">
          {acquaintanceProfiles.map((profile) => (
            <MemberSearchResult
              isBusy={isProfileBusy(profile)}
              isMember={memberIdSet.has(profile.user_id)}
              key={profile.user_id}
              onAccept={(nextProfile) => void handleAcceptRequest(nextProfile)}
              onAdd={(nextProfile) => void handleAddMember(nextProfile)}
              onCancelRequest={(nextProfile) => void handleCancelRequest(nextProfile)}
              onReject={(nextProfile) => void handleRejectRequest(nextProfile)}
              onSendRequest={(nextProfile) => void handleSendRequest(nextProfile)}
              profile={profile}
            />
          ))}
          {!acquaintanceProfiles.length ? <p className="empty-state">No acquaintances yet.</p> : null}
        </div>
      </div>

      <div className="member-picker__section">
        <div className="restore-panel__heading">
          <span className="section-label">Search users</span>
        </div>

        <form className="invite-form member-picker__search" onSubmit={(event) => void handleSearch(event)}>
          <input
            aria-label="Search users by username"
            disabled={isDisabled || isSearching}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="username"
            value={searchQuery}
          />
          <button className="button button--secondary" disabled={isDisabled || isSearching} type="submit">
            Search
          </button>
        </form>

        {searchResults.length ? (
          <div className="restore-list">
            {searchResults.map((profile) => (
              <MemberSearchResult
                isBusy={isProfileBusy(profile)}
                isMember={memberIdSet.has(profile.user_id)}
                key={profile.user_id}
                onAccept={(nextProfile) => void handleAcceptRequest(nextProfile)}
                onAdd={(nextProfile) => void handleAddMember(nextProfile)}
                onCancelRequest={(nextProfile) => void handleCancelRequest(nextProfile)}
                onReject={(nextProfile) => void handleRejectRequest(nextProfile)}
                onSendRequest={(nextProfile) => void handleSendRequest(nextProfile)}
                profile={profile}
              />
            ))}
          </div>
        ) : null}
      </div>

      {message ? <p className="invite-note">{message}</p> : null}
    </section>
  )
}
