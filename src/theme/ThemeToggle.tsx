import { useTranslation } from '../i18n/i18n'
import { setThemePreference, useThemePreference } from './theme'

export function ThemeToggle() {
  const { t } = useTranslation()

  const preference = useThemePreference()

  return (
    <div className="theme-toggle" role="group" aria-label={t('Color theme')}>
      {(['light', 'dark', 'system'] as const).map((theme) => (
        <button
          key={theme}
          type="button"
          aria-pressed={preference === theme}
          onClick={() => setThemePreference(theme)}
        >
          {t(theme[0].toUpperCase() + theme.slice(1))}
        </button>
      ))}
    </div>
  )
}
