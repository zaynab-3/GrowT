import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Sprout,
  Users2,
  CheckCheck,
  Quote,
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
    description: "Throw tasks, notes, and people into a single folder. Stop digging through multiple apps.",
    icon: FolderKanban,
    title: 'One folder, one project.',
  },
  {
    description: "Mark tasks ongoing, half-done, or complete. Skip the status meetings.",
    icon: CheckCircle2,
    title: "Everyone knows what's done.",
  },
  {
    description: "Add just the right people, and keep all updates in a single feed.",
    icon: Users2,
    title: 'Invite the right people.',
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

const typedWords = ['task', 'project', 'idea', 'goal']

const howChecklist = [
  "Make a folder. That's your project.",
  'Add tasks. Decide who does what.',
  "Invite your team — or just work alone, that's fine.",
  "See what's done without sending a \"any update?\" message.",
]

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
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.08,
        y: -16,
      })

      gsap.from(
        [
          '.landing-eyebrow',
          '.landing-hero h1',
          '.landing-hero__sub',
          '.landing-hero__actions',
          '.landing-social-proof',
        ],
        {
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.1,
          y: 28,
        },
      )

      gsap.from('.lh-card', {
        autoAlpha: 0,
        duration: 0.75,
        delay: 0.7,
        ease: 'back.out(1.6)',
        stagger: 0.16,
        scale: 0.86,
        y: 14,
      })

      page.querySelectorAll<HTMLElement>('[data-landing-reveal]').forEach((element) => {
        const dir = element.dataset.landingReveal
        const x = dir === 'left' ? -52 : dir === 'right' ? 52 : 0
        gsap.from(element, {
          autoAlpha: 0,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            scroller: page,
            start: 'top 88%',
            trigger: element,
          },
          x,
          y: x === 0 ? 38 : 0,
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
          .to({}, { duration: 1.4 })
          .to(typeState, {
            duration: 0.36,
            ease: 'power1.in',
            length: 0,
            onUpdate: updateTypedWord,
          })
          .to({}, { duration: 0.1 })
      })

      // ── Phone Gallery: Pinned focus reveal ────────────────────
      const mm = gsap.matchMedia()

      // ─── DESKTOP (≥901px): Row layout, CSS transitions, STICKY ───
      mm.add('(min-width: 901px)', () => {
        const wrapper = page.querySelector<HTMLElement>('.landing-gallery-wrapper')
        const phoneItems = page.querySelectorAll<HTMLElement>('.landing-phone-item')
        const screenLabel = page.querySelector<HTMLElement>('.gallery-screen-label')
        const labels = ['Dashboard', 'Folders', 'Tasks']
        if (!wrapper || phoneItems.length !== 3) return

        const setFocus = (index: number) => {
          phoneItems.forEach((item, i) => {
            item.classList.toggle('is-active', i === index)
            item.setAttribute('data-active', String(i === index))
          })
          if (screenLabel) {
            screenLabel.textContent = labels[index]
            screenLabel.style.opacity = '1'
          }
        }

        setFocus(0)
        phoneItems.forEach((item, i) => item.addEventListener('click', () => setFocus(i)))

        ScrollTrigger.create({
          scroller: page,
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            const p = self.progress
            // 0–0.33: Dashboard, 0.33–0.66: Folders, 0.66–1: Tasks
            if (p < 0.33) setFocus(0)
            else if (p < 0.66) setFocus(1)
            else setFocus(2)
          },
        })
      })

      // ─── MOBILE (≤900px): Stacked phones, GSAP scrub, CSS STICKY ─
      mm.add('(max-width: 900px)', () => {
        const phoneItems = page.querySelectorAll<HTMLElement>('.landing-phone-item')
        const wrapper = page.querySelector<HTMLElement>('.landing-gallery-wrapper')
        if (phoneItems.length !== 3 || !wrapper) return

        // Center all phones via xPercent/yPercent — safe with GSAP scale
        gsap.set(phoneItems, { xPercent: -50, yPercent: -50 })

        // Initial stack: Dashboard front, Folders mid, Tasks back
        gsap.set(phoneItems[0], { scale: 1,    filter: 'blur(0px)',   opacity: 1,    zIndex: 3 })
        gsap.set(phoneItems[1], { scale: 0.88, filter: 'blur(5px)',   opacity: 0.4,  zIndex: 2 })
        gsap.set(phoneItems[2], { scale: 0.78, filter: 'blur(10px)',  opacity: 0.15, zIndex: 1 })

        // Timeline: 6 units total
        // 0–1   = Dashboard holds in focus
        // 1–2   = transition: Folders comes to front
        // 2–3   = Folders holds in focus
        // 3–4   = transition: Tasks comes to front
        // 4–5   = Tasks holds in focus
        const tl = gsap.timeline({
          scrollTrigger: {
            scroller: page,
            trigger: wrapper,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.5,
          }
        })

        // Hold Dashboard (0→1)
        tl.to({}, { duration: 1 })

        // Transition — Folders to front (1→2)
        tl.to(phoneItems[0], { scale: 0.78, filter: 'blur(10px)', opacity: 0.15, zIndex: 1, duration: 1 }, 1)
          .to(phoneItems[1], { scale: 1,    filter: 'blur(0px)',   opacity: 1,    zIndex: 3, duration: 1 }, 1)
          .to(phoneItems[2], { scale: 0.88, filter: 'blur(5px)',   opacity: 0.4,  zIndex: 2, duration: 1 }, 1)

        // Hold Folders (2→3)
        tl.to({}, { duration: 1 })

        // Transition — Tasks to front (3→4)
        tl.to(phoneItems[0], { scale: 0.72, filter: 'blur(14px)', opacity: 0.1,  zIndex: 1, duration: 1 }, 3)
          .to(phoneItems[1], { scale: 0.78, filter: 'blur(10px)', opacity: 0.15, zIndex: 2, duration: 1 }, 3)
          .to(phoneItems[2], { scale: 1,    filter: 'blur(0px)',   opacity: 1,    zIndex: 3, duration: 1 }, 3)

        // Hold Tasks (4→5)
        tl.to({}, { duration: 1 })
      })

      ScrollTrigger.refresh()
    }, page)

    return () => animationContext.revert()
  }, [])

  return (
    <main className="landing-page" ref={pageRef}>
      {/* ─── Nav ─────────────────────────────────────────────── */}
      <header className="landing-nav">
        <button className="landing-brand" onClick={onRegister} type="button" aria-label="GrowT home">
          <GrowTLogo className="landing-brand__logo" size={34} />
          <span>GrowT</span>
        </button>

        <nav aria-label="Main navigation">
          <ul className="landing-nav__links">
            <li><a href="#features">Features</a></li>
            <li><a href="#screens">See it</a></li>
            <li><a href="#cta">Get started</a></li>
          </ul>
        </nav>

        <div className="landing-nav__actions">
          <PwaInstallButton variant="landing" />
          <button className="landing-login" onClick={onLogin} type="button">
            <span>Log in</span>
            <ArrowRight aria-hidden="true" size={15} strokeWidth={2.4} />
          </button>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__inner">
          <div className="landing-eyebrow">
            <Sprout aria-hidden="true" size={14} strokeWidth={2.5} />
            Built for small teams. Free, forever.
          </div>

          <h1 aria-label="The task app your team will actually open." id="landing-title">
            The{' '}
            <span aria-hidden="true" className="landing-hero__type-row">
              <strong className="landing-type-word" ref={typedWordRef}>task</strong>
              <i className="landing-type-cursor" />
            </span>
            {' '}app your team will
            <br />
            <span className="lp-squiggle">actually open.</span>
          </h1>

          <p className="landing-hero__sub">
            We tried Jira, Asana, Notion, and a whiteboard. Then we gave up and
            built what we actually wanted — something stupid simple that your team
            doesn't need a tutorial to use.
          </p>

          <div className="landing-hero__actions">
            <button className="landing-primary" onClick={onRegister} type="button">
              <span>Try it free — 30 seconds to start</span>
              <ArrowRight aria-hidden="true" size={17} strokeWidth={2.5} />
            </button>
            <button className="landing-secondary" onClick={onLogin} type="button">
              Already have an account
            </button>
          </div>

          <p className="landing-social-proof" aria-label="Trust signals">
            No credit card. No onboarding call. No seat pricing.{' '}
            <span className="landing-social-proof__star">Just GrowT. ✦</span>
          </p>
        </div>

        {/* Floating UI cards */}
        <div className="landing-hero-stage" aria-hidden="true">
          <div className="lh-card lh-card--left">
            <div className="lh-card__header">
              <span className="lh-card__dot" />
              <span className="lh-card__category">Rebrand project</span>
            </div>
            <div className="lh-card__title">Logo for May launch</div>
            <div className="lh-card__row">
              <span className="lh-card__meta">3 of 8 tasks done</span>
              <span className="lh-card__badge">
                <Clock3 size={10} strokeWidth={2.5} />
                Due Friday
              </span>
            </div>
            <div className="lh-card__footer">
              <div className="lh-card__avatars">
                <span className="lh-card__av" style={{ background: '#7c3aed' }}>S</span>
                <span className="lh-card__av" style={{ background: '#0ea5e9' }}>A</span>
                <span className="lh-card__av" style={{ background: '#287a5b' }}>Z</span>
              </div>
              <span className="lh-card__av-more">2+</span>
            </div>
          </div>

          <div className="lh-card lh-card--right">
            <div className="lh-card__right-top">
              <span className="lh-card__right-dot" />
              <span className="lh-card__category">GrowT · just now</span>
            </div>
            <div className="lh-card__title">Logo concepts</div>
            <div className="lh-card__bubble">
              <CheckCheck size={11} strokeWidth={2.5} />
              X marked it done
            </div>
            <div className="lh-card__footer">
              <div className="lh-card__avatars">
                <span className="lh-card__av" style={{ background: '#287a5b' }}>Z</span>
                <span className="lh-card__av" style={{ background: '#db2777' }}>A</span>
              </div>
              <span className="lh-card__time">nice one</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Honest stats ─────────────────────────────────────── */}
      <section className="landing-stats" aria-label="Honest numbers">
        <div className="landing-stats__inner">
          <div className="landing-stat" data-landing-reveal="up">
            <span className="landing-stat__number">0<span>*</span></span>
            <span className="landing-stat__label">tutorials needed</span>
            <span className="landing-stat__note">* we checked</span>
          </div>
          <div className="landing-stat" data-landing-reveal="up">
            <span className="landing-stat__number">Free<span>.</span></span>
            <span className="landing-stat__label">for your whole team</span>
            <span className="landing-stat__note">yes, the whole team</span>
          </div>
          <div className="landing-stat" data-landing-reveal="up">
            <span className="landing-stat__number">∞<span></span></span>
            <span className="landing-stat__label">tasks, folders, people</span>
            <span className="landing-stat__note">no arbitrary limits</span>
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────── */}
      <section className="landing-how" id="features" aria-labelledby="landing-how-title">
        <div className="landing-how__inner">
          <div className="landing-how__copy" data-landing-reveal="left">
            <span className="landing-section-label">How it works</span>
            <h2 id="landing-how-title">
              Honest answer:{' '}
              <em>it does three things.</em>
            </h2>
            <p>
              Folders to organise your projects. Tasks to track the work.
              And sharing so your team stays in the loop.
              That's it. We didn't add more.{' '}
              <span className="lp-aside">You're welcome.</span>
            </p>
            <ul className="landing-how__checklist" aria-label="Key benefits">
              {howChecklist.map((item) => (
                <li className="landing-how__check" key={item}>
                  <span className="landing-how__check-icon" aria-hidden="true">
                    <CheckCircle2 size={14} strokeWidth={2.5} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="landing-hero__actions">
              <button className="landing-primary" onClick={onRegister} type="button">
                <span>Start in 30 seconds</span>
                <ArrowRight aria-hidden="true" size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
          <div className="landing-how__visual" data-landing-reveal="right">
            <div className="phone-mockup lp-how-phone">
              <img
                alt="GrowT Workspaces view — project folders and progress"
                src="/landing/folders-926c7ff3.jpg"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature cards ────────────────────────────────────── */}
      <section className="landing-proof" aria-labelledby="landing-proof-title">
        <div className="landing-proof__head" data-landing-reveal="up">
          <span className="landing-section-label">What you actually get</span>
          <h2 id="landing-proof-title">
            No bloat. No ceremony.<br />Just the parts that matter.
          </h2>
        </div>
        <div className="landing-proof__grid">
          {featureCards.map(({ description, icon: Icon, title }, index) => (
            <article
              className="landing-feature"
              data-landing-reveal={index % 2 === 0 ? 'left' : 'right'}
              key={title}
            >
              <span className="landing-feature__icon">
                <Icon aria-hidden="true" size={21} strokeWidth={2.2} />
              </span>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Testimonial ──────────────────────────────────────── */}
      <section className="landing-testimonial" aria-labelledby="landing-quote-title">
        <div className="landing-quote" data-landing-reveal="up">
          <Quote className="landing-quote__icon" aria-hidden="true" size={32} strokeWidth={1.5} />
          <blockquote>
            <p id="landing-quote-title">
              I showed GrowT to my team on a Friday afternoon. By Monday, everyone
              was actually using it. That's never happened with any tool we've tried.
              Not even close.
            </p>
            <footer>
              <div className="landing-quote__avatar">M</div>
              <div className="landing-quote__author">
                <strong>Mira T.</strong>
                <span>Freelance art director, 7-person studio</span>
              </div>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ─── Screenshots (sticky wrapper) ─────────────────────── */}
      <div className="landing-gallery-wrapper">
        <section className="landing-gallery" id="screens" aria-labelledby="landing-gallery-title">
          <div className="landing-gallery__head">
            <span className="landing-section-label">See it before you try it</span>
            <h2 id="landing-gallery-title">Here's what it looks like.</h2>
            <p>We know you want to see it first. Fair.</p>
            <div className="gallery-screen-indicator" aria-live="polite">
              <span className="gallery-screen-indicator__arrow">→</span>
              <span className="gallery-screen-label">Dashboard</span>
            </div>
          </div>
          <div className="landing-phones-grid">
            {productShots.map((shot, index) => (
              <figure
                className={`landing-phone-item landing-phone-item--${index}`}
                key={shot.label}
              >
                <div className="phone-mockup">
                  <img
                    alt={shot.alt}
                    src={shot.src}
                    loading="lazy"
                  />
                </div>
                <figcaption className="landing-phone-label">
                  <Clock3 aria-hidden="true" size={12} />
                  {shot.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="landing-cta" id="cta" aria-labelledby="landing-cta-title">
        <div className="landing-cta__card" data-landing-reveal="up">
          <span className="landing-cta__eyebrow">Okay, you've read enough.</span>
          <h2 id="landing-cta-title">Give it a go.</h2>
          <p>
            It's free. It works offline. No credit card, no onboarding call,
            no 14-day trial countdown. If it's not for you — no hard feelings.
            But we think you'll stick around.
          </p>
          <div className="landing-cta__actions">
            <button className="landing-primary" onClick={onRegister} type="button">
              <span>Create your free account</span>
              <ArrowRight aria-hidden="true" size={17} strokeWidth={2.5} />
            </button>
            <button className="landing-secondary" onClick={onLogin} type="button">
              Already have one
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="landing-footer" role="contentinfo">
        <div className="landing-footer__brand">
          <GrowTLogo size={20} />
          <span>GrowT</span>
          <span className="landing-footer__heart">made with care ♥</span>
        </div>
        <div className="landing-footer__meta">
          <nav aria-label="Legal information" className="landing-footer__links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </nav>
          <p className="landing-footer__copy">
            © {new Date().getFullYear()} GrowT · Built by a small team
          </p>
        </div>
      </footer>
    </main>
  )
}
