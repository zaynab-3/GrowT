import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { normalizeUsername } from '../../lib/growtDisplay'
import { supabase } from '../../lib/supabase'
import {
  acceptAcquaintanceRequest,
  cancelAcquaintanceRequest,
  listAcquaintanceRequests,
  listAcquaintances,
  rejectAcquaintanceRequest,
  removeAcquaintance,
  searchProfilesWithRelationship,
  sendAcquaintanceRequest,
  type AcquaintanceListItem,
  type AcquaintanceRequestItem,
  type ProfileRelationshipSearchResult,
} from './acquaintanceApi'
import { AcquaintanceList } from './AcquaintanceList'
import { IncomingRequests } from './IncomingRequests'
import { OutgoingRequests } from './OutgoingRequests'
import { UserSearch } from './UserSearch'

export function AcquaintancesPanel() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [acquaintances, setAcquaintances] = useState<AcquaintanceListItem[]>([])
  const [requests, setRequests] = useState<AcquaintanceRequestItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProfileRelationshipSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const incomingRequests = useMemo(
    () => requests.filter((request) => request.direction === 'incoming'),
    [requests],
  )
  const outgoingRequests = useMemo(
    () => requests.filter((request) => request.direction === 'outgoing'),
    [requests],
  )

  const loadAcquaintanceData = useCallback(async () => {
    if (!supabase || !currentUserId) {
      return
    }

    setIsLoading(true)

    try {
      const [nextAcquaintances, nextRequests] = await Promise.all([
        listAcquaintances(supabase),
        listAcquaintanceRequests(supabase),
      ])

      setAcquaintances(nextAcquaintances)
      setRequests(nextRequests)
    } catch (error) {
      console.error('Acquaintance data load failed', error)
      setMessage('Unable to load acquaintances.')
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId])

  const loadSearchResults = useCallback(async (queryValue: string, quiet = false) => {
    if (!supabase) {
      return
    }

    const query = normalizeUsername(queryValue)
    if (!query) {
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
      const results = await searchProfilesWithRelationship(supabase, query)
      setSearchResults(results)
      if (!quiet && !results.length) {
        setMessage('No users found.')
      }
    } catch (error) {
      console.error('Acquaintance search failed', error)
      if (!quiet) {
        setMessage('Unable to search users.')
      }
    } finally {
      if (!quiet) {
        setIsSearching(false)
      }
    }
  }, [])

  const refreshActiveSearch = useCallback(async () => {
    if (normalizeUsername(searchQuery)) {
      await loadSearchResults(searchQuery, true)
    }
  }, [loadSearchResults, searchQuery])

  useEffect(() => {
    if (!supabase) {
      return
    }

    let isActive = true

    void supabase.auth.getUser().then(({ data }) => {
      if (isActive) {
        setCurrentUserId(data.user?.id ?? null)
      }
    })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    void loadAcquaintanceData()
  }, [loadAcquaintanceData])

  useEffect(() => {
    if (!supabase || !currentUserId) {
      return
    }

    const client = supabase
    const refreshPanelData = () => {
      void loadAcquaintanceData()
      void refreshActiveSearch()
    }
    const channel = client
      .channel(`acquaintances:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'acquaintance_requests',
          filter: `sender_id=eq.${currentUserId}`,
        },
        refreshPanelData,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'acquaintance_requests',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        refreshPanelData,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'acquaintances',
          filter: `user_id=eq.${currentUserId}`,
        },
        refreshPanelData,
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [currentUserId, loadAcquaintanceData, refreshActiveSearch])

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loadSearchResults(searchQuery)
  }

  async function handleSendRequest(username: string) {
    if (!supabase) {
      return
    }

    setPendingAction(`send:${username}`)
    setMessage('')

    try {
      const request = await sendAcquaintanceRequest(supabase, username)
      setSearchResults((current) =>
        current.map((profile) =>
          profile.username === username
            ? { ...profile, relationship_status: 'pending_outgoing', request_id: request.id }
            : profile,
        ),
      )
      setMessage(`Request sent to @${username}.`)
      await loadAcquaintanceData()
      await refreshActiveSearch()
    } catch (error) {
      console.error('Acquaintance request send failed', error)
      setMessage('Unable to send request.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleCancelRequest(requestId: string) {
    if (!supabase) {
      return
    }

    setPendingAction(`cancel:${requestId}`)
    setMessage('')

    try {
      await cancelAcquaintanceRequest(supabase, requestId)
      setRequests((current) => current.filter((request) => request.request_id !== requestId))
      setSearchResults((current) =>
        current.map((profile) =>
          profile.request_id === requestId
            ? { ...profile, relationship_status: 'none', request_id: null }
            : profile,
        ),
      )
      setMessage('Request cancelled.')
      await loadAcquaintanceData()
      await refreshActiveSearch()
    } catch (error) {
      console.error('Acquaintance request cancel failed', error)
      setMessage('Unable to cancel request.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleAcceptRequest(requestId: string) {
    if (!supabase) {
      return
    }

    setPendingAction(`accept:${requestId}`)
    setMessage('')

    try {
      await acceptAcquaintanceRequest(supabase, requestId)
      setRequests((current) => current.filter((request) => request.request_id !== requestId))
      setMessage('Request accepted.')
      await loadAcquaintanceData()
      await refreshActiveSearch()
    } catch (error) {
      console.error('Acquaintance request accept failed', error)
      setMessage('Unable to accept request.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleRejectRequest(requestId: string) {
    if (!supabase) {
      return
    }

    setPendingAction(`reject:${requestId}`)
    setMessage('')

    try {
      await rejectAcquaintanceRequest(supabase, requestId)
      setRequests((current) => current.filter((request) => request.request_id !== requestId))
      setMessage('Request rejected.')
      await loadAcquaintanceData()
      await refreshActiveSearch()
    } catch (error) {
      console.error('Acquaintance request reject failed', error)
      setMessage('Unable to reject request.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleRemoveAcquaintance(userId: string) {
    if (!supabase) {
      return
    }

    setPendingAction(`remove:${userId}`)
    setMessage('')

    try {
      await removeAcquaintance(supabase, userId)
      setAcquaintances((current) => current.filter((acquaintance) => acquaintance.user_id !== userId))
      setMessage('Acquaintance removed.')
      await loadAcquaintanceData()
      await refreshActiveSearch()
    } catch (error) {
      console.error('Acquaintance remove failed', error)
      setMessage('Unable to remove acquaintance.')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <section className="restore-panel acquaintances-panel" aria-label="Acquaintances">
      <div className="restore-panel__heading">
        <span className="section-label">Acquaintances</span>
        <strong>{isLoading ? '...' : acquaintances.length}</strong>
      </div>

      <UserSearch
        isSearching={isSearching}
        onCancelRequest={(requestId) => void handleCancelRequest(requestId)}
        onQueryChange={setSearchQuery}
        onSearch={(event) => void handleSearch(event)}
        onSendRequest={(username) => void handleSendRequest(username)}
        pendingAction={pendingAction}
        query={searchQuery}
        results={searchResults}
      />

      <IncomingRequests
        isBusy={isLoading}
        onAccept={(requestId) => void handleAcceptRequest(requestId)}
        onReject={(requestId) => void handleRejectRequest(requestId)}
        pendingAction={pendingAction}
        requests={incomingRequests}
      />

      <OutgoingRequests
        isBusy={isLoading}
        onCancel={(requestId) => void handleCancelRequest(requestId)}
        pendingAction={pendingAction}
        requests={outgoingRequests}
      />

      <AcquaintanceList
        acquaintances={acquaintances}
        isBusy={isLoading}
        onRemove={(userId) => void handleRemoveAcquaintance(userId)}
        pendingAction={pendingAction}
      />

      {message ? <p className="invite-note">{message}</p> : null}
    </section>
  )
}
