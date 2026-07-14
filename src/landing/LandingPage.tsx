import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  Sprout,
  Users2,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GrowTLogo } from '../components/GrowTLogo'
import { PwaInstallButton } from '../components/PwaInstallButton'
import './LandingPage.css'

gsap.registerPlugin(ScrollTrigger)

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
    src: '/landing/dashboard-26fa928a.jpg',
  },
  {
    alt: 'GrowT folders screen with project cards',
    label: 'Folders',
    src: '/landing/folders-926c7ff3.jpg',
  },
  {
    alt: 'GrowT tasks screen with task status tracking',
    label: 'Tasks',
    src: '/landing/tasks-d8c45f84.jpg',
  },
]

const typedWords = ['task', 'project', 'goal', 'idea']

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const pageRef = useRef<HTMLElement>(null)
  const typedWordRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const page = pageRef.current
    const typedWord = typedWordRef.current

    if (!page || !typedWord) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    typedWord.textContent = typedWords[0]

    if (reduceMotion) return

    const animationContext = gsap.context(() => {
      gsap.from('.landing-nav > *', {
        autoAlpha: 0,
        duration: 0.65,
        ease: 'power3.out',
        stagger: 0.08,
        y: -18,
      })

      gsap.from(
        [
          '.landing-eyebrow',
          '.landing-hero h1',
          '.landing-hero__copy > p',
          '.landing-hero__actions',
        ],
        {
          autoAlpha: 0,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.1,
          x: -46,
        },
      )

      gsap.from('.landing-window', {
        autoAlpha: 0,
        delay: 0.16,
        duration: 1.05,
        ease: 'power3.out',
        rotate: 1.4,
        scale: 0.97,
        x: 76,
      })

      gsap.from('.landing-window__chrome span', {
        delay: 0.7,
        duration: 0.38,
        ease: 'back.out(2)',
        scale: 0,
        stagger: 0.09,
      })

      gsap.to('.landing-float-card--left', {
        duration: 2.8,
        ease: 'sine.inOut',
        repeat: -1,
        y: -10,
        yoyo: true,
      })

      gsap.to('.landing-float-card--right', {
        duration: 3.2,
        ease: 'sine.inOut',
        repeat: -1,
        y: 11,
        yoyo: true,
      })

      gsap.to('.landing-growth-art__ring', {
        duration: 18,
        ease: 'none',
        repeat: -1,
        rotate: 360,
        transformOrigin: '50% 50%',
      })

      page.querySelectorAll<HTMLElement>('[data-landing-reveal]').forEach((element) => {
        const direction = element.dataset.landingReveal
        const horizontalOffset = direction === 'left' ? -64 : direction === 'right' ? 64 : 0

        gsap.from(element, {
          autoAlpha: 0,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            scroller: page,
            start: 'top 88%',
            trigger: element,
          },
          x: horizontalOffset,
          y: horizontalOffset === 0 ? 34 : 0,
        })
      })

      const typeState = { length: typedWords[0].length, word: typedWords[0] }
      const updateTypedWord = () => {
        typedWord.textContent = typeState.word.slice(0, Math.round(typeState.length))
      }
      const typeTimeline = gsap.timeline({ repeat: -1, repeatDelay: 0.2 })

      typedWords.forEach((word) => {
        typeTimeline
          .call(() => {
            typeState.word = word
            typeState.length = 0
            updateTypedWord()
          })
          .to(typeState, {
            duration: Math.max(0.55, word.length * 0.1),
            ease: 'none',
            length: word.length,
            onUpdate: updateTypedWord,
          })
          .to({}, { duration: 1.25 })
          .to(typeState, {
            duration: 0.38,
            ease: 'power1.in',
            length: 0,
            onUpdate: updateTypedWord,
          })
          .to({}, { duration: 0.12 })
      })

      ScrollTrigger.refresh()
    }, page)

    return () => animationContext.revert()
  }, [])

  return (
    <main className="landing-page" ref={pageRef}>
      <header className="landing-nav">
        <button className="landing-brand" onClick={onRegister} type="button" aria-label="GrowT home">
          <GrowTLogo className="landing-brand__logo" size={38} />
          <span>GrowT</span>
        </button>
        <div className="landing-nav__actions">
          <PwaInstallButton variant="landing" />
          <button className="landing-login" onClick={onLogin} type="button">
            <span>Login</span>
            <ArrowRight aria-hidden="true" size={16} strokeWidth={2.4} />
          </button>
        </div>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-growth-art" aria-hidden="true">
          <span className="landing-growth-art__ring" />
          <span className="landing-growth-art__leaf landing-growth-art__leaf--one" />
          <span className="landing-growth-art__leaf landing-growth-art__leaf--two" />
        </div>
        <div className="landing-hero__copy">
          <div className="landing-eyebrow">
            <Sprout aria-hidden="true" size={16} strokeWidth={2.4} />
            Plan · share · grow
          </div>
          <h1 aria-label="Organize your mind, one task at a time." id="landing-title">
            Organize your mind,
            <span aria-hidden="true" className="landing-type-line">
              one <strong ref={typedWordRef}>task</strong>
              <i className="landing-type-cursor" /> at a time.
            </span>
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
        {featureCards.map(({ description, icon: Icon, title }, index) => (
          <article
            className="landing-feature"
            data-landing-reveal={index % 2 === 0 ? 'left' : 'right'}
            key={title}
          >
            <span className="landing-feature__icon">
              <Icon aria-hidden="true" size={20} strokeWidth={2.3} />
            </span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="landing-gallery" aria-labelledby="landing-gallery-title">
        <div className="landing-section-copy" data-landing-reveal="left">
          <h2 id="landing-gallery-title">Everything has a clear place to land.</h2>
          <p>
            From a quick personal task to a shared folder with real teammates, GrowT keeps the
            surface simple enough to return to every day.
          </p>
        </div>
        <div className="landing-shot-grid">
          {productShots.map((shot, index) => (
            <figure
              className="landing-shot"
              data-landing-reveal={index % 2 === 0 ? 'left' : 'right'}
              key={shot.label}
            >
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
