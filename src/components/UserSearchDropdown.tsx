import { useState, useEffect, useRef } from 'react'
import { UserAvatar } from './UserAvatar'
import { supabase } from '../lib/supabase'
import { searchProfilesWithRelationship, type MemberPickerProfile } from '../features/members/memberPickerApi'
import { normalizeUsername } from '../lib/growtDisplay'

type UserSearchDropdownProps = {
  value: string
  onChange: (value: string) => void
  onSelect?: (username: string, profile: MemberPickerProfile) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  excludeUsernames?: string[]
  excludeUserIds?: string[]
}

export function UserSearchDropdown({ value, onChange, onSelect, placeholder, className, disabled, excludeUsernames = [], excludeUserIds = [] }: UserSearchDropdownProps) {
  const [results, setResults] = useState<MemberPickerProfile[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!value || value.length < 1) {
      setResults([])
      setIsOpen(false)
      setIsSearching(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      setIsOpen(true)
      try {
        if (!supabase) return
        const searchResults = await searchProfilesWithRelationship(supabase, normalizeUsername(value) || '')
        setResults(searchResults)
        setIsOpen(true)
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [value])

  const excludedUsernames = excludeUsernames
    .map((username) => normalizeUsername(username) ?? username.trim().toLowerCase())
    .filter(Boolean)

  function getDisabledReason(profile: MemberPickerProfile) {
    const normalizedUsername = normalizeUsername(profile.username) ?? profile.username.trim().toLowerCase()

    if (excludeUserIds.includes(profile.user_id)) {
      return 'Already a collaborator'
    }

    if (excludedUsernames.includes(normalizedUsername)) {
      return 'Already invited'
    }

    return null
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true) }}
        placeholder={placeholder}
        disabled={disabled}
      />
      
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-2 bg-surface border border-surface-variant rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="px-3 py-3 text-center text-on-surface-variant text-sm">Searching...</div>
          ) : results.length > 0 ? (
            <ul className="py-1">
              {results.map((profile) => {
                const primaryLabel = profile.display_name?.trim() || profile.username
                const disabledReason = getDisabledReason(profile)
                const isResultDisabled = Boolean(disabledReason)

                return (
                  <li key={profile.user_id}>
                    <button
                      type="button"
                      aria-disabled={isResultDisabled}
                      disabled={isResultDisabled}
                      className={`w-full px-3 py-2 text-left flex items-center gap-3 transition-colors ${
                        isResultDisabled
                          ? 'cursor-not-allowed opacity-60'
                          : 'hover:bg-surface-variant focus:bg-surface-variant'
                      }`}
                      onClick={() => {
                        if (isResultDisabled) return
                        onChange(profile.username)
                        onSelect?.(profile.username, profile)
                        setIsOpen(false)
                      }}
                    >
                      <UserAvatar
                        label={primaryLabel}
                        avatarChoice={profile.avatar_choice}
                        avatarUrl={profile.avatar_url}
                        className="w-8 h-8 text-xs shrink-0"
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="font-semibold text-sm text-on-surface truncate">{primaryLabel}</span>
                        <span className="text-xs text-on-surface-variant truncate">@{profile.username}</span>
                      </div>
                      {disabledReason ? (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          {disabledReason}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="px-3 py-3 text-center text-on-surface-variant text-sm">No users found.</div>
          )}
        </div>
      )}
    </div>
  )
}
