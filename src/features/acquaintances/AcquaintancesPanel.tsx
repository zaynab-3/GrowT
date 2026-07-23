import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { normalizeUsername } from '../../lib/growtDisplay'
import * as authService from '../../services/authService'
import { isSupabaseConfigured } from '../../services/clientService'
import { removeChannel, subscribeToChannel } from '../../services/realtimeService'
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming')

  const incomingRequests = useMemo(
    () => requests.filter((request) => request.direction === 'incoming'),
    [requests],
  )
  const outgoingRequests = useMemo(
    () => requests.filter((request) => request.direction === 'outgoing'),
    [requests],
  )

  const loadAcquaintanceData = useCallback(async () => {
    if (!isSupabaseConfigured || !currentUserId) {
      return
    }

    setIsLoading(true)

    try {
      const [nextAcquaintances, nextRequests] = await Promise.all([
        listAcquaintances(),
        listAcquaintanceRequests(),
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
    if (!isSupabaseConfigured) {
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
      const results = await searchProfilesWithRelationship(query)
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
    if (!isSupabaseConfigured) {
      return
    }

    let isActive = true

    void authService.getUser().then(({ data }) => {
      if (isActive) {
        setCurrentUserId(data.user?.id ?? null)
        if (!data.user) {
          setIsLoading(false)
        }
      }
    }).catch(() => {
      if (isActive) {
        setIsLoading(false)
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
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        void loadSearchResults(searchQuery, true)
      } else {
        setSearchResults([])
        setMessage('')
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, loadSearchResults])

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUserId) {
      return
    }

    const refreshPanelData = () => {
      void loadAcquaintanceData()
      void refreshActiveSearch()
    }
    const channel = subscribeToChannel(`acquaintances:${currentUserId}`, (nextChannel) => nextChannel
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
    )

    return () => {
      void removeChannel(channel)
    }
  }, [currentUserId, loadAcquaintanceData, refreshActiveSearch])

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loadSearchResults(searchQuery)
  }

  async function handleSendRequest(username: string) {
    if (!isSupabaseConfigured) {
      return
    }

    setPendingAction(`send:${username}`)
    setMessage('')

    try {
      const request = await sendAcquaintanceRequest(username)
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
    if (!isSupabaseConfigured) {
      return
    }

    setPendingAction(`cancel:${requestId}`)
    setMessage('')

    try {
      await cancelAcquaintanceRequest(requestId)
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
    if (!isSupabaseConfigured) {
      return
    }

    setPendingAction(`accept:${requestId}`)
    setMessage('')

    try {
      await acceptAcquaintanceRequest(requestId)
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
    if (!isSupabaseConfigured) {
      return
    }

    setPendingAction(`reject:${requestId}`)
    setMessage('')

    try {
      await rejectAcquaintanceRequest(requestId)
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
    if (!isSupabaseConfigured) {
      return
    }

    setPendingAction(`remove:${userId}`)
    setMessage('')

    try {
      await removeAcquaintance(userId)
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
    <div className="acquaintances-layout">
      {message && (
        <div className="acquaintances-message" role="status">
          {message}
        </div>
      )}

      <div className="acquaintances-grid">
        <div className="acquaintances-main">
          
          <section className="acquaintances-card acquaintances-search-card">
            <div className="acquaintances-card__header">
              <h3>
                <span className="acquaintances-card__icon"><Search size={17} /></span>
                Find People
              </h3>
              <p>Search by username and send a connection request.</p>
            </div>
            <div className="acquaintances-card__body">
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
            </div>
          </section>

          <section className="acquaintances-card acquaintances-requests-card">
            <div className="acquaintances-tabs" role="tablist" aria-label="Connection requests">
              <button
                aria-selected={activeTab === 'incoming'}
                className={`acquaintances-tab${activeTab === 'incoming' ? ' acquaintances-tab--active' : ''}`}
                onClick={() => setActiveTab('incoming')}
                role="tab"
                type="button"
              >
                Incoming <span>{incomingRequests.length}</span>
              </button>
              <button
                aria-selected={activeTab === 'outgoing'}
                className={`acquaintances-tab${activeTab === 'outgoing' ? ' acquaintances-tab--active' : ''}`}
                onClick={() => setActiveTab('outgoing')}
                role="tab"
                type="button"
              >
                Sent <span>{outgoingRequests.length}</span>
              </button>
            </div>
            <div className="acquaintances-card__body acquaintances-card__body--requests">
              {activeTab === 'incoming' ? (
                <IncomingRequests
                  isBusy={isLoading}
                  onAccept={(requestId) => void handleAcceptRequest(requestId)}
                  onReject={(requestId) => void handleRejectRequest(requestId)}
                  pendingAction={pendingAction}
                  requests={incomingRequests}
                />
              ) : (
                <OutgoingRequests
                  isBusy={isLoading}
                  onCancel={(requestId) => void handleCancelRequest(requestId)}
                  pendingAction={pendingAction}
                  requests={outgoingRequests}
                />
              )}
            </div>
          </section>
        </div>

        <aside className="acquaintances-side">
          <section className="acquaintances-card acquaintances-connections-card">
            <div className="acquaintances-card__header acquaintances-card__header--row">
              <h3>
                <span className="acquaintances-card__icon acquaintances-card__icon--green"><Users size={17} /></span>
                Connections
              </h3>
              <span className="acquaintances-count">{isLoading ? '...' : acquaintances.length}</span>
            </div>
            <div className="acquaintances-card__body">
              <AcquaintanceList
                acquaintances={acquaintances}
                isBusy={isLoading}
                onRemove={(userId) => void handleRemoveAcquaintance(userId)}
                pendingAction={pendingAction}
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
