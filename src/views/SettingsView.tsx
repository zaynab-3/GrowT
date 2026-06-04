import type { FormEvent } from 'react'
import { ViewHeader } from './ViewHeader'

type SettingsViewProps = {
  isSaving: boolean
  onProfileDisplayNameChange: (displayName: string) => void
  onProfileUsernameChange: (username: string) => void
  onSaveProfile: (event: FormEvent<HTMLFormElement>) => void
  profileDisplayName: string
  profileUsername: string
}

export function SettingsView({
  isSaving,
  onProfileDisplayNameChange,
  onProfileUsernameChange,
  onSaveProfile,
  profileDisplayName,
  profileUsername,
}: SettingsViewProps) {
  return (
    <section className="view-stack view-stack--narrow">
      <ViewHeader
        description="Keep your public GrowT display name and username ready for sharing and acquaintances."
        label="Settings"
        title="Profile settings"
      />
      <section className="view-panel">
        <form className="stack-form profile-form" onSubmit={onSaveProfile}>
          <label htmlFor="profile-name">Display name</label>
          <input
            id="profile-name"
            onChange={(event) => onProfileDisplayNameChange(event.target.value)}
            placeholder="Display name"
            value={profileDisplayName}
          />
          <label htmlFor="profile-username">Username</label>
          <input
            id="profile-username"
            onChange={(event) => onProfileUsernameChange(event.target.value)}
            placeholder="username"
            value={profileUsername}
          />
          <button className="button button--primary" disabled={isSaving} type="submit">
            Save profile
          </button>
        </form>
      </section>
    </section>
  )
}
