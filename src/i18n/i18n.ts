import { useSyncExternalStore } from 'react'
import en from './locales/en.json'
import de from './locales/de.json'
import ja from './locales/ja.json'

export type Language = 'en' | 'de' | 'ja'
const translations: Record<Language, Record<keyof typeof en, string>> = {
  en,
  de,
  ja,
}
const storageKey = 'flowboard-language'
const listeners = new Set<() => void>()
let language: Language = 'en'

export function detectLanguage(languages: readonly string[]): Language {
  for (const locale of languages) {
    const base = locale.toLowerCase().split(/[-_]/)[0]
    if (base === 'en' || base === 'de' || base === 'ja') return base
  }
  return 'en'
}

export function initializeLanguage() {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(storageKey)
  } catch {
    /* Storage is optional. */
  }
  language =
    saved === 'en' || saved === 'de' || saved === 'ja'
      ? saved
      : detectLanguage(
          navigator.languages?.length
            ? navigator.languages
            : [navigator.language],
        )
  applyLanguage()
}

function applyLanguage() {
  document.documentElement.lang = language
  listeners.forEach((listener) => listener())
}

export function setLanguage(value: Language) {
  language = value
  try {
    localStorage.setItem(storageKey, value)
  } catch {
    /* Keep the session choice. */
  }
  applyLanguage()
}

export function translate(
  key: string,
  values: Record<string, string | number> = {},
  locale = language,
): string {
  const message =
    translations[locale][key as keyof typeof en] ??
    en[key as keyof typeof en] ??
    key
  return message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    String(values[name] ?? placeholder),
  )
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Stable functions keep effects independent of the selected language.
const translators = {
  en: (key: string, values?: Record<string, string | number>) =>
    translate(key, values, 'en'),
  de: (key: string, values?: Record<string, string | number>) =>
    translate(key, values, 'de'),
  ja: (key: string, values?: Record<string, string | number>) =>
    translate(key, values, 'ja'),
}
export function useTranslation() {
  const current = useSyncExternalStore(subscribe, () => language)
  return { language: current, t: translators[current] }
}
