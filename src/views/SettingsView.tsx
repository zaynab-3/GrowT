import { useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  ListTodo,
  Mail,
  Monitor,
  Moon,
  Paintbrush,
  Palette,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smile,
  Sun,
  UserRoundCog,
} from 'lucide-react'
import {
  additionalColorPaletteOptions,
  avatarOptions,
  coreColorPaletteOptions,
  themeModeOptions,
  getAvatarSrc,
} from '../lib/appearance'
import type { AvatarChoice, ColorPalette, ThemeMode } from '../lib/database.types'

type SettingsViewProps = {
  googleTasksLastSyncedAt: string | null
  googleTasksSyncStatus: 'disconnected' | 'error' | 'needs_authorization' | 'ready' | 'syncing'
  hasUnsavedChanges: boolean
  isSaving: boolean
  onChangeEmail: (email: string) => Promise<void>
  onChangePassword: (currentPassword: string, nextPassword: string) => Promise<void>
  onConnectGoogleTasks: () => Promise<void>
  onProfileAvatarChoiceChange: (avatarChoice: AvatarChoice) => void
  onProfileColorPaletteChange: (colorPalette: ColorPalette) => void
  onProfileDisplayNameChange: (displayName: string) => void
  onProfileThemeModeChange: (themeMode: ThemeMode) => void
  onProfileUsernameChange: (username: string) => void
  onSaveProfile: (event: FormEvent<HTMLFormElement>) => void
  onSyncGoogleTasks: () => Promise<void>
  profileAvatarChoice: AvatarChoice
  profileColorPalette: ColorPalette
  profileDisplayName: string
  profileEmail: string
  profileThemeMode: ThemeMode
  profileUsername: string
}

function ThemeModeIcon({ themeMode }: { themeMode: ThemeMode }) {
  if (themeMode === 'system') {
    return <Monitor size={18} />
  }

  if (themeMode === 'light') {
    return <Sun size={18} />
  }

  return <Moon size={18} />
}

const paletteColors: Record<ColorPalette, string> = {
  sage: '#287a5b',
  duck: '#c08a24',
  penguin: '#2563eb',
  sprout: '#16a34a',
  rose: '#db2777',
  lavender: '#7c3aed',
  watermelon: '#e05263',
  coffee: '#8b5e3c',
  wine: '#8c2346',
}

type ColorPaletteOption = (typeof coreColorPaletteOptions)[number]

