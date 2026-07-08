import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ReceiptText, X } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import {
  formatCurrency,
  recipientLegend,
  type RecipientReport,
  type RecipientUserSummary,
} from '../lib/recipient'

type RecipientReportPopupProps = {
  anchorRect: DOMRect | null
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  isOpen: boolean
  onClose: () => void
  report: RecipientReport
  subtitle: string
  title: string
}

function getUserTotalCount(user: RecipientUserSummary) {
  return user.ongoing + user.halfDone + user.fullyCompleted + user.completedOtherHalf
}

export function RecipientReportPopup({
  anchorRect,
  getProfileAvatar,
  getProfileLabel,
  isOpen,
  onClose,
  report,
  subtitle,
  title,
}: RecipientReportPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ left: 0, top: 0 })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen || !anchorRect) {
      return
    }

    const margin = 16
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const isMobile = viewportWidth <= 640
    const popupWidth = isMobile ? viewportWidth - margin * 2 : 420
    const minTop = isMobile ? 96 : margin
    const bottomReserve = isMobile ? 72 : margin

    if (isMobile) {
      setCoords({ left: margin, top: minTop })
      return
    }

    let top = anchorRect.bottom + 8
    let left = anchorRect.left + anchorRect.width / 2 - popupWidth / 2

    if (left < margin) {
      left = margin
    } else if (left + popupWidth > viewportWidth - margin) {
      left = viewportWidth - popupWidth - margin
    }

    const popupHeight = popupRef.current?.offsetHeight || 360
    if (top + popupHeight > viewportHeight - bottomReserve) {
      top = Math.max(minTop, anchorRect.top - popupHeight - 8)
    }

    setCoords({
      left,
      top: Math.max(minTop, Math.min(top, viewportHeight - popupHeight - bottomReserve)),
    })
  }, [anchorRect, isOpen, report])

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div
      className="recipient-popup fixed stitch-panel w-[420px] max-w-[calc(100vw-32px)] z-[220]"
      onClick={(event) => event.stopPropagation()}
      ref={popupRef}
      style={{ left: `${coords.left}px`, top: `${coords.top}px` }}
    >
      <div className="stitch-panel__header recipient-popup__header">
        <div className="min-w-0">
          <h3 className="stitch-panel__title flex items-center gap-2">
            <ReceiptText size={16} className="text-primary" />
            {title}
          </h3>
          <p className="m-0 mt-0.5 truncate text-xs font-semibold text-on-surface-variant">
            {subtitle}
          </p>
        </div>
        <button
          className="recipient-popup__close"
          onClick={onClose}
          title="Close recipient report"
          type="button"
        >
          <X size={16} />
        </button>
      </div>

      <div className="stitch-panel__body recipient-popup__body">
        <div className="recipient-popup__summary">
          <div>
            <span>Total payout</span>
            <strong>{formatCurrency(report.paidAmount)}</strong>
          </div>
          <div>
            <span>Tasks</span>
            <strong>{report.taskCount}</strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>{report.completedTaskCount}</strong>
          </div>
        </div>

        <div className="recipient-legend" aria-label="Recipient color legend">
          {recipientLegend.map((item) => (
            <span key={item.key}>
              <i className={`recipient-dot recipient-dot--${item.key}`} />
              {item.label}
            </span>
          ))}
        </div>

        <div className="recipient-popup__task-counts">
          <span>
            <i className="recipient-dot recipient-dot--ongoing" />
            {report.taskStates.ongoing} ongoing
          </span>
          <span>
            <i className="recipient-dot recipient-dot--half_done" />
            {report.taskStates.half_done} half done
          </span>
          <span>
            <i className="recipient-dot recipient-dot--fully_completed" />
            {report.taskStates.fully_completed} fully completed
          </span>
          <span>
            <i className="recipient-dot recipient-dot--completed_other_half" />
            {report.taskStates.completed_other_half} other half
          </span>
        </div>

        <div className="recipient-user-list">
          {report.users.map((user) => {
            const label = getProfileLabel(user.userId)

            return (
              <div className="recipient-user-row" key={user.userId}>
                <div className="recipient-user-row__main">
                  <UserAvatar
                    avatarUrl={getProfileAvatar(user.userId)}
                    className="h-8 w-8 text-xs"
                    label={label}
                  />
                  <div className="min-w-0">
                    <strong>{label}</strong>
                    <span>{getUserTotalCount(user)} credited task marks</span>
                  </div>
                </div>

                <div className="recipient-user-row__amount">{formatCurrency(user.amount)}</div>

                <div className="recipient-user-row__counts">
                  <span title="Ongoing">
                    <i className="recipient-dot recipient-dot--ongoing" />
                    {user.ongoing}
                  </span>
                  <span title="Half Done">
                    <i className="recipient-dot recipient-dot--half_done" />
                    {user.halfDone}
                  </span>
                  <span title="Fully Completed">
                    <i className="recipient-dot recipient-dot--fully_completed" />
                    {user.fullyCompleted}
                  </span>
                  <span title="Completed Other Half">
                    <i className="recipient-dot recipient-dot--completed_other_half" />
                    {user.completedOtherHalf}
                  </span>
                </div>
              </div>
            )
          })}

          {!report.users.length ? (
            <div className="recipient-empty">
              <ReceiptText size={32} />
              No recipient activity yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
