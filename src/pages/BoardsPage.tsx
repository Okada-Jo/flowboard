import { ThemeToggle } from '../theme/ThemeToggle'
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  createBoard,
  deleteBoard,
  listBoards,
  renameBoard,
} from '../persistence/boardsRepository'
import type { StoredBoard } from '../features/editor/types'
import { parseFlowboardFile } from '../import-export/importBoard'

export function BoardsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const text = await file.text()
    const result = parseFlowboardFile(text)

    if (!result.success) {
      window.alert(result.error)
      event.target.value = ''
      return
    }

    const importedBoard = await createBoard(result.file.board.name, {
      nodes: result.file.board.nodes,
      edges: result.file.board.edges,
    })

    event.target.value = ''

    navigate(`/boards/${importedBoard.id}`)
  }

  return (
    <main className="boards-page min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="workspace-header mb-14 flex flex-wrap items-center justify-between gap-5">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              ⌘
            </span>{' '}
            Flowboard
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.flowboard.json,application/json"
              onChange={(event) => {
                void handleImportFile(event)
              }}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="secondary-button"
            >
              Import
            </button>

            <button
              type="button"
              onClick={handleCreateBoard}
              className="primary-button"
            >
              + New board
            </button>
          </div>
        </header>

        <div className="collection-heading">
          <h1>
            Boards
            <span className="board-count">
              {String(boards.length).padStart(2, '0')}
            </span>
          </h1>
        </div>
        {isLoading ? (
          <p className="text-sm text-content-muted">Loading boards...</p>
        ) : boards.length === 0 ? (
          <div className="empty-state p-16 text-center">
            <p className="text-content-secondary">No boards yet.</p>

            <p className="mt-1 text-sm text-content-muted">
              Create your first board to start diagramming.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <div
                key={board.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/boards/${board.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    navigate(`/boards/${board.id}`)
                  }
                }}
                className="board-card cursor-pointer text-left"
              >
                <div className="board-preview" aria-hidden="true">
                  <span />
                  <i />
                  <span />
                  <i />
                  <span />
                </div>
                <div className="flex items-center justify-between gap-2">
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
                      className="min-w-0 w-full border border-content-muted bg-field px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-page-border"
                    />
                  ) : (
                    <div className="min-w-0 truncate font-medium">
                      {board.name}
                    </div>
                  )}

                  {editingBoardId !== board.id && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleStartRename(board)
                        }}
                        className="rounded px-2 py-1 text-sm text-content-muted hover:bg-action-hover hover:text-content-strong"
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
                        className="rounded px-2 py-1 text-sm text-content-muted hover:bg-danger-subtle hover:text-danger"
                        aria-label={`Delete ${board.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-xs text-content-muted">
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
