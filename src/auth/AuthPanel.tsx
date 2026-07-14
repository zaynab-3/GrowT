import { useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'
import { GrowTLogo } from '../components/GrowTLogo'
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

type AuthFieldProps = {
  autoComplete?: string
  hint?: string
  icon: ReactNode
  id: string
  label: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  value: string
  trailing?: ReactNode
}

function AuthField({
  autoComplete,
  hint,
  icon,
  id,
  label,
  onChange,
  placeholder,
  trailing,
  type = 'text',
  value,
}: AuthFieldProps) {
  return (
    <div className="form-field auth-field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <div className="auth-input-wrap">
        <span className="auth-input-icon" aria-hidden="true">
          {icon}
        </span>
        <input
          id={id}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          type={type}
          value={value}
        />
        {trailing ? <span className="auth-input-trailing">{trailing}</span> : null}
      </div>
      {hint ? <p className="auth-field-hint">{hint}</p> : null}
    </div>
  )
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
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  function passwordToggle(fieldId: string, label: string) {
    const isVisible = Boolean(visiblePasswords[fieldId])

    return (
      <button
        aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
        className="auth-password-toggle"
        onClick={() => setVisiblePasswords((current) => ({ ...current, [fieldId]: !isVisible }))}
        type="button"
      >
        {isVisible ? <EyeOff size={18} strokeWidth={2.1} /> : <Eye size={18} strokeWidth={2.1} />}
      </button>
    )
  }

  if (authView === 'reset') {
    return (
      <main className="auth-page">
        <section className="auth-panel auth-panel--compact">
          <div className="auth-heading">
            <GrowTLogo className="auth-heading__logo" size={70} />
            <h1>GrowT</h1>
            <p>Set a new password for your account.</p>
          </div>
          <form className="auth-form" onSubmit={onSubmitReset}>
            <AuthField
              autoComplete="new-password"
              icon={<LockKeyhole size={18} strokeWidth={2.2} />}
              id="reset-password"
              label="New password"
              onChange={onResetPasswordChange}
              placeholder="New password"
              trailing={passwordToggle('reset-password', 'new password')}
              type={visiblePasswords['reset-password'] ? 'text' : 'password'}
              value={resetPassword}
            />
            <AuthField
              autoComplete="new-password"
              icon={<LockKeyhole size={18} strokeWidth={2.2} />}
              id="reset-confirm-password"
              label="Confirm password"
              onChange={onResetConfirmPasswordChange}
              placeholder="Confirm new password"
              trailing={passwordToggle('reset-confirm-password', 'confirm password')}
              type={visiblePasswords['reset-confirm-password'] ? 'text' : 'password'}
              value={resetConfirmPassword}
            />
            <button className="button button--primary" disabled={authLoading} type="submit">
              {authLoading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
        {message ? <p className="auth-toast" role="status">{message}</p> : null}
      </main>
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-heading">
          <GrowTLogo className="auth-heading__logo" size={70} />
          <h1>GrowT</h1>
          <p>
            {authView === 'register'
              ? 'Start your journey to organized serenity.'
              : authView === 'forgot'
                ? 'We will help you get back into your workspace.'
                : 'Welcome back to your workspace'}
          </p>
        </div>
        {authView === 'register' ? (
          <>
            <h2 className="auth-panel-title">Create Account</h2>
            <form className="auth-form" onSubmit={onSubmitRegister}>
              <AuthField
                autoComplete="username"
                icon={<AtSign size={18} strokeWidth={2.2} />}
                id="register-username"
                label="Username"
                onChange={onRegisterUsernameChange}
                placeholder="unique_handle"
                value={registerUsername}
              />
              <AuthField
                autoComplete="email"
                icon={<Mail size={18} strokeWidth={2.2} />}
                id="register-email"
                label="Email address"
                onChange={onRegisterEmailChange}
                placeholder="you@example.com"
                type="email"
                value={registerEmail}
              />
              <AuthField
                autoComplete="new-password"
                hint="Must be at least 8 characters."
                icon={<LockKeyhole size={18} strokeWidth={2.2} />}
                id="register-password"
                label="Password"
                onChange={onRegisterPasswordChange}
                placeholder="Create a strong password"
                trailing={passwordToggle('register-password', 'password')}
                type={visiblePasswords['register-password'] ? 'text' : 'password'}
                value={registerPassword}
              />
              <AuthField
                autoComplete="new-password"
                icon={<LockKeyhole size={18} strokeWidth={2.2} />}
                id="register-confirm-password"
                label="Confirm password"
                onChange={onRegisterConfirmPasswordChange}
                placeholder="Repeat your password"
                trailing={passwordToggle('register-confirm-password', 'confirm password')}
                type={visiblePasswords['register-confirm-password'] ? 'text' : 'password'}
                value={registerConfirmPassword}
              />
              <button className="button button--primary" disabled={authLoading} type="submit">
                <span>{authLoading ? 'Creating account…' : 'Create Account'}</span>
                <ArrowRight aria-hidden="true" size={17} strokeWidth={2.4} />
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
                Already have an account? Login
              </button>
            </div>
          </>
        ) : null}

        {authView === 'forgot' ? (
          <>
            <h2 className="auth-panel-title">Reset password</h2>
            <form className="auth-form" onSubmit={onSubmitForgot}>
              <AuthField
                autoComplete="email"
                icon={<Mail size={18} strokeWidth={2.2} />}
                id="forgot-email"
                label="Email address"
                onChange={onForgotEmailChange}
                placeholder="you@example.com"
                type="email"
                value={forgotEmail}
              />
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
            <form className="auth-form" onSubmit={onSubmitLogin}>
              <AuthField
                autoComplete="username"
                icon={<UserRound size={18} strokeWidth={2.2} />}
                id="login-identifier"
                label="Username or email"
                onChange={onLoginIdentifierChange}
                placeholder="you@company.com"
                value={loginIdentifier}
              />
              <div className="auth-password-label">
                <span>Password</span>
                <button className="text-button text-button--inline" onClick={() => onViewChange('forgot')} type="button">
                  Forgot?
                </button>
              </div>
              <AuthField
                autoComplete="current-password"
                icon={<LockKeyhole size={18} strokeWidth={2.2} />}
                id="login-password"
                label=""
                onChange={onLoginPasswordChange}
                placeholder="********"
                trailing={passwordToggle('login-password', 'password')}
                type={visiblePasswords['login-password'] ? 'text' : 'password'}
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
              <button className="text-button" onClick={() => onViewChange('register')} type="button">
                Don&apos;t have an account? Register
              </button>
            </div>
          </>
        ) : null}
      </section>
      {message ? <p className="auth-toast" role="status">{message}</p> : null}
    </main>
  )
}


