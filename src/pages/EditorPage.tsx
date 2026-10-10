import { ThemeToggle } from '../theme/ThemeToggle'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useStore } from 'react-redux'
import type { RootState } from '../app/store'
import { useAppDispatch } from '../app/hooks'
import { EditorCanvas } from '../features/editor/components/EditorCanvas'
import { boardLoaded, nodeDataChanged } from '../features/editor/editorSlice'
import type { StoredBoard } from '../features/editor/types'
import {
  createBoard,
  getBoard,
  listBoards,
  saveBoard,
} from '../persistence/boardsRepository'
import { useBoardAutosave } from '../persistence/useBoardAutosave'
import {
  createFlowboardFile,
  downloadFlowboardFile,
} from '../import-export/exportBoard'

type Crumb = { id: string; name: string }
function readTrail(state: unknown): Crumb[] {
  const trail = (state as { trail?: unknown } | null)?.trail
  return Array.isArray(trail)
    ? trail.filter(
        (item): item is Crumb =>
          item && typeof item.id === 'string' && typeof item.name === 'string',
      )
    : []
}

export function EditorPage() {
  const { boardId } = useParams()
  return boardId ? <BoardEditor key={boardId} boardId={boardId} /> : null
}

function BoardEditor({ boardId }: { boardId: string }) {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const navigate = useNavigate()
  const location = useLocation()
  const trail = readTrail(location.state)
  const [board, setBoard] = useState<StoredBoard | null>(null)
  const [boards, setBoards] = useState<StoredBoard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const saveError = useBoardAutosave({ boardId, enabled: Boolean(board) })

  useEffect(() => {
    let cancelled = false
    void Promise.all([getBoard(boardId), listBoards()])
      .then(([stored, all]) => {
        if (cancelled) return
        if (stored) {
          dispatch(boardLoaded(stored.document))
          setBoard(stored)
        }
        setBoards(all)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load this board. Please reload to try again.')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [boardId, dispatch])

  async function flush() {
    if (!board) return
    const { nodes, edges } = store.getState().editor
    await saveBoard(boardId, { nodes, edges })
  }
  async function open(id?: string) {
    await flush()
    if (!id) {
      navigate('/')
      return
    }
    if (!(await getBoard(id))) throw new Error('Board unavailable')
    const existing = trail.findIndex((item) => item.id === id)
    navigate(`/boards/${id}`, {
      state: {
        trail:
          existing >= 0
            ? trail.slice(0, existing)
            : [...trail, { id: boardId, name: board?.name ?? 'Board' }],
      },
    })
  }
  async function createLinked(nodeId: string, name: string) {
    const linked = await createBoard(name)
    dispatch(
      nodeDataChanged({ id: nodeId, changes: { linkedBoardId: linked.id } }),
    )
    setBoards((current) => [...current, linked])
    await open(linked.id)
  }
  async function exportBoard() {
    try {
      const { nodes, edges } = store.getState().editor
      const all = await listBoards()
      downloadFlowboardFile(
        createFlowboardFile(
          board?.name ?? 'Board',
          { nodes, edges },
          { id: boardId, boards: all },
        ),
      )
    } catch {
      setError('Could not export this board. Please try again.')
    }
  }
  function navigateSafely(id?: string) {
    void open(id).catch(() =>
      setError(
        'Could not save or open the board. Your current board is still open.',
      ),
    )
  }

  if (loading)
    return (
      <main className="flex h-screen items-center justify-center">
        Loading board…
      </main>
    )
  return (
    <main className="h-screen editor-page">
      <header className="editor-header flex h-16 items-center gap-4 border-b border-page-border px-5">
        <button className="brand shrink-0" onClick={() => navigateSafely()}>
          <span className="brand-mark" aria-hidden="true">
            ⌘
          </span>{' '}
          Flowboard
        </button>
        <nav aria-label="Flow navigation" className="flow-breadcrumbs">
          {trail.map((item) => (
            <span key={item.id}>
              <button onClick={() => navigateSafely(item.id)}>
                ← {item.name}
              </button>
              <span aria-hidden="true"> / </span>
            </span>
          ))}
          <span aria-current="page">{board?.name ?? 'Board not found'}</span>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => void exportBoard()}
            disabled={!board}
            className="secondary-button"
          >
            Export
          </button>
        </div>
      </header>
      {(error || saveError) && (
        <div role="alert" className="editor-error">
          {error || saveError}
        </div>
      )}
      <div className="editor-body">
        {board ? (
          <EditorCanvas
            onExport={() => void exportBoard()}
            navigation={{
              boardId,
              boards,
              onOpen: open,
              onCreate: createLinked,
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            Board not found. Return to Flowboard to choose another board.
          </div>
        )}
      </div>
    </main>
  )
}
