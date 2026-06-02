import { useMemo, useState } from 'react'
import './App.css'
import { isSupabaseConfigured } from './lib/supabase'

type StepStatus = 'done' | 'active' | 'waiting'

type BuildStep = {
  title: string
  status: StepStatus
  detail: string
}

type Workstream = {
  label: string
  value: string
  accent: string
}

const buildSteps: BuildStep[] = [
  {
    title: 'Name correction locked',
    status: 'done',
    detail: 'GrowT is the canonical project name across app copy, docs, and package metadata.',
  },
  {
    title: 'Frontend foundation',
    status: 'done',
    detail: 'React, TypeScript, Vite, linting, and production build scripts are installed.',
  },
  {
    title: 'Supabase client',
    status: 'active',
    detail: 'The browser client is wired for a publishable key and waits for real project credentials.',
  },
  {
    title: 'Remote services',
    status: 'waiting',
    detail: 'GitHub and Supabase need authenticated accounts before the remote link can be completed.',
  },
]

const workstreams: Workstream[] = [
  { label: 'Product', value: 'GrowT', accent: 'sprout' },
  { label: 'Stack', value: 'React + Supabase', accent: 'sky' },
  { label: 'Source', value: 'Local git ready', accent: 'sun' },
]

const setupNotes = [
  'Keep .env.local private and use only VITE_ publishable Supabase values in the browser.',
  'Run the SQL setup after the Supabase project exists so RLS and grants are created together.',
  'Use docs/external-chat-prompt.md when asking another model for help so it keeps GrowT consistent.',
]

function StatusPill({ status }: { status: StepStatus }) {
  return <span className={`status-pill status-pill--${status}`}>{status}</span>
}

function App() {
  const [selectedStep, setSelectedStep] = useState(2)

  const selected = buildSteps[selectedStep]
  const supabaseStatus = useMemo(
    () => (isSupabaseConfigured ? 'Configured' : 'Waiting for env'),
    [],
  )

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#overview" aria-label="GrowT overview">
          <span className="brand-mark">GT</span>
          <span>GrowT</span>
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#pipeline">Pipeline</a>
          <a href="#setup">Setup</a>
          <a href="#handoff">Handoff</a>
        </nav>
      </header>

      <section className="hero-section" id="overview">
        <div className="hero-copy">
          <p className="section-label">Project foundation</p>
          <h1>GrowT is ready for its first real build cycle.</h1>
          <p className="hero-text">
            A clean app shell, Supabase wiring, local git, and shared prompts are in place so
            every next step can land without losing the thread.
          </p>
          <div className="hero-actions">
            <a className="button button--primary" href="#pipeline">
              View pipeline
            </a>
            <a className="button button--secondary" href="#setup">
              Setup checklist
            </a>
          </div>
        </div>

        <aside className="status-panel" aria-label="GrowT service status">
          <div className="status-header">
            <span>Service status</span>
            <strong>{supabaseStatus}</strong>
          </div>
          <div className="status-grid">
            {workstreams.map((item) => (
              <div className={`metric metric--${item.accent}`} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="pipeline-section" id="pipeline">
        <div className="section-heading">
          <p className="section-label">Step work</p>
          <h2>Current build pipeline</h2>
        </div>

        <div className="pipeline-layout">
          <div className="step-list" role="list" aria-label="GrowT setup steps">
            {buildSteps.map((step, index) => (
              <button
                className={`step-row ${index === selectedStep ? 'step-row--selected' : ''}`}
                key={step.title}
                onClick={() => setSelectedStep(index)}
                type="button"
              >
                <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="step-title">{step.title}</span>
                <StatusPill status={step.status} />
              </button>
            ))}
          </div>

          <article className="step-detail">
            <StatusPill status={selected.status} />
            <h3>{selected.title}</h3>
            <p>{selected.detail}</p>
          </article>
        </div>
      </section>

      <section className="setup-section" id="setup">
        <div className="section-heading">
          <p className="section-label">Guardrails</p>
          <h2>What stays true while we build</h2>
        </div>
        <div className="note-grid">
          {setupNotes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      </section>

      <footer className="footer" id="handoff">
        <span>GrowT foundation pass 01</span>
        <span>Next: GitHub remote and Supabase project credentials</span>
      </footer>
    </main>
  )
}

export default App