function ColorPaletteChoice({
  isSelected,
  onSelect,
  option,
}: {
  isSelected: boolean
  onSelect: (palette: ColorPalette) => void
  option: ColorPaletteOption
}) {
  return (
    <button
      aria-label={`Use the ${option.label} app color`}
      className={`motion-choice group flex flex-col items-center gap-2 ${
        isSelected ? 'motion-choice--active' : ''
      }`}
      onClick={() => onSelect(option.id)}
      title={option.description}
      type="button"
    >
      <span
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
          isSelected
            ? 'ring-4 ring-offset-2 ring-offset-[var(--surface)] ring-primary shadow-lg bg-primary'
            : 'shadow-md'
        }`}
        style={{ backgroundColor: paletteColors[option.id] }}
      >
        {isSelected ? <Check aria-hidden="true" size={18} className="text-white" /> : null}
      </span>
      <span
        className={`font-label-md px-2 py-0.5 rounded-full ${
          isSelected ? 'bg-primary text-white font-bold' : 'text-on-surface'
        }`}
      >
        {option.label}
      </span>
    </button>
  )
}

export function SettingsView({
  googleTasksLastSyncedAt,
  googleTasksSyncStatus,
  hasUnsavedChanges,
  isSaving,
  onChangeEmail,
  onChangePassword,
  onConnectGoogleTasks,
  onProfileAvatarChoiceChange,
  onProfileColorPaletteChange,
  onProfileDisplayNameChange,
  onProfileThemeModeChange,
  onProfileUsernameChange,
  onSaveProfile,
  onSyncGoogleTasks,
  profileAvatarChoice,
  profileColorPalette,
  profileDisplayName,
  profileEmail,
  profileThemeMode,
  profileUsername,
}: SettingsViewProps) {
  const [credentialBusy, setCredentialBusy] = useState<'email' | 'password' | null>(null)
  const [credentialMessage, setCredentialMessage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextEmail, setNextEmail] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [showAdditionalColors, setShowAdditionalColors] = useState(() =>
    additionalColorPaletteOptions.some((option) => option.id === profileColorPalette),
  )

  async function handleEmailChange() {
    setCredentialMessage('')
    setCredentialBusy('email')
    try {
      await onChangeEmail(nextEmail)
      setNextEmail('')
      setCredentialMessage('Check your inbox to confirm the new email address.')
    } catch (error) {
      setCredentialMessage(error instanceof Error ? error.message : 'Unable to change email.')
    } finally {
      setCredentialBusy(null)
    }
  }

  async function handlePasswordChange() {
    setCredentialMessage('')
    if (nextPassword !== confirmPassword) {
      setCredentialMessage('The new passwords do not match.')
      return
    }

    setCredentialBusy('password')
    try {
      await onChangePassword(currentPassword, nextPassword)
      setCurrentPassword('')
      setNextPassword('')
      setConfirmPassword('')
      setCredentialMessage('Password changed successfully.')
    } catch (error) {
      setCredentialMessage(error instanceof Error ? error.message : 'Unable to change password.')
    } finally {
      setCredentialBusy(null)
    }
  }

  return (
    <div className="profile-page growt-page flex-1 w-full max-w-[1320px] mx-auto px-[clamp(26px,3vw,44px)] py-[clamp(26px,3vw,44px)] flex flex-col gap-5 sm:gap-6">
      <div className="workspace-header-compact gui-page-heading">
        <span className="gui-page-heading__icon"><UserRoundCog aria-hidden="true" size={22} /></span>
        <h1>Profile</h1>
      </div>

      <form onSubmit={onSaveProfile} className="workspace-layout-cols pb-4">
        {/* Left Column: Profile Card + Avatar Selection + Identity */}
        <div className="workspace-main-col">
          {/* Profile Header Area */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-sm border border-surface-variant">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-primary p-1 bg-surface shadow-md overflow-hidden">
                <img alt="Current Avatar" className="w-full h-full rounded-full object-cover" src={getAvatarSrc(profileAvatarChoice)} />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-headline-md text-headline-md text-on-surface dark:text-white" style={{ margin: 0 }}>
                {profileDisplayName || 'No Display Name'}
              </h3>
              <p className="text-on-surface-variant" style={{ margin: '4px 0 0' }}>
                {profileUsername ? `@${profileUsername}` : 'No username set'}
              </p>
            </div>
          </div>

          {/* Public Identity */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-sm border border-surface-variant">
            <h4 className="font-title-lg text-title-lg text-on-surface mb-6 flex items-center gap-2" style={{ margin: '0 0 16px' }}>
              <CreditCard size={18} className="text-primary" />
              Public Identity
            </h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="display-name" className="block font-label-md text-label-md text-on-surface-variant mb-1.5 ml-1">Display Name</label>
                <input id="display-name" className="w-full bg-white/50 dark:bg-black/20 border border-outline-variant/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" type="text" value={profileDisplayName} onChange={(e) => onProfileDisplayNameChange(e.target.value)} />
              </div>
              <div>
                <label htmlFor="username" className="block font-label-md text-label-md text-on-surface-variant mb-1.5 ml-1">Username</label>
                <input id="username" className="w-full bg-white/50 dark:bg-black/20 border border-outline-variant/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" type="text" value={profileUsername} onChange={(e) => onProfileUsernameChange(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Choose Avatar */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-sm border border-surface-variant">
            <h4 className="font-title-lg text-title-lg text-on-surface mb-6 flex items-center gap-2" style={{ margin: '0 0 16px' }}>
              <Smile size={18} className="text-primary" />
              Choose Avatar
            </h4>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {avatarOptions.map((option) => (
                <button 
                  key={option.id}
                  type="button"
                  onClick={() => onProfileAvatarChoiceChange(option.id)}
                  className={`motion-choice aspect-square rounded-2xl overflow-hidden border-2 p-1 transition-all ${profileAvatarChoice === option.id ? 'motion-choice--active border-primary bg-primary text-white shadow-lg ring-4 ring-primary/10' : 'border-transparent hover:border-outline-variant bg-white/50 dark:bg-black/20'}`}
                >
                  <img className="w-full h-full rounded-xl object-cover" src={option.src} alt={option.label} />
                </button>
              ))}
            </div>
          </div>

          {/* Credentials */}
          <section className="glass-card credentials-card rounded-2xl p-4 sm:p-6 shadow-sm border border-surface-variant">
            <h4 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2" style={{ margin: '0 0 6px' }}>
              <ShieldCheck size={18} className="text-primary" />
              Credentials
            </h4>
            <p className="credentials-card__intro">Keep your sign-in email and password secure.</p>

            <div className="credentials-card__group">
              <div className="credentials-card__group-title">
                <span><Mail aria-hidden="true" size={17} /></span>
                <div>
                  <strong>Email address</strong>
                  <small>{profileEmail || 'No email available'}</small>
                </div>
              </div>
              <div className="credentials-card__action-row">
                <label className="sr-only" htmlFor="profile-new-email">New email address</label>
                <input
                  autoComplete="email"
                  id="profile-new-email"
                  onChange={(event) => setNextEmail(event.target.value)}
                  placeholder="New email address"
                  type="email"
                  value={nextEmail}
                />
                <button
                  className="credentials-card__button"
                  disabled={credentialBusy !== null || !nextEmail.trim()}
                  onClick={() => void handleEmailChange()}
                  type="button"
                >
                  {credentialBusy === 'email' ? 'Sending…' : 'Verify email'}
                </button>
              </div>
            </div>

            <div className="credentials-card__group">
              <div className="credentials-card__group-title">
                <span><KeyRound aria-hidden="true" size={17} /></span>
                <div>
                  <strong>Change password</strong>
                  <small>Confirm with your current password.</small>
                </div>
                <button
                  aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                  className="credentials-card__visibility"
                  onClick={() => setShowPasswords((current) => !current)}
                  type="button"
                >
                  {showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <div className="credentials-card__password-grid">
                <input
                  autoComplete="current-password"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Current password"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                />
                <input
                  autoComplete="new-password"
                  onChange={(event) => setNextPassword(event.target.value)}
                  placeholder="New password"
                  type={showPasswords ? 'text' : 'password'}
                  value={nextPassword}
                />
                <input
                  autoComplete="new-password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                />
                <button
                  className="credentials-card__button"
                  disabled={
                    credentialBusy !== null ||
                    !currentPassword ||
                    !nextPassword ||
                    !confirmPassword
                  }
                  onClick={() => void handlePasswordChange()}
                  type="button"
                >
                  {credentialBusy === 'password' ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </div>

            {credentialMessage ? (
              <p aria-live="polite" className="credentials-card__message">{credentialMessage}</p>
            ) : null}
          </section>
        </div>

        {/* Right Column: Theme selection + Color selection + Save Profile card */}
        <div className="workspace-side-col">
          <section className="google-tasks-card glass-card rounded-2xl p-4 sm:p-6 shadow-sm border border-surface-variant">
            <div className="google-tasks-card__heading">
              <span><ListTodo aria-hidden="true" size={20} /></span>
              <div>
                <h4>Google Tasks</h4>
                <p>Import open Google tasks into your personal GrowT tasks.</p>
              </div>
            </div>

            <div className={`google-tasks-card__status google-tasks-card__status--${googleTasksSyncStatus}`}>
              <span aria-hidden="true" />
              <p>
                {googleTasksSyncStatus === 'syncing' ? 'Syncing now…' : null}
                {googleTasksSyncStatus === 'ready' ? 'Connected · checks every minute while GrowT is open' : null}
                {googleTasksSyncStatus === 'needs_authorization' ? 'Access expired · reconnect to continue' : null}
                {googleTasksSyncStatus === 'error' ? 'Sync could not finish · try again' : null}
                {googleTasksSyncStatus === 'disconnected' ? 'Not connected' : null}
              </p>
            </div>

            {googleTasksLastSyncedAt ? (
              <small>Last synced {new Date(googleTasksLastSyncedAt).toLocaleString()}</small>
            ) : null}

            <div className="google-tasks-card__actions">
              <button
                className="credentials-card__button"
                disabled={googleTasksSyncStatus === 'syncing'}
                onClick={() => void onConnectGoogleTasks()}
                type="button"
              >
                {googleTasksSyncStatus === 'disconnected' ? 'Connect Google Tasks' : 'Reconnect Google'}
              </button>
              {googleTasksSyncStatus !== 'disconnected' ? (
                <button
                  className="google-tasks-card__sync"
                  disabled={googleTasksSyncStatus === 'syncing'}
                  onClick={() => void onSyncGoogleTasks()}
                  type="button"
                >
                  <RefreshCw aria-hidden="true" size={16} />
                  Sync now
                </button>
              ) : null}
            </div>
          </section>

          {/* Theme Mode */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-sm border border-surface-variant">
            <h4 className="font-title-lg text-title-lg text-on-surface mb-6 flex items-center gap-2" style={{ margin: '0 0 16px' }}>
              <Palette size={18} className="text-primary" />
              Theme Mode
            </h4>
            <div className="grid grid-cols-3 gap-3 p-1 bg-surface-container-low dark:bg-[#222624] rounded-2xl border border-outline-variant/30 dark:border-white/10">
              {themeModeOptions.map((option) => (
                <button 
                  key={option.id}
                  type="button"
                  onClick={() => onProfileThemeModeChange(option.id)}
                className={`motion-choice flex flex-col items-center gap-1.5 sm:gap-2 py-3 sm:py-4 rounded-xl transition-all ${profileThemeMode === option.id ? 'motion-choice--active bg-primary shadow-md text-white' : 'bg-surface-variant/20 text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface dark:bg-[#1b1e1c] dark:text-[#aeb6b2] dark:hover:bg-[#303532] dark:hover:text-white'}`}
                >
                  <ThemeModeIcon themeMode={option.id} />
                  <span className="text-label-md">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Web-app Color */}
          <div className="profile-color-picker glass-card rounded-2xl p-4 sm:p-6 shadow-sm border border-surface-variant">
            <div className="profile-color-picker__header">
              <h4 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                <Paintbrush size={18} className="text-primary" />
                Web-app Color
              </h4>
              <button
                aria-controls="additional-profile-colors"
                aria-expanded={showAdditionalColors}
                aria-label={showAdditionalColors ? 'Hide additional app colors' : 'Show additional app colors'}
                className={`profile-color-picker__more-toggle${
                  showAdditionalColors ? ' is-open' : ''
                }`}
                onClick={() => setShowAdditionalColors((current) => !current)}
                title={showAdditionalColors ? 'Hide more colors' : 'Show more colors'}
                type="button"
              >
                <span aria-hidden="true">
                  <Palette size={18} />
                  <Plus size={11} strokeWidth={3} />
                </span>
              </button>
            </div>
            <div className="profile-avatar-grid grid grid-cols-3 gap-3 sm:gap-4">
              {coreColorPaletteOptions.map((option) => (
                <ColorPaletteChoice
                  isSelected={profileColorPalette === option.id}
                  key={option.id}
                  onSelect={onProfileColorPaletteChange}
                  option={option}
                />
              ))}
            </div>
            {showAdditionalColors ? (
              <div className="profile-color-picker__additional" id="additional-profile-colors">
                <p>More colors</p>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {additionalColorPaletteOptions.map((option) => (
                    <ColorPaletteChoice
                      isSelected={profileColorPalette === option.id}
                      key={option.id}
                      onSelect={onProfileColorPaletteChange}
                      option={option}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Save Action Area */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-sm border border-surface-variant">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="min-h-[48px] flex flex-col justify-center">
                {hasUnsavedChanges ? (
                  <>
                    <p className="font-semibold text-error flex items-center gap-2" style={{ margin: 0 }}>
                      <AlertTriangle size={18} className="text-error" /> Unsaved changes
                    </p>
                    <p className="text-body-md text-on-surface-variant" style={{ margin: '4px 0 0' }}>
                      Don't forget to save your profile updates.
                    </p>
                  </>
                ) : (
                  <p className="font-semibold text-primary flex items-center gap-2" style={{ margin: 0 }}>
                    <CheckCircle size={18} className="text-primary" /> Profile up to date
                  </p>
                )}
              </div>
              <button 
                type="submit" 
                disabled={isSaving || !hasUnsavedChanges} 
                className="w-full bg-primary text-white py-3 rounded-xl font-headline-md text-title-lg shadow-lg hover:shadow-primary/20 hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
