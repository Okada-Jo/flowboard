import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAppDispatch } from '../app/hooks'
import { EditorCanvas } from '../features/editor/components/EditorCanvas'
import { boardLoaded } from '../features/editor/editorSlice'
import { getBoard } from '../persistence/boardsRepository'
import { useBoardAutosave } from '../persistence/useBoardAutosave'

export function EditorPage() {
  const { boardId } = useParams()
  const dispatch = useAppDispatch()

  const [isLoading, setIsLoading] = useState(true)
  const [boardName, setBoardName] = useState('')
  const [boardLoadedSuccessfully, setBoardLoadedSuccessfully] = useState(false)

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

  if (isLoading) {
    return (
      <main className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading board...
      </main>
    )
  }

  return (
    <main className="h-screen bg-slate-950 text-slate-100">
      <header className="flex h-14 items-center border-b border-slate-800 px-4">
        <Link to="/" className="font-medium hover:text-white">
          Flowboard
        </Link>

        <span className="ml-4 text-sm text-slate-400">
          {boardName || 'Board not found'}
        </span>
      </header>

      <div className="h-[calc(100vh-3.5rem)]">
        {boardName ? (
          <EditorCanvas />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            Board not found.
          </div>
        )}
      </div>
    </main>
  )
}
