type LoadingStateProps = {
  message: string
  title: string
}

export function LoadingState({ message, title }: LoadingStateProps) {
  return (
    <main className="app-shell app-shell--centered">
      <section className="auth-panel">
        <span className="brand-mark">GT</span>
        <h1>{title}</h1>
        <p>{message}</p>
      </section>
    </main>
  )
}
