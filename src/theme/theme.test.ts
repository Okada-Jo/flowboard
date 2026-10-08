import { afterEach, expect, it, vi } from 'vitest'

const originalMatchMedia = window.matchMedia

afterEach(() => {
  window.matchMedia = originalMatchMedia
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

it('restores preferences, follows system changes, and persists explicit choices', async () => {
  let onChange = () => {}
  const media = {
    matches: true,
    addEventListener: (_event: string, listener: () => void) => {
      onChange = listener
    },
  }
  window.matchMedia = vi.fn(() => media as unknown as MediaQueryList)
  localStorage.setItem('flowboard-theme', 'dark')
  const { initializeTheme, setThemePreference } = await import('./theme')
  initializeTheme()
  expect(document.documentElement.dataset.theme).toBe('dark')

  setThemePreference('light')
  expect(localStorage.getItem('flowboard-theme')).toBe('light')
  onChange()
  expect(document.documentElement.dataset.theme).toBe('light')

  setThemePreference('system')
  expect(localStorage.getItem('flowboard-theme')).toBe('system')
  expect(document.documentElement.dataset.theme).toBe('dark')
  media.matches = false
  onChange()
  expect(document.documentElement.dataset.theme).toBe('light')

  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'flowboard-theme',
      newValue: 'dark',
    }),
  )
  expect(document.documentElement.dataset.theme).toBe('dark')

  const setItem = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('Storage unavailable')
    })
  expect(() => setThemePreference('light')).not.toThrow()
  expect(document.documentElement.dataset.theme).toBe('light')
  setItem.mockRestore()
})
