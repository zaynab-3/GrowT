import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { supabase } from '../lib/supabase'
import { searchProfilesWithRelationship, sendAcquaintanceRequest, type MemberPickerProfile } from '../features/members/memberPickerApi'
import { normalizeUsername } from '../lib/growtDisplay'
import type { Folder, Task } from '../lib/growtData'
import type { AppView } from '../views/viewTypes'

type GlobalSearchDropdownProps = {
  folders: Folder[]
  tasks: Task[]
  onOpenFolder: (folderId: string) => void
  onNavigate: (view: AppView) => void
  onChange: (query: string) => void
  value: string
}

export function GlobalSearchDropdown({ folders, tasks, onOpenFolder, onNavigate, onChange, value }: GlobalSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const [folderResults, setFolderResults] = useState<Folder[]>([])
  const [taskResults, setTaskResults] = useState<Task[]>([])
  const [userResults, setUserResults] = useState<MemberPickerProfile[]>([])
  
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
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
      setFolderResults([])
      setTaskResults([])
      setUserResults([])
      setIsOpen(false)
      return
    }

    const q = value.toLowerCase()
    
    setFolderResults(folders.filter(f => f.title.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)))
    setTaskResults(tasks.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)))
    setIsOpen(true)

    const timeoutId = setTimeout(async () => {
      setIsSearchingUsers(true)
      try {
        if (!supabase) return
        const users = await searchProfilesWithRelationship(supabase, normalizeUsername(value) || '')
        setUserResults(users)
      } catch (err) {
        console.error('User search failed', err)
      } finally {
        setIsSearchingUsers(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [value, folders, tasks])

  return (
    <div ref={wrapperRef} className="global-search relative flex-1 md:w-64">
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
      <input 
        className="w-full bg-surface-container-low dark:bg-dark-card border-none rounded-xl pr-10 py-2.5 font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
        style={{ paddingLeft: '2.75rem' }}
        placeholder="Search folders, tasks, members..." 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (value.length > 0) setIsOpen(true) }}
      />
      {value ? (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-surface-variant text-on-surface-variant hover:bg-surface-variant/80 transition-colors"
          onClick={() => { onChange(''); setIsOpen(false); }}
          type="button"
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      ) : null}
      
      {isOpen && (
        <div className="global-search__panel absolute z-50 w-full md:w-[400px] right-0 mt-2 bg-surface border border-surface-variant rounded-xl shadow-lg max-h-80 overflow-y-auto">
          {folderResults.length === 0 && taskResults.length === 0 && userResults.length === 0 && !isSearchingUsers ? (
            <div className="p-4 text-center text-on-surface-variant text-sm">No results found</div>
          ) : (
            <div className="flex flex-col py-2">
              {folderResults.length > 0 && (
                <div className="px-4 pb-1 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Folders</h4>
                  {folderResults.map(f => (
                    <button key={f.id} className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-variant text-sm flex flex-col transition-colors" onClick={() => { onOpenFolder(f.id); setIsOpen(false); }}>
                      <span className="font-semibold text-on-surface">{f.title}</span>
                      {f.description && <span className="text-xs text-on-surface-variant truncate">{f.description}</span>}
                    </button>
                  ))}
                </div>
              )}
              
              {taskResults.length > 0 && (
                <div className="px-4 pb-1 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Tasks</h4>
                  {taskResults.map(t => (
                    <button key={t.id} className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-variant text-sm flex flex-col transition-colors" onClick={() => {
                      if (t.folder_id) {
                        onOpenFolder(t.folder_id)
                      } else {
                        onNavigate('tasks')
                      }
                      setIsOpen(false)
                    }}>
                      <span className="font-semibold text-on-surface">{t.title}</span>
                      {t.description ? (
                        <span className="text-xs text-on-surface-variant truncate">{t.description}</span>
                      ) : (
                        <span className="text-xs text-on-surface-variant truncate">
                          {t.folder_id ? "In a folder" : "Standalone task"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {isSearchingUsers ? (
                <div className="px-4 py-2 text-center text-xs text-on-surface-variant">Searching users...</div>
              ) : userResults.length > 0 ? (
                <div className="px-4 pb-1 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Users</h4>
                  {userResults.map(u => {
                    const primaryLabel = u.display_name?.trim() || u.username

                    return (
                      <div key={u.user_id} className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-variant text-sm flex items-center justify-between transition-colors group">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar label={primaryLabel} avatarChoice={u.avatar_choice} avatarUrl={u.avatar_url} className="w-8 h-8 text-xs shrink-0" />
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-semibold text-on-surface truncate">{primaryLabel}</span>
                            <span className="text-[10px] text-on-surface-variant truncate">@{u.username}</span>
                          </div>
                        </div>
                        
                        <div className="shrink-0 flex items-center">
                          {u.relationship_status === 'acquaintance' ? (
                            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                              Acquainted
                            </span>
                          ) : u.relationship_status === 'pending_outgoing' ? (
                            <span className="px-2 py-1 rounded-full bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                              Requested
                            </span>
                          ) : u.relationship_status === 'none' ? (
                            <button
                              className="px-2.5 py-1 rounded-full bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-90"
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (supabase) {
                                  try {
                                    const request = await sendAcquaintanceRequest(supabase, u.username)
                                    setUserResults(prev => prev.map(p => p.user_id === u.user_id ? { ...p, relationship_status: 'pending_outgoing', request_id: request.id } : p))
                                  } catch (err) {
                                    console.error(err)
                                  }
                                }
                              }}
                            >
                              Add Friend
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
