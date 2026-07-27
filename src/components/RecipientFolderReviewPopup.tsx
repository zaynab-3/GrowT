import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle2,
  ChevronDown,
  CircleDot,
  CircleGauge,
  DollarSign,
  FolderOpen,
  ReceiptText,
  UsersRound,
  X,
} from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import {
  formatCurrency,
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

type ReviewTab = 'folders' | 'people'

function getUserTotalCount(user: RecipientUserSummary) {
  return user.ongoing + user.halfDone + user.fullyCompleted + user.completedOtherHalf
}

export function RecipientFolderReviewPopup({
  combinedReport,
  folderReviews,
  getProfileAvatar,
  getProfileLabel,
  isOpen,
  onClose,
}: RecipientFolderReviewPopupProps) {
  const [activeTab, setActiveTab] = useState<ReviewTab>('folders')
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set())

  function toggleFolderDetails(folderId: string) {
    setExpandedFolderIds((current) => {
      const next = new Set(current)

      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }

      return next
    })
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="recipient-sheet-overlay" onClick={onClose}>
      <section
        aria-labelledby="folder-recipient-sheet-title"
        aria-modal="true"
        className="recipient-sheet recipient-folder-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div aria-hidden="true" className="recipient-sheet__handle" />

        <header className="recipient-sheet__header">
          <span className="recipient-sheet__header-icon">
            <ReceiptText aria-hidden="true" size={22} />
          </span>
          <div className="recipient-sheet__header-copy">
            <h2 id="folder-recipient-sheet-title">Selected folder recipients</h2>
            <p>
              {folderReviews.length} {folderReviews.length === 1 ? 'folder' : 'folders'}
              {' · '}
              {combinedReport.taskCount} {combinedReport.taskCount === 1 ? 'task' : 'tasks'}
            </p>
          </div>
          <button
            aria-label="Close selected folder recipient review"
            className="recipient-sheet__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={22} />
          </button>
        </header>

        <div className="recipient-sheet__scroll">
          <section aria-label="Selected folder payout summary" className="recipient-sheet__summary">
            <div className="recipient-sheet__payout">
              <span className="recipient-sheet__summary-icon">
                <DollarSign aria-hidden="true" size={21} strokeWidth={2.35} />
              </span>
              <div>
                <strong>{formatCurrency(combinedReport.paidAmount)}</strong>
                <span>total payout</span>
              </div>
              <p>Based on completed task credit</p>
            </div>

            <div className="recipient-sheet__summary-stats">
              <div>
                <span className="recipient-sheet__stat-icon">
                  <CheckCircle2 aria-hidden="true" size={18} />
                </span>
                <strong>{combinedReport.completedTaskCount}</strong>
                <span>completed</span>
              </div>
              <div>
                <span className="recipient-sheet__stat-icon">
                  <UsersRound aria-hidden="true" size={18} />
                </span>
                <strong>{combinedReport.users.length}</strong>
                <span>recipients</span>
              </div>
            </div>
          </section>

          <section className="recipient-sheet__report">
            <div aria-label="Selected recipient review views" className="recipient-sheet__tabs" role="tablist">
              <button
                aria-selected={activeTab === 'folders'}
                className={activeTab === 'folders' ? 'is-active' : ''}
                onClick={() => setActiveTab('folders')}
                role="tab"
                type="button"
              >
                <FolderOpen aria-hidden="true" size={18} />
                Folders
              </button>
              <button
                aria-selected={activeTab === 'people'}
                className={activeTab === 'people' ? 'is-active' : ''}
                onClick={() => setActiveTab('people')}
                role="tab"
                type="button"
              >
                <UsersRound aria-hidden="true" size={18} />
                People
              </button>
            </div>

            {activeTab === 'folders' ? (
              <div className="recipient-folder-sheet__folders" role="tabpanel">
                {folderReviews.map((folderReview) => {
                  const report = folderReview.report
                  const completedCount =
                    report.taskStates.fully_completed + report.taskStates.completed_other_half
                  const progress = report.taskCount
                    ? Math.round((report.completedTaskCount / report.taskCount) * 100)
                    : 0
                  const isExpanded = expandedFolderIds.has(folderReview.folderId)
                  const detailsId = `selected-folder-details-${folderReview.folderId}`

                  return (
                    <article className="recipient-folder-sheet__card" key={folderReview.folderId}>
                      <header>
                        <span className="recipient-folder-sheet__icon">
                          <FolderOpen aria-hidden="true" size={19} />
                        </span>
                        <span>
                          <strong>{folderReview.folderTitle}</strong>
                          <small>
                            {report.taskCount} {report.taskCount === 1 ? 'task' : 'tasks'}
                            {' · '}
                            {progress}% complete
                          </small>
                        </span>
                        <b>{formatCurrency(report.paidAmount)}</b>
                      </header>

                      <span className="recipient-folder-sheet__progress" aria-label={`${progress}% complete`}>
                        <i style={{ width: `${progress}%` }} />
                      </span>

                      <div className="recipient-folder-sheet__statuses">
                        <span>
                          <CircleDot aria-hidden="true" size={15} />
                          <small>Ongoing</small>
                          <strong>{report.taskStates.ongoing}</strong>
                        </span>
                        <span>
                          <CircleGauge aria-hidden="true" size={15} />
                          <small>Half done</small>
                          <strong>{report.taskStates.half_done}</strong>
                        </span>
                        <span>
                          <CheckCircle2 aria-hidden="true" size={15} />
                          <small>Completed</small>
                          <strong>{completedCount}</strong>
                        </span>
                      </div>

                      <div className="recipient-folder-sheet__people">
                        {report.users.slice(0, 4).map((user) => {
                          const label = getProfileLabel(user.userId)
                          return (
                            <UserAvatar
                              avatarUrl={getProfileAvatar(user.userId)}
                              className="recipient-folder-sheet__avatar"
                              key={user.userId}
                              label={label}
                            />
                          )
                        })}
                        <span>
                          {report.users.length
                            ? `${report.users.length} ${report.users.length === 1 ? 'recipient' : 'recipients'}`
                            : 'No recipient activity yet'}
                        </span>
                      </div>

                      <button
                        aria-controls={detailsId}
                        aria-expanded={isExpanded}
                        className="recipient-folder-sheet__details-toggle"
                        onClick={() => toggleFolderDetails(folderReview.folderId)}
                        type="button"
                      >
                        <span>{isExpanded ? 'Hide details' : 'Show more details'}</span>
                        <ChevronDown
                          aria-hidden="true"
                          className={isExpanded ? 'is-expanded' : ''}
                          size={17}
                        />
                      </button>

                      <div
                        className={`recipient-folder-sheet__details${isExpanded ? ' is-expanded' : ''}`}
                        id={detailsId}
                      >
                        <div>
                          {report.users.map((user) => {
                            const label = getProfileLabel(user.userId)

                            return (
                              <article className="recipient-folder-sheet__detail-person" key={user.userId}>
                                <header>
                                  <UserAvatar
                                    avatarUrl={getProfileAvatar(user.userId)}
                                    className="recipient-folder-sheet__detail-avatar"
                                    label={label}
                                  />
                                  <span>
                                    <strong>{label}</strong>
                                    <small>{getUserTotalCount(user)} credited task marks</small>
                                  </span>
                                  <b>{formatCurrency(user.amount)}</b>
                                </header>

                                <div
                                  aria-label={`${label} task credit breakdown`}
                                  className="recipient-folder-sheet__detail-statuses"
                                >
                                  <span>
                                    <CircleDot aria-hidden="true" size={14} />
                                    <small>Ongoing</small>
                                    <strong>{user.ongoing}</strong>
                                  </span>
                                  <span>
                                    <CircleGauge aria-hidden="true" size={14} />
                                    <small>Half done</small>
                                    <strong>{user.halfDone}</strong>
                                  </span>
                                  <span>
                                    <CheckCircle2 aria-hidden="true" size={14} />
                                    <small>Completed</small>
                                    <strong>{user.fullyCompleted}</strong>
                                  </span>
                                  <span>
                                    <CheckCircle2 aria-hidden="true" size={14} />
                                    <small>Other half</small>
                                    <strong>{user.completedOtherHalf}</strong>
                                  </span>
                                </div>
                              </article>
                            )
                          })}

                          {!report.users.length ? (
                            <p className="recipient-folder-sheet__details-empty">
                              Recipient activity for this folder will appear here.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="recipient-sheet__people" role="tabpanel">
                {combinedReport.users.map((user) => {
                  const label = getProfileLabel(user.userId)
                  const completedCount = user.fullyCompleted + user.completedOtherHalf

                  return (
                    <article className="recipient-person" key={user.userId}>
                      <div className="recipient-person__main">
                        <UserAvatar
                          avatarUrl={getProfileAvatar(user.userId)}
                          className="recipient-person__avatar"
                          label={label}
                        />
                        <span className="recipient-person__identity">
                          <strong>{label}</strong>
                          <small>{getUserTotalCount(user)} credited task marks</small>
                        </span>
                        <strong className="recipient-person__amount">{formatCurrency(user.amount)}</strong>
                      </div>

                      <div className="recipient-person__status">
                        <span className="recipient-person__status-item recipient-person__status-item--ongoing">
                          <CircleDot aria-hidden="true" size={15} />
                          <span>Ongoing</span>
                          <strong>{user.ongoing}</strong>
                        </span>
                        <span className="recipient-person__status-item recipient-person__status-item--half_done">
                          <CircleGauge aria-hidden="true" size={15} />
                          <span>Half done</span>
                          <strong>{user.halfDone}</strong>
                        </span>
                        <span className="recipient-person__status-item recipient-person__status-item--completed">
                          <CheckCircle2 aria-hidden="true" size={15} />
                          <span>Completed</span>
                          <strong>{completedCount}</strong>
                        </span>
                      </div>
                    </article>
                  )
                })}

                {!combinedReport.users.length ? (
                  <div className="recipient-sheet__empty">
                    <UsersRound aria-hidden="true" size={28} />
                    <strong>No recipient activity yet</strong>
                    <span>Completed task credit will appear here.</span>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>,
    document.body,
  )
}
