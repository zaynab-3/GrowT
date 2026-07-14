import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  Users2,
} from 'lucide-react'
import { GrowTLogo } from '../components/GrowTLogo'
import './LandingPage.css'

type LandingPageProps = {
  onLogin: () => void
  onRegister: () => void
}

const featureCards = [
  {
    description: 'Turn messy ideas into calm folders, tasks, and shared responsibilities.',
    icon: FolderKanban,
    title: 'A home for every project',
  },
  {
    description: 'See what is ongoing, half done, and finished without asking the whole team.',
    icon: CheckCircle2,
    title: 'Progress everyone understands',
  },
  {
    description: 'Invite the right people into the work, then keep the updates in one place.',
    icon: Users2,
    title: 'Collaboration without the noise',
  },
]

const productShots = [
  {
    alt: 'GrowT dashboard with overview cards and activity',
    label: 'Dashboard',
    src: '/landing/dashboard.jpg',
  },
  {
    alt: 'GrowT folders screen with project cards',
    label: 'Folders',
    src: '/landing/folders.jpg',
  },
  {
    alt: 'GrowT tasks screen with task status tracking',
    label: 'Tasks',
    src: '/landing/tasks.jpg',
  },
]

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <button className="landing-brand" onClick={onRegister} type="button" aria-label="GrowT home">
          <GrowTLogo className="landing-brand__logo" size={38} />
          <span>GrowT</span>
        </button>
        <button className="landing-login" onClick={onLogin} type="button">
          <span>Login</span>
          <ArrowRight aria-hidden="true" size={16} strokeWidth={2.4} />
        </button>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__copy">
          <h1 id="landing-title">
            Organize your mind,
            <span>one task at a time.</span>
          </h1>
          <p>
            GrowT is for people who want projects to feel lighter. Plan the work, share the
            important pieces, and keep progress visible without turning your day into a dashboard.
          </p>
          <div className="landing-hero__actions">
            <button className="landing-primary" onClick={onRegister} type="button">
              <span>Start Growing</span>
              <ArrowRight aria-hidden="true" size={18} strokeWidth={2.4} />
            </button>
            <button className="landing-secondary" onClick={onLogin} type="button">
              I already have an account
            </button>
          </div>
        </div>

        <div className="landing-window" aria-label="GrowT product preview">
          <div className="landing-window__chrome" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <img
            alt="GrowT dashboard preview"
            className="landing-window__image"
            src="/landing/dashboard.jpg"
          />
          <div className="landing-float-card landing-float-card--left">
            <LayoutDashboard aria-hidden="true" size={17} />
            <span>Workspace clarity</span>
          </div>
          <div className="landing-float-card landing-float-card--right">
            <Bell aria-hidden="true" size={17} />
            <span>Realtime updates</span>
          </div>
        </div>
      </section>

      <section className="landing-proof" aria-label="What GrowT helps with">
        {featureCards.map(({ description, icon: Icon, title }) => (
          <article className="landing-feature" key={title}>
            <span className="landing-feature__icon">
              <Icon aria-hidden="true" size={20} strokeWidth={2.3} />
            </span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="landing-gallery" aria-labelledby="landing-gallery-title">
        <div className="landing-section-copy">
          <h2 id="landing-gallery-title">Everything has a clear place to land.</h2>
          <p>
            From a quick personal task to a shared folder with real teammates, GrowT keeps the
            surface simple enough to return to every day.
          </p>
        </div>
        <div className="landing-shot-grid">
          {productShots.map((shot) => (
            <figure className="landing-shot" key={shot.label}>
              <img alt={shot.alt} src={shot.src} />
              <figcaption>
                <Clock3 aria-hidden="true" size={15} />
                {shot.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  )
}
