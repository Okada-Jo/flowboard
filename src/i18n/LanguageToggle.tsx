import { useId, useRef, useState } from 'react'
import { setLanguage, useTranslation, type Language } from './i18n'

const languages: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' },
]

export function LanguageToggle() {
  const { language, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const optionsId = useId()

  return (
    <div
      className="language-menu"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement))
          setOpen(false)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          setOpen(false)
          trigger.current?.focus()
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="secondary-button"
        aria-label={t('Language')}
        aria-expanded={open}
        aria-controls={optionsId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        {languages.find((item) => item.code === language)?.name}{' '}
        <span aria-hidden="true">▾</span>
      </button>
      <div id={optionsId} className="language-menu-popover" hidden={!open}>
        <div
          className="language-menu-options"
          role="group"
          aria-label={t('Language')}
        >
          {languages.map(({ code, name }) => (
            <button
              key={code}
              type="button"
              lang={code}
              aria-pressed={language === code}
              onClick={() => {
                setLanguage(code)
                setOpen(false)
                trigger.current?.focus()
              }}
            >
              {name}
              {language === code && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
