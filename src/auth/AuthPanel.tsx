import type { FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import './AuthPanel.css'

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
  onContinueWithGoogle?: () => void
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
  onContinueWithGoogle,
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
            <div className="form-field">
              <label htmlFor="reset-password">New password</label>
              <input
                id="reset-password"
                autoComplete="new-password"
                onChange={(event) => onResetPasswordChange(event.target.value)}
                placeholder="New password"
                required
                type="password"
                value={resetPassword}
              />
            </div>
            <div className="form-field">
              <label htmlFor="reset-confirm-password">Confirm password</label>
              <input
                id="reset-confirm-password"
                autoComplete="new-password"
                onChange={(event) => onResetConfirmPasswordChange(event.target.value)}
                placeholder="Confirm new password"
                required
                type="password"
                value={resetConfirmPassword}
              />
            </div>
            <button className="button button--primary" disabled={authLoading} type="submit">
              {authLoading ? 'Updating…' : 'Update password'}
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
              <div className="form-field">
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
              </div>
              <div className="form-field">
                <label htmlFor="register-username">Username</label>
                <input
                  id="register-username"
                  autoComplete="username"
                  onChange={(event) => onRegisterUsernameChange(event.target.value)}
                  placeholder="zaynab"
                  required
                  value={registerUsername}
                />
              </div>
              <div className="form-field">
                <label htmlFor="register-password">Password</label>
                <input
                  id="register-password"
                  autoComplete="new-password"
                  onChange={(event) => onRegisterPasswordChange(event.target.value)}
                  placeholder="Choose a strong password"
                  required
                  type="password"
                  value={registerPassword}
                />
              </div>
              <div className="form-field">
                <label htmlFor="register-confirm-password">Confirm password</label>
                <input
                  id="register-confirm-password"
                  autoComplete="new-password"
                  onChange={(event) => onRegisterConfirmPasswordChange(event.target.value)}
                  placeholder="Repeat your password"
                  required
                  type="password"
                  value={registerConfirmPassword}
                />
              </div>
              <button className="button button--primary" disabled={authLoading} type="submit">
                {authLoading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
            <div className="auth-divider">
              <span>or continue with</span>
            </div>
            <button
              className="button button--google"
              disabled={authLoading}
              onClick={onContinueWithGoogle}
              type="button"
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
            <div className="auth-links">
              <button className="text-button" onClick={() => onViewChange('login')} type="button">
                Already have an account? Log in
              </button>
            </div>
          </>
        ) : null}

        {authView === 'forgot' ? (
          <>
            <p>Enter your email and GrowT will send a password reset link.</p>
            <form className="auth-form" onSubmit={onSubmitForgot}>
              <div className="form-field">
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
              </div>
              <button className="button button--primary" disabled={authLoading} type="submit">
                {authLoading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <div className="auth-links">
              <button className="text-button" onClick={() => onViewChange('login')} type="button">
                <ArrowLeft size={14} style={{ marginRight: 4 }} /> Back to login
              </button>
            </div>
          </>
        ) : null}

        {authView === 'login' ? (
          <>
            <p>Log in with your username or email and password.</p>
            <form className="auth-form" onSubmit={onSubmitLogin}>
              <div className="form-field">
                <label htmlFor="login-identifier">Username or email</label>
                <input
                  id="login-identifier"
                  autoComplete="username"
                  onChange={(event) => onLoginIdentifierChange(event.target.value)}
                  placeholder="username or you@example.com"
                  required
                  value={loginIdentifier}
                />
              </div>
              <div className="form-field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  autoComplete="current-password"
                  onChange={(event) => onLoginPasswordChange(event.target.value)}
                  placeholder="Your password"
                  required
                  type="password"
                  value={loginPassword}
                />
              </div>
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
                {authLoading ? 'Logging in…' : 'Log in'}
              </button>
            </form>
            <div className="auth-divider">
              <span>or continue with</span>
            </div>
            <button
              className="button button--google"
              disabled={authLoading}
              onClick={onContinueWithGoogle}
              type="button"
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
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


