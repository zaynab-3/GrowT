import { useState, useEffect, useRef } from 'react'
import { Check, UserRoundCheck, UserRoundPlus } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { isSupabaseConfigured } from '../services/clientService'
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
  groupByRelationship?: boolean
}

export function UserSearchDropdown({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  disabled,
  excludeUsernames = [],
  excludeUserIds = [],
  groupByRelationship = false,
}: UserSearchDropdownProps) {
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
        if (!isSupabaseConfigured) return
        const searchResults = await searchProfilesWithRelationship(normalizeUsername(value) || '')
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

  const resultGroups = groupByRelationship
    ? [
        {
          key: 'acquainted',
          label: 'Acquainted',
          profiles: results.filter((profile) => profile.relationship_status === 'acquaintance'),
        },
        {
          key: 'suggestions',
          label: 'Suggestions',
          profiles: results.filter((profile) => profile.relationship_status !== 'acquaintance'),
        },
      ].filter((group) => group.profiles.length > 0)
    : [{ key: 'results', label: '', profiles: results }]

  return (
    <div ref={wrapperRef} className="user-search-dropdown relative w-full">
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
        <div className="user-search-dropdown__menu absolute left-0 right-0 z-50 mt-2 bg-surface border border-surface-variant rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="px-3 py-3 text-center text-on-surface-variant text-sm">Searching...</div>
          ) : results.length > 0 ? (
            <div className="user-search-dropdown__groups">
              {resultGroups.map((group) => (
                <section className="user-search-dropdown__group" key={group.key}>
                  {group.label ? <h3>{group.label}</h3> : null}
                  <ul>
                    {group.profiles.map((profile) => {
                      const primaryLabel = profile.display_name?.trim() || profile.username
                      const disabledReason = getDisabledReason(profile)
                      const isResultDisabled = Boolean(disabledReason)
                      const isSelected =
                        normalizeUsername(value) === normalizeUsername(profile.username)

                      return (
                        <li key={profile.user_id}>
                          <button
                            aria-disabled={isResultDisabled}
                            aria-label={
                              isResultDisabled
                                ? `${primaryLabel} is already in this folder`
                                : `Select ${primaryLabel}`
                            }
                            className={`user-search-dropdown__result${
                              isSelected ? ' is-selected' : ''
                            }${isResultDisabled ? ' is-disabled' : ''}`}
                            disabled={isResultDisabled}
                            onClick={() => {
                              if (isResultDisabled) return
                              onChange(profile.username)
                              onSelect?.(profile.username, profile)
                              setIsOpen(false)
                            }}
                            type="button"
                          >
                            <UserAvatar
                              label={primaryLabel}
                              avatarChoice={profile.avatar_choice}
                              avatarUrl={profile.avatar_url}
                              className="w-8 h-8 text-xs shrink-0"
                            />
                            <span className="user-search-dropdown__identity">
                              <strong>{primaryLabel}</strong>
                              <small>@{profile.username}</small>
                            </span>
                            <span
                              className={`user-search-dropdown__select-icon ${
                                profile.relationship_status === 'acquaintance'
                                  ? 'is-acquainted'
                                  : 'is-suggestion'
                              }`}
                              title={disabledReason ?? (isSelected ? 'Selected' : 'Select user')}
                            >
                              {isResultDisabled || profile.relationship_status === 'acquaintance' ? (
                                <UserRoundCheck aria-hidden="true" size={17} />
                              ) : isSelected ? (
                                <Check aria-hidden="true" size={17} />
                              ) : (
                                <UserRoundPlus aria-hidden="true" size={17} />
                              )}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="px-3 py-3 text-center text-on-surface-variant text-sm">No users found.</div>
          )}
        </div>
      )}
    </div>
  )
}
