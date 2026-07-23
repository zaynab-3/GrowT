import { useEffect, useRef, useState } from 'react'
import { CheckCircle, RefreshCw, XCircle } from 'lucide-react'
import { isSupabaseConfigured } from '../services/clientService'
import { acceptInvite } from '../services/inviteService'

type InvitePageProps = {
  inviteId: string
  onInviteAccepted: (resourceType: 'folder' | 'task', resourceId: string) => Promise<void> | void
  onNavigateToHome: () => void
}

export function InvitePage({ inviteId, onInviteAccepted, onNavigateToHome }: InvitePageProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const processedInviteRef = useRef<string | null>(null)
  const redirectTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (processedInviteRef.current === inviteId) {
      return
    }
    processedInviteRef.current = inviteId

    async function processInvite() {
      if (!isSupabaseConfigured) {
        setStatus('error')
        setErrorMessage('Database connection not available.')
        return
      }

      try {
        const result = await acceptInvite(inviteId) as { resource_type: string; resource_id: string } | null
        setStatus('success')
        
        // Wait a brief moment to show success state before redirecting
        redirectTimerRef.current = window.setTimeout(() => {
          if (result && (result.resource_type === 'folder' || result.resource_type === 'task')) {
            void onInviteAccepted(result.resource_type, result.resource_id)
          }
        }, 700)
      } catch (error) {
        console.error('Failed to accept invite:', error)
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Invalid or expired invite link.')
      }
    }

    void processInvite()
  }, [inviteId, onInviteAccepted])

  return (
    <div className="invite-page growt-page flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      {status === 'loading' && (
        <>
          <RefreshCw className="animate-spin text-primary mb-6" size={64} />
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Processing Invite...</h2>
          <p className="font-body-lg text-on-surface-variant">Please wait while we add you to the workspace.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle className="text-done-color mb-6 animate-pulse" size={64} />
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Invite Accepted!</h2>
          <p className="font-body-lg text-on-surface-variant">Redirecting you to the shared workspace...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="text-danger mb-6" size={64} />
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Unable to Join</h2>
          <p className="font-body-lg text-on-surface-variant mb-8 max-w-md">{errorMessage}</p>
          <button 
            onClick={onNavigateToHome}
            className="btn btn--primary"
          >
            Go to Workspaces
          </button>
        </>
      )}
    </div>
  )
}
