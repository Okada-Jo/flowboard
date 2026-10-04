import { useEffect } from 'react'
import { useAppSelector } from '../app/hooks'
import { saveBoard } from './boardsRepository'

type UseBoardAutosaveOptions = {
  boardId: string | undefined
  enabled: boolean
}

export function useBoardAutosave({
  boardId,
  enabled,
}: UseBoardAutosaveOptions) {
  const nodes = useAppSelector((state) => state.editor.nodes)
  const edges = useAppSelector((state) => state.editor.edges)

  useEffect(() => {
    console.log('autosave effect', {
      boardId,
      enabled,
      nodes: nodes.length,
      edges: edges.length,
    })

    if (!boardId || !enabled) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      console.log('saving board', {
        boardId,
        nodes: nodes.length,
        edges: edges.length,
      })

      void saveBoard(boardId, {
        nodes,
        edges,
      })
    }, 500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [boardId, enabled, nodes, edges])
}
