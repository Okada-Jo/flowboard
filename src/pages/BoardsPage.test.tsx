import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { BoardsPage } from './BoardsPage'
import { db } from '../persistence/db'
import {
  createBoard,
  getBoard,
  listBoards,
} from '../persistence/boardsRepository'

beforeEach(async () => {
  await db.boards.clear()
})
function Destination() {
  return <div>Opened board {useParams().boardId}</div>
}
function renderPage() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<BoardsPage />} />
        <Route path="/boards/:boardId" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  )
}

it('shows an empty state and creates and opens a persisted board', async () => {
  renderPage()
  expect(await screen.findByText('No boards yet.')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: '+ New board' }))
  expect(await screen.findByText(/Opened board/)).toBeInTheDocument()
  const boards = await listBoards()
  expect(boards).toHaveLength(1)
  expect(boards[0].name).toBe('Untitled Board')
  expect(screen.getByText(`Opened board ${boards[0].id}`)).toBeInTheDocument()
})

it('renames a board without navigating and persists the trimmed name', async () => {
  const board = await createBoard('Original')
  renderPage()
  const user = userEvent.setup()
  await user.click(
    await screen.findByRole('button', { name: 'Rename Original' }),
  )
  const input = screen.getByRole('textbox')
  await user.clear(input)
  await user.type(input, '  Revised  {Enter}')
  expect(
    await screen.findByRole('button', { name: 'Rename Revised' }),
  ).toBeInTheDocument()
  expect((await getBoard(board.id))?.name).toBe('Revised')
  expect(screen.queryByText(/Opened board/)).not.toBeInTheDocument()
})

it('keeps a board when deletion is cancelled and removes it when confirmed', async () => {
  const board = await createBoard('Saved')
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  renderPage()
  const button = await screen.findByRole('button', { name: 'Delete Saved' })
  await userEvent.click(button)
  expect(await getBoard(board.id)).toBeDefined()
  confirm.mockReturnValue(true)
  await userEvent.click(button)
  expect(await screen.findByText('No boards yet.')).toBeInTheDocument()
  expect(await getBoard(board.id)).toBeUndefined()
})

it('opens a saved board with the keyboard', async () => {
  const board = await createBoard('Saved')
  renderPage()
  const card = await screen.findByRole('button', { name: /Saved Edit Delete/ })
  fireEvent.keyDown(card, { key: 'Enter' })
  await waitFor(() =>
    expect(screen.getByText(`Opened board ${board.id}`)).toBeInTheDocument(),
  )
})
