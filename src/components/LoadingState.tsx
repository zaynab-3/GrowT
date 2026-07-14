import { GrowTLogo } from './GrowTLogo'

type LoadingStateProps = {
  message: string
  title: string
}

export function LoadingState({ message, title }: LoadingStateProps) {
  return (
    <main className="app-shell app-shell--centered">
      <section className="auth-panel">
        <GrowTLogo className="loading-brand-logo" size={64} />
        <h1>{title}</h1>
        <p>{message}</p>
      </section>
    </main>
  )
}
