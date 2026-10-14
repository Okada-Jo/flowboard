import { setLanguage, useTranslation, type Language } from './i18n'

export function LanguageToggle() {
  const { language, t } = useTranslation()
  return (
    <select
      className="secondary-button"
      aria-label={t('Language')}
      value={language}
      onChange={(event) => setLanguage(event.target.value as Language)}
    >
      <option value="en" lang="en">
        English
      </option>
      <option value="de" lang="de">
        Deutsch
      </option>
      <option value="ja" lang="ja">
        日本語
      </option>
    </select>
  )
}
