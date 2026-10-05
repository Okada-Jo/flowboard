import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../app/hooks'
import { EditorCanvas } from '../features/editor/components/EditorCanvas'
import { boardLoaded } from '../features/editor/editorSlice'
import { getBoard } from '../persistence/boardsRepository'
import { useBoardAutosave } from '../persistence/useBoardAutosave'
import {
  createFlowboardFile,
  downloadFlowboardFile,
} from '../import-export/exportBoard'

export function EditorPage() {
  const { boardId } = useParams()
  const dispatch = useAppDispatch()

  const [isLoading, setIsLoading] = useState(true)
  const [boardName, setBoardName] = useState('')
  const [boardLoadedSuccessfully, setBoardLoadedSuccessfully] = useState(false)

  const nodes = useAppSelector((state) => state.editor.nodes)
  const edges = useAppSelector((state) => state.editor.edges)

  useBoardAutosave({
    boardId,
    enabled: boardLoadedSuccessfully,
  })

  useEffect(() => {
    if (!boardId) {
      return
    }

    const currentBoardId = boardId

    async function loadBoard() {
      setIsLoading(true)
      setBoardLoadedSuccessfully(false)

      const board = await getBoard(currentBoardId)

      if (board) {
        dispatch(boardLoaded(board.document))
        setBoardName(board.name)
        setBoardLoadedSuccessfully(true)
      } else {
        setBoardName('')
      }

      setIsLoading(false)
    }

    void loadBoard()
  }, [boardId, dispatch])

  function handleExport() {
    const file = createFlowboardFile(boardName, {
      nodes,
      edges,
    })

    downloadFlowboardFile(file)
  }

  if (isLoading) {
    return (
      <main className="flex h-screen items-center justify-center bg-page-loading text-content-muted">
        Loading board...
      </main>
    )
  }

  return (
    <main className="h-screen editor-page">
      <header className="editor-header flex h-16 items-center gap-4 border-b border-page-border px-5">
        <Link to="/" className="brand shrink-0">
          <span className="brand-mark" aria-hidden="true">
            ⌘
          </span>{' '}
          Flowboard
        </Link>

        <span className="board-title min-w-0 truncate text-sm text-content-muted">
          {boardName || 'Board not found'}
        </span>
        <button
          type="button"
          onClick={handleExport}
          className="secondary-button ml-auto"
        >
          Export
        </button>
      </header>

      <div className="h-[calc(100dvh-4rem)]">
        {boardName ? (
          <EditorCanvas />
        ) : (
          <div className="flex h-full items-center justify-center text-content-muted">
            Board not found.
          </div>
        )}
      </div>
    </main>
  )
}
