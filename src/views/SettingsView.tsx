import type { FormEvent } from 'react'
import { CreditCard, Smile, Palette, Sun, Moon, Paintbrush, Check, AlertTriangle, CheckCircle } from 'lucide-react'
import { avatarOptions, colorPaletteOptions, themeModeOptions, getAvatarSrc } from '../lib/appearance'
import type { AvatarChoice, ColorPalette, ThemeMode } from '../lib/database.types'

type SettingsViewProps = {
  hasUnsavedChanges: boolean
  isSaving: boolean
  onProfileAvatarChoiceChange: (avatarChoice: AvatarChoice) => void
  onProfileColorPaletteChange: (colorPalette: ColorPalette) => void
  onProfileDisplayNameChange: (displayName: string) => void
  onProfileThemeModeChange: (themeMode: ThemeMode) => void
  onProfileUsernameChange: (username: string) => void
  onSaveProfile: (event: FormEvent<HTMLFormElement>) => void
  profileAvatarChoice: AvatarChoice
  profileColorPalette: ColorPalette
  profileDisplayName: string
  profileThemeMode: ThemeMode
  profileUsername: string
}

export function SettingsView({
  hasUnsavedChanges,
  isSaving,
  onProfileAvatarChoiceChange,
  onProfileColorPaletteChange,
  onProfileDisplayNameChange,
  onProfileThemeModeChange,
  onProfileUsernameChange,
  onSaveProfile,
  profileAvatarChoice,
  profileColorPalette,
  profileDisplayName,
  profileThemeMode,
  profileUsername,
}: SettingsViewProps) {
  // map color palette to specific tailwind colors for the bubbles
  const paletteColors: Record<ColorPalette, string> = {
    sage: '#7858f5', 
    penguin: '#3b82f6',
    sprout: '#10b981',
    rose: '#f43f5e',
    lavender: '#a855f7',
    duck: '#eab308'
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-6">
      <div className="workspace-header-compact">
        <h1>Settings &amp; Profile</h1>
        <p className="page-header__desc" style={{ margin: '4px 0 0', color: 'var(--ink-3)', fontSize: '14px' }}>
          Customize your display profile, app theme mode, and accent colors.
        </p>
      </div>

      <form onSubmit={onSaveProfile} className="workspace-layout-cols" style={{ paddingBottom: '48px' }}>
        {/* Left Column: Profile Card + Avatar Selection + Identity */}
        <div className="workspace-main-col">
          {/* Profile Header Area */}
          <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm border border-surface-variant">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-primary p-1 bg-surface shadow-md overflow-hidden">
                <img alt="Current Avatar" className="w-full h-full rounded-full object-cover" src={getAvatarSrc(profileAvatarChoice)} />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-headline-md text-headline-md text-on-surface dark:text-white" style={{ margin: 0 }}>
                {profileDisplayName || 'No Display Name'}
              </h3>
              <p className="text-on-surface-variant dark:text-[#C7C5D3]" style={{ margin: '4px 0 0' }}>
                {profileUsername ? `@${profileUsername}` : 'No username set'}
              </p>
            </div>
          </div>

          {/* Public Identity */}
          <div className="glass-card rounded-2xl p-6 shadow-sm border border-surface-variant">
            <h4 className="font-title-lg text-title-lg text-on-surface mb-6 flex items-center gap-2" style={{ margin: '0 0 16px' }}>
              <CreditCard size={18} className="text-primary" />
              Public Identity
            </h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="display-name" className="block font-label-md text-label-md text-on-surface-variant dark:text-[#C7C5D3] mb-1.5 ml-1">Display Name</label>
                <input id="display-name" className="w-full bg-white/50 dark:bg-black/20 border border-outline-variant/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" type="text" value={profileDisplayName} onChange={(e) => onProfileDisplayNameChange(e.target.value)} />
              </div>
              <div>
                <label htmlFor="username" className="block font-label-md text-label-md text-on-surface-variant dark:text-[#C7C5D3] mb-1.5 ml-1">Username</label>
                <input id="username" className="w-full bg-white/50 dark:bg-black/20 border border-outline-variant/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" type="text" value={profileUsername} onChange={(e) => onProfileUsernameChange(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Choose Avatar */}
          <div className="glass-card rounded-2xl p-6 shadow-sm border border-surface-variant">
            <h4 className="font-title-lg text-title-lg text-on-surface mb-6 flex items-center gap-2" style={{ margin: '0 0 16px' }}>
              <Smile size={18} className="text-primary" />
              Choose Avatar
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {avatarOptions.map((option) => (
                <button 
                  key={option.id}
                  type="button"
                  onClick={() => onProfileAvatarChoiceChange(option.id)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 p-1 transition-all ${profileAvatarChoice === option.id ? 'border-primary bg-primary text-white shadow-lg ring-4 ring-primary/10' : 'border-transparent hover:border-outline-variant bg-white/50 dark:bg-black/20'}`}
                >
                  <img className="w-full h-full rounded-xl object-cover" src={option.src} alt={option.label} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Theme selection + Color selection + Save Profile card */}
        <div className="workspace-side-col">
          {/* Theme Mode */}
          <div className="glass-card rounded-2xl p-6 shadow-sm border border-surface-variant">
            <h4 className="font-title-lg text-title-lg text-on-surface mb-6 flex items-center gap-2" style={{ margin: '0 0 16px' }}>
              <Palette size={18} className="text-primary" />
              Theme Mode
            </h4>
            <div className="grid grid-cols-2 gap-3 p-1 bg-surface-container-low dark:bg-surface-soft rounded-2xl border border-outline-variant/30 dark:border-border">
              {themeModeOptions.map((option) => (
                <button 
                  key={option.id}
                  type="button"
                  onClick={() => onProfileThemeModeChange(option.id)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl transition-all ${profileThemeMode === option.id ? 'bg-primary shadow-md text-white' : 'bg-surface-variant/20 text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface dark:bg-white dark:text-slate-800 dark:hover:bg-white/90 dark:hover:text-slate-900'}`}
                >
                  {option.id === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                  <span className="text-label-md">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Web-app Color */}
          <div className="glass-card rounded-2xl p-6 shadow-sm border border-surface-variant">
            <h4 className="font-title-lg text-title-lg text-on-surface mb-6 flex items-center gap-2" style={{ margin: '0 0 16px' }}>
              <Paintbrush size={18} className="text-primary" />
              Web-app Color
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {colorPaletteOptions.map((option) => (
                <button 
                  key={option.id}
                  type="button"
                  onClick={() => onProfileColorPaletteChange(option.id)}
                  className="group flex flex-col items-center gap-2"
                >
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${profileColorPalette === option.id ? 'ring-4 ring-offset-2 ring-primary shadow-lg bg-primary' : 'shadow-md'}`}
                    style={{ backgroundColor: paletteColors[option.id] || '#7858f5' }}
                  >
                    {profileColorPalette === option.id && (
                      <Check size={18} className="text-white" />
                    )}
                  </div>
                  <span className={`font-label-md px-2 py-0.5 rounded-full ${profileColorPalette === option.id ? 'bg-primary text-white font-bold' : 'text-on-surface'}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Save Action Area */}
          <div className="glass-card rounded-2xl p-6 shadow-sm border border-surface-variant">
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
