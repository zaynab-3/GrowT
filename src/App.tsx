import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import './App.css'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import {
  createCheckpoint,
  createWorkspace,
  ensureProfile,
  listCheckpoints,
  listWorkspaces,
  updateCheckpointStatus,
  type Checkpoint,
  type Workspace,
} from './lib/growtData'
import type { CheckpointStatus } from './lib/database.types'

const statusOrder: CheckpointStatus[] = ['planned', 'active', 'paused', 'complete']

function getNextStatus(status: CheckpointStatus): CheckpointStatus {
  const index = statusOrder.indexOf(status)
  return statusOrder[(index + 1) % statusOrder.length]
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [email, setEmail] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceDescription, setWorkspaceDescription] = useState('')
  const [checkpointTitle, setCheckpointTitle] = useState('')
  const [checkpointDueOn, setCheckpointDueOn] = useState('')
  const [dataLoading, setDataLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const user = session?.user ?? null
  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? workspaces[0],
    [selectedWorkspaceId, workspaces],
  )

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = useCallback(async () => {
    if (!supabase || !user) {
      return
    }

    setDataLoading(true)
    setMessage('')

    try {
      await ensureProfile(supabase, user.id, user.email ?? null)
      const nextWorkspaces = await listWorkspaces(supabase, user.id)
      setWorkspaces(nextWorkspaces)
      setSelectedWorkspaceId((currentId) => currentId ?? nextWorkspaces[0]?.id ?? null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load GrowT data.')
    } finally {
      setDataLoading(false)
    }
  }, [user])

  useEffect(() => {
    void loadUserData()
  }, [loadUserData])

  useEffect(() => {
    if (!supabase || !activeWorkspace) {
      setCheckpoints([])
      return
    }

    let ignore = false

    async function loadWorkspaceCheckpoints() {
      setDataLoading(true)
      setMessage('')

      try {
        const nextCheckpoints = await listCheckpoints(supabase!, activeWorkspace!.id)
        if (!ignore) {
          setCheckpoints(nextCheckpoints)
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : 'Unable to load checkpoints.')
        }
      } finally {
        if (!ignore) {
          setDataLoading(false)
        }
      }
    }

    void loadWorkspaceCheckpoints()

    return () => {
      ignore = true
    }
  }, [activeWorkspace])

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !email.trim()) {
      return
    }

    setAuthLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) {
        throw error
      }

      setMessage('Check your email for the GrowT sign-in link.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send sign-in link.')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      return
    }

    await supabase.auth.signOut()
    setSession(null)
    setWorkspaces([])
    setCheckpoints([])
    setSelectedWorkspaceId(null)
  }

  async function handleCreateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !user || !workspaceName.trim()) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const workspace = await createWorkspace(
        supabase,
        user.id,
        workspaceName.trim(),
        workspaceDescription.trim() || null,
      )
      setWorkspaces((current) => [workspace, ...current])
      setSelectedWorkspaceId(workspace.id)
      setWorkspaceName('')
      setWorkspaceDescription('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create workspace.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateCheckpoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !user || !activeWorkspace || !checkpointTitle.trim()) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const checkpoint = await createCheckpoint(supabase, {
        workspaceId: activeWorkspace.id,
        ownerId: user.id,
        title: checkpointTitle.trim(),
        dueOn: checkpointDueOn || null,
      })
      setCheckpoints((current) => [...current, checkpoint])
      setCheckpointTitle('')
      setCheckpointDueOn('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create checkpoint.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCycleStatus(checkpoint: Checkpoint) {
    if (!supabase) {
      return
    }

    const nextStatus = getNextStatus(checkpoint.status)
    setMessage('')

    try {
      const updated = await updateCheckpointStatus(supabase, checkpoint.id, nextStatus)
      setCheckpoints((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update checkpoint.')
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="app-shell app-shell--centered">
        <section className="auth-panel">
          <span className="brand-mark">GT</span>
          <h1>GrowT needs Supabase env values.</h1>
          <p>Copy `.env.example` to `.env.local` and restart the dev server.</p>
        </section>
      </main>
    )
  }

  if (!authReady) {
    return (
      <main className="app-shell app-shell--centered">
        <section className="auth-panel">
          <span className="brand-mark">GT</span>
          <h1>Opening GrowT</h1>
          <p>Checking your session.</p>
        </section>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="app-shell app-shell--centered">
        <section className="auth-panel">
          <span className="brand-mark">GT</span>
          <h1>GrowT</h1>
          <p>Sign in with email to start organizing your growth checkpoints.</p>
          <form className="auth-form" onSubmit={handleMagicLink}>
            <label htmlFor="email">Email</label>
            <div className="inline-form">
              <input
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
              <button className="button button--primary" disabled={authLoading} type="submit">
                {authLoading ? 'Sending' : 'Send link'}
              </button>
            </div>
          </form>
          {message ? <p className="notice">{message}</p> : null}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#workspace" aria-label="GrowT workspace">
          <span className="brand-mark">GT</span>
          <span>GrowT</span>
        </a>
        <div className="account-actions">
          <span>{user?.email}</span>
          <button className="button button--secondary" onClick={handleSignOut} type="button">
            Sign out
          </button>
        </div>
      </header>

      <section className="workspace-hero" id="workspace">
        <div>
          <p className="section-label">Workspace</p>
          <h1>GrowT workspace</h1>
          <p className="hero-text">
            Plan growth work in small checkpoints, then move each task through the workflow.
          </p>
        </div>
        <div className="summary-grid">
          <div className="metric">
            <span>Workspaces</span>
            <strong>{workspaces.length}</strong>
          </div>
          <div className="metric metric--sky">
            <span>Checkpoints</span>
            <strong>{checkpoints.length}</strong>
          </div>
          <div className="metric metric--sun">
            <span>Status</span>
            <strong>{dataLoading ? 'Syncing' : 'Ready'}</strong>
          </div>
        </div>
      </section>

      <section className="workspace-grid">
        <aside className="side-panel">
          <div className="panel-heading">
            <h2>Workspaces</h2>
            <span>{workspaces.length}</span>
          </div>

          <div className="workspace-list" aria-label="GrowT workspaces">
            {workspaces.map((workspace) => (
              <button
                className={`workspace-row ${
                  workspace.id === activeWorkspace?.id ? 'workspace-row--selected' : ''
                }`}
                key={workspace.id}
                onClick={() => setSelectedWorkspaceId(workspace.id)}
                type="button"
              >
                <strong>{workspace.name}</strong>
                <span>{workspace.description || 'No description yet'}</span>
              </button>
            ))}
            {!workspaces.length ? <p className="empty-state">No workspaces yet.</p> : null}
          </div>

          <form className="stack-form" onSubmit={handleCreateWorkspace}>
            <label htmlFor="workspace-name">New workspace</label>
            <input
              id="workspace-name"
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Launch plan"
              required
              value={workspaceName}
            />
            <textarea
              onChange={(event) => setWorkspaceDescription(event.target.value)}
              placeholder="What this workspace is for"
              rows={3}
              value={workspaceDescription}
            />
            <button className="button button--primary" disabled={saving} type="submit">
              Create workspace
            </button>
          </form>
        </aside>

        <section className="main-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Checkpoints</p>
              <h2>{activeWorkspace?.name ?? 'No workspace selected'}</h2>
            </div>
            {activeWorkspace ? <span>{activeWorkspace.description}</span> : null}
          </div>

          {activeWorkspace ? (
            <>
              <form className="checkpoint-form" onSubmit={handleCreateCheckpoint}>
                <input
                  onChange={(event) => setCheckpointTitle(event.target.value)}
                  placeholder="Next checkpoint"
                  required
                  value={checkpointTitle}
                />
                <input
                  aria-label="Due date"
                  onChange={(event) => setCheckpointDueOn(event.target.value)}
                  type="date"
                  value={checkpointDueOn}
                />
                <button className="button button--primary" disabled={saving} type="submit">
                  Add
                </button>
              </form>

              <div className="checkpoint-list">
                {checkpoints.map((checkpoint) => (
                  <article className="checkpoint-row" key={checkpoint.id}>
                    <div>
                      <strong>{checkpoint.title}</strong>
                      <span>{checkpoint.due_on ? `Due ${checkpoint.due_on}` : 'No due date'}</span>
                    </div>
                    <button
                      className={`status-pill status-pill--${checkpoint.status}`}
                      onClick={() => void handleCycleStatus(checkpoint)}
                      type="button"
                    >
                      {checkpoint.status}
                    </button>
                  </article>
                ))}
                {!checkpoints.length ? (
                  <p className="empty-state">Add the first checkpoint for this workspace.</p>
                ) : null}
              </div>
            </>
          ) : (
            <p className="empty-state">Create a workspace to unlock checkpoints.</p>
          )}
        </section>
      </section>

      {message ? <p className="toast">{message}</p> : null}
    </main>
  )
}

export default App
