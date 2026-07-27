import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  CircleDot,
  CircleGauge,
  ListChecks,
  ReceiptText,
  UsersRound,
  X,
} from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import {
  formatCurrency,
  type RecipientCredit,
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

type RecipientTab = 'people' | 'status'

const statusItems = [
  { Icon: CircleDot, key: 'ongoing', label: 'Ongoing' },
  { Icon: CircleGauge, key: 'half_done', label: 'Half done' },
  { Icon: CircleCheckBig, key: 'fully_completed', label: 'Completed' },
  { Icon: CheckCircle2, key: 'completed_other_half', label: 'Other half' },
] as const

function getUserTotalCount(user: RecipientUserSummary) {
  return user.ongoing + user.halfDone + user.fullyCompleted + user.completedOtherHalf
}

function getCreditLabel(credit: RecipientCredit) {
  if (credit.kind === 'ongoing') return 'Ongoing'
  if (credit.kind === 'half_done') return 'Half done'
  if (credit.kind === 'fully_completed') return 'Completed'
  return 'Completed other half'
}

export function RecipientReportPopup({
  getProfileAvatar,
  getProfileLabel,
  isOpen,
  onClose,
  report,
  subtitle,
  title,
}: RecipientReportPopupProps) {
  const [activeTab, setActiveTab] = useState<RecipientTab>('people')
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [showTaskBreakdown, setShowTaskBreakdown] = useState(false)
  const breakdownRef = useRef<HTMLDivElement>(null)

  const totalStatusCount = useMemo(
    () =>
      report.taskStates.ongoing +
      report.taskStates.half_done +
      report.taskStates.fully_completed +
      report.taskStates.completed_other_half,
    [report],
  )

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

  function toggleTaskBreakdown() {
    const willOpen = !showTaskBreakdown
    setShowTaskBreakdown(willOpen)
    if (willOpen) {
      window.requestAnimationFrame(() => {
        breakdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
  }

  return createPortal(
    <div className="recipient-sheet-overlay" onClick={onClose}>
      <section
        aria-labelledby="recipient-sheet-title"
        aria-modal="true"
        className="recipient-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div aria-hidden="true" className="recipient-sheet__handle" />

        <header className="recipient-sheet__header">
          <span className="recipient-sheet__header-icon">
            <ReceiptText aria-hidden="true" size={22} />
          </span>
          <div className="recipient-sheet__header-copy">
            <h2 id="recipient-sheet-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            aria-label="Close recipient report"
            className="recipient-sheet__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={22} />
          </button>
        </header>

        <div className="recipient-sheet__scroll">
          <section aria-label="Recipient payout summary" className="recipient-sheet__summary">
            <div className="recipient-sheet__payout">
              <span className="recipient-sheet__summary-icon">$</span>
              <div>
                <strong>{formatCurrency(report.paidAmount)}</strong>
                <span>total payout</span>
              </div>
              <p>Based on completed task credit</p>
            </div>

            <div className="recipient-sheet__summary-stats">
              <div>
                <span className="recipient-sheet__stat-icon">
                  <CheckCircle2 aria-hidden="true" size={18} />
                </span>
                <strong>{report.completedTaskCount}</strong>
                <span>completed</span>
              </div>
              <div>
                <span className="recipient-sheet__stat-icon">
                  <UsersRound aria-hidden="true" size={18} />
                </span>
                <strong>{report.users.length}</strong>
                <span>recipients</span>
              </div>
            </div>
          </section>

          <section className="recipient-sheet__report">
            <div aria-label="Recipient report views" className="recipient-sheet__tabs" role="tablist">
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
              <button
                aria-selected={activeTab === 'status'}
                className={activeTab === 'status' ? 'is-active' : ''}
                onClick={() => setActiveTab('status')}
                role="tab"
                type="button"
              >
                <CircleGauge aria-hidden="true" size={18} />
                Status breakdown
              </button>
            </div>

            {activeTab === 'people' ? (
              <div className="recipient-sheet__people" role="tabpanel">
                {report.users.map((user) => {
                  const label = getProfileLabel(user.userId)
                  const isExpanded = expandedUserId === user.userId
                  const completedCount = user.fullyCompleted + user.completedOtherHalf

                  return (
                    <article className="recipient-person" key={user.userId}>
                      <button
                        aria-expanded={isExpanded}
                        className="recipient-person__main"
                        onClick={() => setExpandedUserId(isExpanded ? null : user.userId)}
                        type="button"
                      >
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
                        <ChevronRight
                          aria-hidden="true"
                          className={isExpanded ? 'recipient-person__chevron is-open' : 'recipient-person__chevron'}
                          size={20}
                        />
                      </button>

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

                      {isExpanded ? (
                        <div className="recipient-person__credits">
                          {user.credits.map((credit) => (
                            <div key={`${credit.taskId}:${credit.kind}:${credit.userId}`}>
                              <span>
                                <i className={`recipient-credit-dot recipient-credit-dot--${credit.kind}`} />
                                {credit.taskTitle}
                              </span>
                              <small>{getCreditLabel(credit)}</small>
                              <strong>{formatCurrency(credit.amount)}</strong>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  )
                })}

                {!report.users.length ? (
                  <div className="recipient-sheet__empty">
                    <UsersRound aria-hidden="true" size={28} />
                    <strong>No recipient activity yet</strong>
                    <span>Status credit will appear here as tasks move forward.</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="recipient-sheet__status-breakdown" role="tabpanel">
                {statusItems.map(({ Icon, key, label }) => {
                  const count = report.taskStates[key]
                  const percent = totalStatusCount > 0 ? Math.round((count / totalStatusCount) * 100) : 0

                  return (
                    <div className={`recipient-status-row recipient-status-row--${key}`} key={key}>
                      <span className="recipient-status-row__icon">
                        <Icon aria-hidden="true" size={18} />
                      </span>
                      <div>
                        <strong>{label}</strong>
                        <span>{count} {count === 1 ? 'task' : 'tasks'}</span>
                      </div>
                      <span className="recipient-status-row__bar">
                        <i style={{ width: `${percent}%` }} />
                      </span>
                      <strong>{percent}%</strong>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              aria-expanded={showTaskBreakdown}
              className="recipient-sheet__breakdown-toggle"
              onClick={toggleTaskBreakdown}
              type="button"
            >
              <span className="recipient-sheet__breakdown-icon">
                <ListChecks aria-hidden="true" size={18} />
              </span>
              <span>View task breakdown</span>
              <ChevronDown
                aria-hidden="true"
                className={showTaskBreakdown ? 'is-open' : ''}
                size={19}
              />
            </button>

            {showTaskBreakdown ? (
              <div className="recipient-sheet__task-breakdown" ref={breakdownRef}>
                {report.users.flatMap((user) =>
                  user.credits.map((credit) => (
                    <div key={`${credit.taskId}:${credit.userId}:${credit.kind}:breakdown`}>
                      <span>{credit.taskTitle}</span>
                      <small>{getProfileLabel(user.userId)} · {getCreditLabel(credit)}</small>
                      <strong>{formatCurrency(credit.amount)}</strong>
                    </div>
                  )),
                )}
                {!report.users.some((user) => user.credits.length) ? (
                  <p className="recipient-sheet__task-breakdown-empty">
                    Task credit will appear here after recipient activity is recorded.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </div>,
    document.body,
  )
}
