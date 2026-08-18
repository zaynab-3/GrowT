import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { getSupabaseClient, hasSupabaseClient } from './clientService'

export type AuthStateChangeHandler = (event: AuthChangeEvent, session: Session | null) => void
export type { Session }

export function isAuthConfigured() {
  return hasSupabaseClient()
}

export function getSession() {
  return getSupabaseClient().auth.getSession()
}

export function getUser() {
  return getSupabaseClient().auth.getUser()
}

export function onAuthStateChange(handler: AuthStateChangeHandler) {
  const {
    data: { subscription },
  } = getSupabaseClient().auth.onAuthStateChange(handler)

  return subscription
}

export function signUpWithEmail(email: string, password: string, username: string, redirectTo: string) {
  return getSupabaseClient().auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        username,
        display_name: username,
      },
    },
  })
}

export function signInWithPassword(email: string, password: string) {
  return getSupabaseClient().auth.signInWithPassword({ email, password })
}

export function signInWithGoogle(redirectTo: string) {
  return getSupabaseClient().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      scopes: 'https://www.googleapis.com/auth/tasks.readonly',
    },
  })
}

export function sendPasswordResetEmail(email: string, redirectTo: string) {
  return getSupabaseClient().auth.resetPasswordForEmail(email, { redirectTo })
}

export function updatePassword(password: string) {
  return getSupabaseClient().auth.updateUser({ password })
}

export function updateEmail(email: string, redirectTo: string) {
  return getSupabaseClient().auth.updateUser(
    { email },
    { emailRedirectTo: redirectTo },
  )
}

export function signOut(options?: Parameters<ReturnType<typeof getSupabaseClient>['auth']['signOut']>[0]) {
  return getSupabaseClient().auth.signOut(options)
}

export function setRealtimeAuth(accessToken: string) {
  getSupabaseClient().realtime.setAuth(accessToken)
}
