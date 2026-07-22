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
    <div className="flex flex-col gap-4 sm:gap-8 w-full max-w-7xl">
      {message && (
        <div className="bg-surface-variant text-on-surface p-4 rounded-xl border border-outline-variant/30 text-sm font-medium">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Panel: Search and Requests */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
          
          <div className="bg-light-card dark:bg-dark-card rounded-[16px] sm:rounded-[18px] p-4 sm:p-6 shadow-[0_4px_16px_0_rgba(31,38,135,0.03)] border border-surface-variant/50">
            <div className="mb-4">
              <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                <Search size={18} className="text-primary" />
                Find People
              </h3>
            </div>
            <div>
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
          </div>

          <div className="bg-light-card dark:bg-dark-card rounded-[16px] sm:rounded-[18px] p-4 sm:p-6 shadow-[0_4px_16px_0_rgba(31,38,135,0.03)] border border-surface-variant/50">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 border-b border-surface-variant/50 overflow-x-auto">
              <button
                className={`pb-3 font-title-lg text-body-lg font-semibold transition-colors border-b-2 ${activeTab === 'incoming' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setActiveTab('incoming')}
                type="button"
              >
                Incoming Requests <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${activeTab === 'incoming' ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface-variant'}`}>{incomingRequests.length}</span>
              </button>
              <button
                className={`pb-3 font-title-lg text-body-lg font-semibold transition-colors border-b-2 ${activeTab === 'outgoing' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setActiveTab('outgoing')}
                type="button"
              >
                Sent Requests <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${activeTab === 'outgoing' ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface-variant'}`}>{outgoingRequests.length}</span>
              </button>
            </div>
            <div>
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
          </div>

        </div>

        {/* Right Panel: Current Acquaintances */}
        <div className="lg:col-span-1">
          <div className="bg-light-card dark:bg-dark-card rounded-[16px] sm:rounded-[18px] p-4 sm:p-6 shadow-[0_4px_16px_0_rgba(31,38,135,0.03)] border border-surface-variant/50">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Connections
              </h3>
              <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-label-md text-label-md shadow-sm">{isLoading ? '...' : acquaintances.length}</span>
            </div>
            <div className="mt-4">
              <AcquaintanceList
                acquaintances={acquaintances}
                isBusy={isLoading}
                onRemove={(userId) => void handleRemoveAcquaintance(userId)}
                pendingAction={pendingAction}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
