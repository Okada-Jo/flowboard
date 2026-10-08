import { useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
const storageKey = 'flowboard-theme'
const listeners = new Set<() => void>()
let preference: ThemePreference = 'system'
let media: MediaQueryList | undefined
let initialized = false

function parsePreference(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system'
}

function applyTheme() {
  document.documentElement.dataset.theme =
    preference === 'system' ? (media?.matches ? 'dark' : 'light') : preference
  listeners.forEach((listener) => listener())
}

export function initializeTheme() {
  if (initialized) return
  initialized = true
  try {
    preference = parsePreference(localStorage.getItem(storageKey))
  } catch {
    // Keep the system default when browser storage is unavailable.
  }
  media = window.matchMedia?.('(prefers-color-scheme: dark)')
  media?.addEventListener('change', applyTheme)
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey || event.key === null) {
      preference = parsePreference(event.newValue)
      applyTheme()
    }
  })
  applyTheme()
}

export function setThemePreference(value: ThemePreference) {
  preference = value
  try {
    localStorage.setItem(storageKey, value)
  } catch {
    // The choice still works for this session when storage is unavailable.
  }
  applyTheme()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useThemePreference() {
  return useSyncExternalStore(subscribe, () => preference)
}
