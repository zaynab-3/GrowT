import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { AuthView } from '../auth/AuthPanel'
import { supabase } from '../lib/supabase'

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function isInvalidRefreshTokenError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  return message.includes('invalid refresh token') || message.includes('refresh token not found')
}

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authView, setAuthView] = useState<AuthView>(() => {
    const pathname = window.location.pathname.replace(/\/+$/g, '') || '/'

    if (pathname === '/register') {
      return 'register'
    }

    if (pathname === '/forgot') {
      return 'forgot'
    }

    return 'login'
  })

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }

    const client = supabase
    let isMounted = true

    const clearInvalidSession = (error: unknown) => {
      console.warn('Supabase auth session was invalid and has been cleared.', error)
      setSession(null)
      setAuthView('login')
      setAuthReady(true)
      void client.auth.signOut({ scope: 'local' }).catch((signOutError: unknown) => {
        if (!isInvalidRefreshTokenError(signOutError)) {
          console.warn('Local auth cleanup failed.', signOutError)
        }
      })
    }

    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return
        }

        if (error) {
          if (isInvalidRefreshTokenError(error)) {
            clearInvalidSession(error)
            return
          }

          console.error('Initial auth session load failed', error)
          setSession(null)
          setAuthReady(true)
          return
        }

        setSession(data.session)
        if (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
          setAuthView('reset')
        }
        setAuthReady(true)
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return
        }

        if (isInvalidRefreshTokenError(error)) {
          clearInvalidSession(error)
          return
        }

        console.error('Initial auth session load failed', error)
        setSession(null)
        setAuthReady(true)
      })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) {
        return
      }

      setSession(nextSession)
      if (event === 'PASSWORD_RECOVERY') {
        setAuthView('reset')
      }
      if (event === 'SIGNED_OUT') {
        setAuthView('login')
      }
      setAuthReady(true)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !session?.access_token) {
      return
    }

    supabase.realtime.setAuth(session.access_token)
  }, [session])

  return {
    authReady,
    authView,
    session,
    setAuthView,
    setSession,
  }
}
