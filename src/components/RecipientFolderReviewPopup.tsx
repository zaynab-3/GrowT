import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ReceiptText, X } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import {
  formatCurrency,
  recipientLegend,
  type RecipientFolderReview,
  type RecipientReport,
  type RecipientUserSummary,
} from '../lib/recipient'

type RecipientFolderReviewPopupProps = {
  combinedReport: RecipientReport
  folderReviews: RecipientFolderReview[]
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  isOpen: boolean
  onClose: () => void
}

function getUserTotalCount(user: RecipientUserSummary) {
  return user.ongoing + user.halfDone + user.fullyCompleted + user.completedOtherHalf
}

function RecipientCountsRow({ report }: { report: RecipientReport }) {
  return (
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
  )
}

export function RecipientFolderReviewPopup({
  combinedReport,
  folderReviews,
  getProfileAvatar,
  getProfileLabel,
  isOpen,
  onClose,
}: RecipientFolderReviewPopupProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div className="recipient-review-overlay" onClick={onClose}>
      <div className="recipient-review-modal" onClick={(event) => event.stopPropagation()}>
        <div className="recipient-review-modal__header">
          <div className="min-w-0">
            <h3>
              <ReceiptText size={18} />
              Check Recipients
            </h3>
            <p>
              {folderReviews.length} selected {folderReviews.length === 1 ? 'folder' : 'folders'} ·{' '}
              {formatCurrency(combinedReport.paidAmount)} total payout
            </p>
          </div>
          <button onClick={onClose} title="Close selected folder recipient review" type="button">
            <X size={18} />
          </button>
        </div>

        <div className="recipient-review-modal__body">
          <div className="recipient-popup__summary recipient-review-summary">
            <div>
              <span>Selected folders</span>
              <strong>{folderReviews.length}</strong>
            </div>
            <div>
              <span>Total payout</span>
              <strong>{formatCurrency(combinedReport.paidAmount)}</strong>
            </div>
            <div>
              <span>Total tasks</span>
              <strong>{combinedReport.taskCount}</strong>
            </div>
            <div>
              <span>Completed</span>
              <strong>{combinedReport.completedTaskCount}</strong>
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

          <section className="recipient-review-section">
            <div className="recipient-review-section__header">
              <h4>Selected Folder Review</h4>
              <span>{formatCurrency(combinedReport.paidAmount)}</span>
            </div>

            <div className="recipient-folder-review-list">
              {folderReviews.map((folderReview) => (
                <article className="recipient-folder-review-card" key={folderReview.folderId}>
                  <div className="recipient-folder-review-card__header">
                    <div>
                      <strong>{folderReview.folderTitle}</strong>
                      <span>
                        {folderReview.report.taskCount} tasks · {folderReview.report.completedTaskCount} completed
                      </span>
                    </div>
                    <b>{formatCurrency(folderReview.report.paidAmount)}</b>
                  </div>

                  <RecipientCountsRow report={folderReview.report} />

                  <div className="recipient-folder-review-card__users">
                    {folderReview.report.users.map((user) => (
                      <span key={user.userId}>
                        {getProfileLabel(user.userId)} · {formatCurrency(user.amount)}
                      </span>
                    ))}
                    {!folderReview.report.users.length ? <span>No recipient activity yet.</span> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="recipient-review-section">
            <div className="recipient-review-section__header">
              <h4>User Totals Across Selected Folders</h4>
              <span>{combinedReport.users.length} users</span>
            </div>

            <div className="recipient-user-list">
              {combinedReport.users.map((user) => {
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

              {!combinedReport.users.length ? (
                <div className="recipient-empty">
                  <ReceiptText size={32} />
                  No recipient activity in the selected folders.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}
