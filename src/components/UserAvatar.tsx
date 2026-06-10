import { getAvatarSrc } from '../lib/appearance'
import type { AvatarChoice } from '../lib/database.types'

export function UserAvatar({
  avatarChoice,
  label,
  avatarUrl,
  className = '',
}: {
  avatarChoice?: AvatarChoice | string | null
  label: string
  avatarUrl?: string | null
  className?: string
}) {
  const fallbackLabel = label.trim() || 'User'
  const fallbackInitial = fallbackLabel.replace(/^@+/, '').charAt(0).toUpperCase() || 'U'
  const imageUrl = avatarUrl?.trim() || (avatarChoice ? getAvatarSrc(avatarChoice as AvatarChoice) : '')

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={fallbackLabel}
        className={`rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full bg-primary text-on-primary flex items-center justify-center font-bold ${className}`}
      title={fallbackLabel}
    >
      {fallbackInitial}
    </div>
  )
}
