import { X, Info } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type ProgressUser = {
  id: string
  label: string
  avatarUrl: string | null
  ongoing: number
  halfDone: number
  completed: number
}

type ProgressPopupProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle: string
  users: ProgressUser[]
  anchorRect: DOMRect | null
}

export function ProgressPopup({ isOpen, onClose, title, subtitle, users, anchorRect }: ProgressPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && anchorRect) {
      const margin = 16
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const isMobile = viewportWidth <= 640
      const popupWidth = isMobile ? viewportWidth - margin * 2 : 340
      const minTop = isMobile ? 104 : margin
      const bottomReserve = isMobile ? 88 : margin

      let top = anchorRect.bottom + 8
      let left = anchorRect.left + anchorRect.width / 2 - popupWidth / 2

      if (left < margin) {
        left = margin
      } else if (left + popupWidth > viewportWidth - margin) {
        left = viewportWidth - popupWidth - margin
      }

      // Check height overflow and adjust to render above the trigger if needed
      const popupHeight = popupRef.current?.offsetHeight || 220
      if (top + popupHeight > viewportHeight - bottomReserve) {
        top = Math.max(minTop, anchorRect.top - popupHeight - 8)
      }

      top = Math.max(minTop, Math.min(top, viewportHeight - popupHeight - bottomReserve))

      setCoords({ top, left })
    }
  }, [isOpen, anchorRect, users.length])

  if (!isOpen) return null

  return createPortal(
    <div 
      ref={popupRef} 
      className="progress-popup fixed stitch-panel w-[340px] max-w-[calc(100vw-32px)] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-surface-variant/50 z-[200]" 
      style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
      onClick={e => e.stopPropagation()}
    >
      <div className="stitch-panel__header progress-popup__header flex justify-between items-center px-4 py-3">
        <div className="flex flex-col">
          <h3 className="stitch-panel__title m-0 text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Info size={14} />
            {title}
          </h3>
          <span className="text-xs text-on-surface-variant mt-0.5 truncate max-w-[220px]">{subtitle}</span>
        </div>
        <button
          className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-variant/50 transition-colors"
          onClick={onClose}
          type="button"
        >
          <X size={16} />
        </button>
      </div>

      <div className="stitch-panel__body p-0 max-h-[50vh] overflow-y-auto">
        <div className="flex flex-col">
          {users.map((user) => (
            <div key={user.id} className="p-3.5 border-b border-surface-variant/30 flex items-center justify-between hover:bg-surface-soft dark:hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <UserAvatar label={user.label} avatarUrl={user.avatarUrl} className="w-6 h-6 text-[10px]" />
                <strong className="text-on-surface text-[13px] font-bold truncate">{user.label}</strong>
              </div>
              <div className="flex items-center gap-3.5 flex-shrink-0">
                <span className="flex items-center gap-1.5 font-bold text-xs text-on-surface-variant" title="Ongoing">
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: 'var(--ongoing-color)' }}></span>
                  {user.ongoing}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-xs text-on-surface-variant" title="Half Done">
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: 'var(--halfdone-color)' }}></span>
                  {user.halfDone}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-xs text-on-surface-variant" title="Completed">
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: 'var(--done-color)' }}></span>
                  {user.completed}
                </span>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="p-8 text-center text-on-surface-variant font-medium text-sm flex flex-col items-center gap-2">
              <Info size={32} className="opacity-20" />
              No progress to show.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
