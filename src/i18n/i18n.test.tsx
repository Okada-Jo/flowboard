import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LanguageToggle } from './LanguageToggle'
import {
  detectLanguage,
  initializeLanguage,
  setLanguage,
  translate,
} from './i18n'
import en from './locales/en.json'
import de from './locales/de.json'
import ja from './locales/ja.json'

afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('en')
  localStorage.removeItem('flowboard-language')
})

describe('translations', () => {
  it('matches regional browser languages in preference order and falls back to English', () => {
    expect(detectLanguage(['fr-FR', 'de-DE', 'ja'])).toBe('de')
    expect(detectLanguage(['ja-JP', 'en-US'])).toBe('ja')
    expect(detectLanguage(['en-GB', 'de'])).toBe('en')
    expect(detectLanguage(['fr'])).toBe('en')
    expect(detectLanguage([])).toBe('en')
  })

  it('detects the browser language unless a valid preference is saved', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ja-JP'])
    localStorage.removeItem('flowboard-language')
    initializeLanguage()
    expect(document.documentElement.lang).toBe('ja')
    setLanguage('de')
    initializeLanguage()
    expect(document.documentElement.lang).toBe('de')
    localStorage.setItem('flowboard-language', 'invalid')
    initializeLanguage()
    expect(document.documentElement.lang).toBe('ja')
  })

  it('switches immediately, persists the preference, and updates the document language', () => {
    setLanguage('en')
    render(<LanguageToggle />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), {
      target: { value: 'de' },
    })
    expect(screen.getByRole('combobox', { name: 'Sprache' })).toHaveValue('de')
    expect(localStorage.getItem('flowboard-language')).toBe('de')
    expect(document.documentElement.lang).toBe('de')
    expect(translate('Rename {name}', { name: 'My board' })).toBe(
      'My board umbenennen',
    )
  })

  it('works when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => initializeLanguage()).not.toThrow()
    setLanguage('ja')
    expect(translate('Language')).toBe('言語')
  })

  it('has matching keys and interpolation placeholders in every language', () => {
    for (const dictionary of [de, ja]) {
      expect(Object.keys(dictionary).sort()).toEqual(Object.keys(en).sort())
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        expect(dictionary[key].match(/\{\w+\}/g)?.sort()).toEqual(
          en[key].match(/\{\w+\}/g)?.sort(),
        )
      }
    }
  })
})
