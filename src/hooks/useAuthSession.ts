import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { AuthView } from '../auth/AuthPanel'
import { supabase } from '../lib/supabase'

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authView, setAuthView] = useState<AuthView>('login')

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
        setAuthView('reset')
      }
      setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      if (event === 'PASSWORD_RECOVERY') {
        setAuthView('reset')
      }
      setAuthReady(true)
    })

    return () => subscription.unsubscribe()
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
