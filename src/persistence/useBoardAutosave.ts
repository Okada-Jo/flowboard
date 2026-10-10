import { useEffect, useState } from 'react'
import { useStore } from 'react-redux'
import type { RootState } from '../app/store'
import { saveBoard } from './boardsRepository'

type UseBoardAutosaveOptions = { boardId: string | undefined; enabled: boolean }

export function useBoardAutosave({
  boardId,
  enabled,
}: UseBoardAutosaveOptions) {
  const store = useStore<RootState>()
  const [error, setError] = useState('')
  useEffect(() => {
    if (!boardId || !enabled) return
    let editor = store.getState().editor
    let document = { nodes: editor.nodes, edges: editor.edges }
    let timer: ReturnType<typeof setTimeout> | undefined
    let active = true
    function save() {
      timer = undefined
      void saveBoard(boardId!, document)
        .then(() => {
          if (active) setError('')
        })
        .catch(() => {
          if (active)
            setError(
              'Changes could not be saved. Please try again before leaving.',
            )
        })
    }
    function schedule() {
      clearTimeout(timer)
      timer = setTimeout(save, 500)
    }
    schedule()
    const unsubscribe = store.subscribe(() => {
      const next = store.getState().editor
      if (next.nodes === editor.nodes && next.edges === editor.edges) return
      editor = next
      document = { nodes: next.nodes, edges: next.edges }
      schedule()
    })
    return () => {
      active = false
      unsubscribe()
      if (timer !== undefined) {
        clearTimeout(timer)
        save()
      }
    }
  }, [boardId, enabled, store])
  return error
}
