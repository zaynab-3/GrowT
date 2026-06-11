import type { RealtimeChannel } from '@supabase/supabase-js'
import { getSupabaseClient, hasSupabaseClient } from './clientService'

type ConfigureChannel = (channel: RealtimeChannel) => RealtimeChannel
type SubscribeCallback = Parameters<RealtimeChannel['subscribe']>[0]

export function isRealtimeConfigured() {
  return hasSupabaseClient()
}

export function subscribeToChannel(
  name: string,
  configureChannel: ConfigureChannel,
  onStatusChange?: SubscribeCallback,
) {
  const channel = configureChannel(getSupabaseClient().channel(name))
  channel.subscribe(onStatusChange)
  return channel
}

export function removeChannel(channel: RealtimeChannel) {
  return getSupabaseClient().removeChannel(channel)
}
