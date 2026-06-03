import type { FormEvent } from 'react'

export type AuthView = 'login' | 'register' | 'forgot' | 'reset'

type AuthPanelProps = {
  authLoading: boolean
  authView: AuthView
  forgotEmail: string
  loginIdentifier: string
  loginPassword: string
  message: string
  onForgotEmailChange: (value: string) => void
  onLoginIdentifierChange: (value: string) => void
  onLoginPasswordChange: (value: string) => void
  onRegisterConfirmPasswordChange: (value: string) => void
  onRegisterEmailChange: (value: string) => void
  onRegisterPasswordChange: (value: string) => void
  onRegisterUsernameChange: (value: string) => void
  onRememberMeChange: (value: boolean) => void
  onResetConfirmPasswordChange: (value: string) => void
  onResetPasswordChange: (value: string) => void
  onSubmitForgot: (event: FormEvent<HTMLFormElement>) => void
  onSubmitLogin: (event: FormEvent<HTMLFormElement>) => void
  onSubmitRegister: (event: FormEvent<HTMLFormElement>) => void
  onSubmitReset: (event: FormEvent<HTMLFormElement>) => void
  onViewChange: (view: AuthView) => void
  registerConfirmPassword: string
  registerEmail: string
  registerPassword: string
  registerUsername: string
  rememberMe: boolean
  resetConfirmPassword: string
  resetPassword: string
}

export function AuthPanel({
  authLoading,
  authView,
  forgotEmail,
  loginIdentifier,
  loginPassword,
  message,
  onForgotEmailChange,
  onLoginIdentifierChange,
  onLoginPasswordChange,
  onRegisterConfirmPasswordChange,
  onRegisterEmailChange,
  onRegisterPasswordChange,
  onRegisterUsernameChange,
  onRememberMeChange,
  onResetConfirmPasswordChange,
  onResetPasswordChange,
  onSubmitForgot,
  onSubmitLogin,
  onSubmitRegister,
  onSubmitReset,
  onViewChange,
  registerConfirmPassword,
  registerEmail,
  registerPassword,
  registerUsername,
  rememberMe,
  resetConfirmPassword,
  resetPassword,
}: AuthPanelProps) {
  if (authView === 'reset') {
    return (
      <main className="app-shell app-shell--centered">
        <section className="auth-panel">
          <span className="brand-mark">GT</span>
          <h1>GrowT</h1>
          <p>Set a new password for your account.</p>
          <form className="auth-form" onSubmit={onSubmitReset}>
            <label htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              autoComplete="new-password"
              onChange={(event) => onResetPasswordChange(event.target.value)}
              required
              type="password"
              value={resetPassword}
            />
            <label htmlFor="reset-confirm-password">Confirm password</label>
            <input
              id="reset-confirm-password"
              autoComplete="new-password"
              onChange={(event) => onResetConfirmPasswordChange(event.target.value)}
              required
              type="password"
              value={resetConfirmPassword}
            />
            <button className="button button--primary" disabled={authLoading} type="submit">
              {authLoading ? 'Updating' : 'Update password'}
            </button>
          </form>
          {message ? <p className="notice">{message}</p> : null}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell app-shell--centered">
      <section className="auth-panel">
        <span className="brand-mark">GT</span>
        <h1>GrowT</h1>
        {authView === 'register' ? (
          <>
            <p>Create an account with email and password.</p>
            <form className="auth-form" onSubmit={onSubmitRegister}>
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                autoComplete="email"
                onChange={(event) => onRegisterEmailChange(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={registerEmail}
              />
              <label htmlFor="register-username">Username</label>
              <input
                id="register-username"
                autoComplete="username"
                onChange={(event) => onRegisterUsernameChange(event.target.value)}
                placeholder="zaynab"
                required
                value={registerUsername}
              />
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                autoComplete="new-password"
                onChange={(event) => onRegisterPasswordChange(event.target.value)}
                required
                type="password"
                value={registerPassword}
              />
              <label htmlFor="register-confirm-password">Confirm password</label>
              <input
                id="register-confirm-password"
                autoComplete="new-password"
                onChange={(event) => onRegisterConfirmPasswordChange(event.target.value)}
                required
                type="password"
                value={registerConfirmPassword}
              />
              <button className="button button--primary" disabled={authLoading} type="submit">
                {authLoading ? 'Creating' : 'Create account'}
              </button>
            </form>
            <button className="text-button" onClick={() => onViewChange('login')} type="button">
              Log in instead
            </button>
          </>
        ) : null}

        {authView === 'forgot' ? (
          <>
            <p>Enter your email and GrowT will send a password reset link.</p>
            <form className="auth-form" onSubmit={onSubmitForgot}>
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                autoComplete="email"
                onChange={(event) => onForgotEmailChange(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={forgotEmail}
              />
              <button className="button button--primary" disabled={authLoading} type="submit">
                {authLoading ? 'Sending' : 'Send reset link'}
              </button>
            </form>
            <button className="text-button" onClick={() => onViewChange('login')} type="button">
              Back to login
            </button>
          </>
        ) : null}

        {authView === 'login' ? (
          <>
            <p>Log in with your username or email and password.</p>
            <form className="auth-form" onSubmit={onSubmitLogin}>
              <label htmlFor="login-identifier">Username or email</label>
              <input
                id="login-identifier"
                autoComplete="username"
                onChange={(event) => onLoginIdentifierChange(event.target.value)}
                placeholder="username or you@example.com"
                required
                value={loginIdentifier}
              />
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                autoComplete="current-password"
                onChange={(event) => onLoginPasswordChange(event.target.value)}
                required
                type="password"
                value={loginPassword}
              />
              <label className="checkbox-row" htmlFor="remember-me">
                <input
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(event) => onRememberMeChange(event.target.checked)}
                  type="checkbox"
                />
                Remember me
              </label>
              <button className="button button--primary" disabled={authLoading} type="submit">
                {authLoading ? 'Logging in' : 'Log in'}
              </button>
            </form>
            <div className="auth-links">
              <button className="text-button" onClick={() => onViewChange('forgot')} type="button">
                Forgot password?
              </button>
              <button className="text-button" onClick={() => onViewChange('register')} type="button">
                Create account
              </button>
            </div>
          </>
        ) : null}

        {message ? <p className="notice">{message}</p> : null}
      </section>
    </main>
  )
}
