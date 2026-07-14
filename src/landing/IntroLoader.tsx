import './IntroLoader.css'

export function IntroLoader() {
  return (
    <main className="intro-loader" aria-label="Opening GrowT">
      <div className="intro-loader__content" aria-hidden="true">
        <div className="intro-loader__logo-stage">
          <span className="intro-loader__logo-guide" />
          <span className="intro-loader__logo-ink" />
          <span className="intro-loader__logo-sheen" />
        </div>
        <div className="intro-loader__wordmark">
          <span className="intro-loader__title">GrowT</span>
          <span className="intro-loader__tagline">Grow with intention</span>
        </div>
      </div>
      <span className="sr-only">Opening GrowT</span>
    </main>
  )
}
