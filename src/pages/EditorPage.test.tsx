import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { EditorPage } from './EditorPage'
import reducer, { nodeDataChanged } from '../features/editor/editorSlice'
import { useAppDispatch } from '../app/hooks'
import type { FlowNavigation } from '../features/editor/components/FlowNavigationContext'
import { createBoard, getBoard } from '../persistence/boardsRepository'
import { db } from '../persistence/db'

vi.mock('../features/editor/components/EditorCanvas', () => ({
  EditorCanvas: ({ navigation }: { navigation: FlowNavigation }) => {
    const dispatch = useAppDispatch()
    return (
      <div>
        <button
          onClick={() =>
            dispatch(
              nodeDataChanged({
                id: 'a',
                changes: { description: 'Latest instructions' },
              }),
            )
          }
        >
          Edit instructions
        </button>
        {navigation.boards
          .filter((board) => board.id !== navigation.boardId)
          .map((board) => (
            <button
              key={board.id}
              onClick={() => void navigation.onOpen!(board.id)}
            >
              Open {board.name}
            </button>
          ))}
      </div>
    )
  },
}))
beforeEach(() => db.boards.clear())

it('saves pending edits before opening a linked board and provides a safe return path', async () => {
  const first = await createBoard('Overview', {
    nodes: [
      {
        id: 'a',
        type: 'linked-flow',
        position: { x: 0, y: 0 },
        data: { label: 'Detail' },
      },
    ],
    edges: [],
  })
  const second = await createBoard('Detail')
  const store = configureStore({ reducer: { editor: reducer } })
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/boards/${first.id}`]}>
        <Routes>
          <Route path="/boards/:boardId" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
  const user = userEvent.setup()
  await user.click(
    await screen.findByRole('button', { name: 'Edit instructions' }),
  )
  await user.click(screen.getByRole('button', { name: 'Open Detail' }))
  await screen.findByRole('button', { name: '← Overview' })
  expect((await getBoard(first.id))?.document.nodes[0].data.description).toBe(
    'Latest instructions',
  )
  expect((await getBoard(second.id))?.document.nodes).toEqual([])
  await user.click(screen.getByRole('button', { name: '← Overview' }))
  await waitFor(() =>
    expect(store.getState().editor.nodes[0]?.data.description).toBe(
      'Latest instructions',
    ),
  )
  expect(
    screen.queryByRole('button', { name: '← Overview' }),
  ).not.toBeInTheDocument()
})
