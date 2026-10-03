import { useEffect } from 'react'

import { useAppDispatch } from '../../../app/hooks'
import { redo, undo, selectionDeleted } from '../editorSlice'

export function useEditorShortcuts() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        dispatch(selectionDeleted())
        return
      }

      const modifierPressed = event.ctrlKey || event.metaKey

      if (!modifierPressed) {
        return
      }

      if (event.key.toLowerCase() === 'z') {
        event.preventDefault()

        if (event.shiftKey) {
          dispatch(redo())
        } else {
          dispatch(undo())
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [dispatch])
}