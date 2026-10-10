import { useRef, useState } from 'react'

type Props = {
  value: string
  label: string
  placeholder: string
  multiline?: boolean
  className?: string
  autoFocus?: boolean
  onCommit: (value: string) => void
  onFinished?: () => void
}

// The same focusable field works with a pointer, keyboard, or touch. Drafts
// become one history entry on blur; Escape restores the last saved value.
export function InlineText({
  value,
  label,
  placeholder,
  multiline,
  className = '',
  autoFocus,
  onCommit,
  onFinished,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  const cancelled = useRef(false)
  const props = {
    'aria-label': label,
    placeholder,
    value: draft ?? value,
    autoFocus,
    className: `nodrag nopan inline-text ${className}`,
    onFocus: (
      event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      cancelled.current = false
      setDraft(value)
      if (autoFocus) event.currentTarget.select()
    },
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setDraft(event.target.value),
    onBlur: () => {
      if (!cancelled.current && draft !== null) onCommit(draft.trim())
      setDraft(null)
      onFinished?.()
    },
    onKeyDown: (
      event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      event.stopPropagation()
      if (event.key === 'Escape') {
        cancelled.current = true
        setDraft(null)
        event.currentTarget.blur()
      } else if (
        event.key === 'Enter' &&
        (!multiline || event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault()
        event.currentTarget.blur()
      }
    },
  }
  return multiline ? (
    <textarea
      {...props}
      rows={Math.max(2, (draft ?? value).split('\n').length)}
    />
  ) : (
    <input {...props} />
  )
}
