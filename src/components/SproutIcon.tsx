import { GrowTLogo } from './GrowTLogo'

/** Backwards-compatible brand-mark wrapper used by the app shell. */
export function SproutIcon({ size = 22 }: { size?: number }) {
  return <GrowTLogo size={size} />
}
