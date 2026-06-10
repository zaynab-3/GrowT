import './IntroLoader.css'

export function IntroLoader() {
  return (
    <main className="intro-loader" aria-label="Opening GrowT">
      <div className="intro-loader__wordmark" aria-hidden="true">
        <span>GrowT</span>
      </div>
      <span className="sr-only">Opening GrowT</span>
    </main>
  )
}
