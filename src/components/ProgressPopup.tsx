import { BadgeCheck, CircleCheckBig, CircleDot, CircleGauge, Info, X } from 'lucide-react'
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
  completedOtherHalf: number
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

      if (isMobile) {
        setCoords({ top: minTop, left: margin })
        return
      }

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
    <div className="progress-popup-layer">
      <div
        ref={popupRef}
        className="progress-popup fixed stitch-panel"
        style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="stitch-panel__header progress-popup__header">
          <div className="progress-popup__heading">
            <span className="progress-popup__heading-icon"><Info size={17} /></span>
            <div>
              <h3 className="stitch-panel__title">{title}</h3>
              <span>{subtitle}</span>
            </div>
          </div>
          <button
            aria-label="Close folder progress"
            className="progress-popup__close"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="stitch-panel__body progress-popup__body">
          <div className="progress-popup__list">
            {users.map((user) => (
              <article className="progress-popup__person" key={user.id}>
                <div className="progress-popup__identity">
                  <UserAvatar label={user.label} avatarUrl={user.avatarUrl} className="w-8 h-8 text-[11px]" />
                  <strong>{user.label}</strong>
                </div>

                <div className="progress-popup__stats" aria-label={`${user.label} progress`}>
                  <span className="progress-popup__stat progress-popup__stat--ongoing">
                    <CircleDot aria-hidden="true" size={15} />
                    <strong>{user.ongoing}</strong>
                    <small>Ongoing</small>
                  </span>
                  <span className="progress-popup__stat progress-popup__stat--half">
                    <CircleGauge aria-hidden="true" size={15} />
                    <strong>{user.halfDone}</strong>
                    <small>Half</small>
                  </span>
                  <span className="progress-popup__stat progress-popup__stat--completed">
                    <CircleCheckBig aria-hidden="true" size={15} />
                    <strong>{user.completed}</strong>
                    <small>Done</small>
                  </span>
                  <span className="progress-popup__stat progress-popup__stat--other">
                    <BadgeCheck aria-hidden="true" size={15} />
                    <strong>{user.completedOtherHalf}</strong>
                    <small>Other</small>
                  </span>
                </div>
              </article>
            ))}

            {users.length === 0 ? (
              <div className="progress-popup__empty">
                <Info aria-hidden="true" size={27} />
                <span>No progress to show.</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
