import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  createBoard,
  deleteBoard,
  listBoards,
  renameBoard,
} from '../persistence/boardsRepository'
import type { StoredBoard } from '../features/editor/types'

export function BoardsPage() {
  const navigate = useNavigate()

  const [boards, setBoards] = useState<StoredBoard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  useEffect(() => {
    async function loadBoards() {
      const storedBoards = await listBoards()

      setBoards(storedBoards)
      setIsLoading(false)
    }

    void loadBoards()
  }, [])

  async function handleCreateBoard() {
    const board = await createBoard('Untitled Board')

    navigate(`/boards/${board.id}`)
  }

  function handleStartRename(board: StoredBoard) {
    setEditingBoardId(board.id)
    setDraftName(board.name)
  }

  async function handleFinishRename(board: StoredBoard) {
    const name = draftName.trim()

    if (!name || name === board.name) {
      setEditingBoardId(null)
      return
    }

    await renameBoard(board.id, name)

    setBoards((currentBoards) =>
      currentBoards.map((currentBoard) =>
        currentBoard.id === board.id
          ? {
              ...currentBoard,
              name,
              updatedAt: new Date().toISOString(),
            }
          : currentBoard,
      ),
    )

    setEditingBoardId(null)
  }

  async function handleDeleteBoard(board: StoredBoard) {
    const confirmed = window.confirm(
      `Delete "${board.name}"? This cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    await deleteBoard(board.id)

    setBoards((currentBoards) =>
      currentBoards.filter((currentBoard) => currentBoard.id !== board.id),
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Flowboard</h1>

            <p className="mt-1 text-sm text-slate-400">Your local flowcharts</p>
          </div>

          <button
            type="button"
            onClick={handleCreateBoard}
            className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-white"
          >
            New board
          </button>
        </header>

        {isLoading ? (
          <p className="text-sm text-slate-400">Loading boards...</p>
        ) : boards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center">
            <p className="text-slate-300">No boards yet.</p>

            <p className="mt-1 text-sm text-slate-500">
              Create your first board to start diagramming.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {boards.map((board, key) => (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/boards/${board.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    navigate(`/boards/${board.id}`)
                  }
                }}
                className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900 p-4 text-left hover:border-slate-700 hover:bg-slate-800"
              >
                <div className="flex items-center justify-between gap-4">
                  {editingBoardId === board.id ? (
                    <input
                      autoFocus
                      value={draftName}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => setDraftName(event.target.value)}
                      onBlur={() => void handleFinishRename(board)}
                      onKeyDown={(event) => {
                        event.stopPropagation()

                        if (event.key === 'Enter') {
                          event.currentTarget.blur()
                        }

                        if (event.key === 'Escape') {
                          setEditingBoardId(null)
                        }
                      }}
                      className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-slate-500"
                    />
                  ) : (
                    <div className="font-medium">{board.name}</div>
                  )}

                  {editingBoardId !== board.id && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleStartRename(board)
                        }}
                        className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                        aria-label={`Rename ${board.name}`}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleDeleteBoard(board)
                        }}
                        className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-slate-700 hover:text-red-400"
                        aria-label={`Delete ${board.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  Updated {new Date(board.updatedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
