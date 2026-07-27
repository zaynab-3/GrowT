import { useEffect, useState } from 'react'
import { CalendarDays, CheckSquare2, Circle, ExternalLink, RefreshCw, XCircle } from 'lucide-react'
import { RichDescription } from '../components/RichDescription'
import { SproutIcon } from '../components/SproutIcon'
import { formatDateTime, getCategoryLabel } from '../lib/growtDisplay'
import type { PublicTaskShare } from '../lib/growtData'
import { getPublicTaskShare } from '../services/inviteService'

type PublicTaskSharePageProps = {
  shareId: string
}

export function PublicTaskSharePage({ shareId }: PublicTaskSharePageProps) {
  const [share, setShare] = useState<PublicTaskShare | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    void getPublicTaskShare(shareId)
      .then((nextShare) => {
        if (isMounted) setShare(nextShare)
      })
      .catch((error: unknown) => {
        if (!isMounted) return
        setErrorMessage(error instanceof Error ? error.message : 'This task link is invalid or has expired.')
      })

    return () => {
      isMounted = false
    }
  }, [shareId])

  return (
    <main className="public-task-share">
      <header className="public-task-share__brand">
        <span className="brand-mark brand-mark--sm"><SproutIcon size={18} /></span>
        <strong>GrowT</strong>
        <span>View-only task</span>
      </header>

      {!share && !errorMessage ? (
        <section className="public-task-share__state" aria-live="polite">
          <RefreshCw className="animate-spin" size={24} />
          <h1>Opening shared task</h1>
          <p>No account is needed to view it.</p>
        </section>
      ) : null}

      {errorMessage ? (
        <section className="public-task-share__state public-task-share__state--error" role="alert">
          <XCircle size={28} />
          <h1>Task unavailable</h1>
          <p>{errorMessage}</p>
          <a className="button button--primary" href="/">Open GrowT</a>
        </section>
      ) : null}

      {share ? (
        <article className="public-task-share__card">
          <div className="public-task-share__eyebrow">
            <span>{getCategoryLabel(share.task.category)}</span>
            <span>{share.task.is_active ? 'Active' : 'Completed'}</span>
          </div>

          <h1>{share.task.title}</h1>
          <p className="public-task-share__owner">
            Shared by {share.shared_by.display_name || `@${share.shared_by.username}`}
          </p>

          {share.task.description ? (
            <section className="public-task-share__section">
              <h2>Details</h2>
              <div className="public-task-share__description">
                <RichDescription text={share.task.description} />
              </div>
            </section>
          ) : null}

          {share.checklist.length ? (
            <section className="public-task-share__section">
              <h2><CheckSquare2 size={17} /> Checklist</h2>
              <ol className="public-task-share__checklist">
                {share.checklist.map((item) => (
                  <li key={item.id}>
                    <Circle size={15} />
                    <span>{item.title}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <footer className="public-task-share__footer">
            <span>
              <CalendarDays size={15} />
              {share.task.due_date ? `Due ${formatDateTime(share.task.due_date)}` : 'No due date'}
            </span>
            <a href="/">
              Open GrowT <ExternalLink size={14} />
            </a>
          </footer>
        </article>
      ) : null}
    </main>
  )
}
