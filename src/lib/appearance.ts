import type { AvatarChoice, ColorPalette, ThemeMode } from './database.types'

export type ResolvedThemeMode = Extract<ThemeMode, 'light' | 'dark'>

export const defaultThemeMode: ThemeMode = 'system'
export const defaultColorPalette: ColorPalette = 'sage'
export const defaultAvatarChoice: AvatarChoice = 'default'

export const themeModeOptions: Array<{ id: ThemeMode; label: string }> = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function getSystemThemeMode(): ResolvedThemeMode {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

export function resolveThemeMode(themeMode: ThemeMode): ResolvedThemeMode {
  return themeMode === 'system' ? getSystemThemeMode() : themeMode
}

export const colorPaletteOptions: Array<{ id: ColorPalette; label: string; description: string }> = [
  { id: 'sage', label: 'Sage', description: 'Clean green workspace' },
  { id: 'duck', label: 'Duck', description: 'Warm yellow focus' },
  { id: 'penguin', label: 'Penguin', description: 'Soft blue calm' },
  { id: 'sprout', label: 'Sprout', description: 'Fresh natural green' },
  { id: 'rose', label: 'Rose', description: 'Gentle pink energy' },
  { id: 'lavender', label: 'Lavender', description: 'Quiet purple tone' },
]

export const avatarOptions: Array<{ id: AvatarChoice; label: string; src: string }> = [
  { id: 'default', label: 'Default', src: '/avatars/default.jpg' },
  { id: 'duck', label: 'Duck', src: '/avatars/duck.jpg' },
  { id: 'penguin', label: 'Penguin', src: '/avatars/penguin.jpg' },
  { id: 'sprout', label: 'Sprout', src: '/avatars/sprout.jpg' },
]

export function getAvatarSrc(choice: AvatarChoice | null | undefined) {
  return avatarOptions.find((option) => option.id === choice)?.src ?? avatarOptions[0].src
}
