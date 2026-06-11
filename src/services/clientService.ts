import type { SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

export type GrowTServiceClient = SupabaseClient<Database>

export function hasSupabaseClient() {
  return Boolean(supabase)
}

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  return supabase
}

export { isSupabaseConfigured }
