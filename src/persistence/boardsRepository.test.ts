import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { db } from './db'
import {
  createBoard,
  deleteBoard,
  getBoard,
  importBoard,
  listBoards,
  renameBoard,
  saveBoard,
} from './boardsRepository'
import { diagram } from '../test/fixtures'

beforeEach(async () => {
  await db.boards.clear()
})
afterEach(() => vi.useRealTimers())

it('creates distinct boards and persists an empty document by default', async () => {
  const first = await createBoard('First')
  const second = await createBoard('Second')
  expect(first.id).not.toBe(second.id)
  expect(await getBoard(first.id)).toEqual(first)
  expect(first.document).toEqual({ nodes: [], edges: [] })
  expect(first.createdAt).toBe(first.updatedAt)
})

it('saves and renames boards, preserves creation time, and lists most recently updated first', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-01-01'))
  const first = await createBoard('First')
  vi.setSystemTime(new Date('2026-01-02'))
  const second = await createBoard('Second')
  expect((await listBoards()).map((b) => b.id)).toEqual([second.id, first.id])
  vi.setSystemTime(new Date('2026-01-03'))
  await saveBoard(first.id, diagram())
  await renameBoard(first.id, 'Renamed')
  expect(await getBoard(first.id)).toEqual({
    ...first,
    name: 'Renamed',
    document: diagram(),
    updatedAt: new Date().toISOString(),
  })
  expect((await listBoards()).map((b) => b.id)).toEqual([first.id, second.id])
})

it('imports an independent board and deletes only the requested board', async () => {
  const original = await createBoard('Original', diagram())
  const imported = await importBoard('Imported', diagram())
  expect(imported.id).not.toBe(original.id)
  expect((await getBoard(imported.id))?.document).toEqual(diagram())
  await deleteBoard(original.id)
  expect(await getBoard(original.id)).toBeUndefined()
  expect(await listBoards()).toEqual([imported])
})

it('persists resized dimensions when saving and reopening a board', async () => {
  const board = await createBoard('Resizable', diagram())
  const document = diagram()
  document.nodes[0] = { ...document.nodes[0], width: 360, height: 240 }
  await saveBoard(board.id, document)
  expect((await getBoard(board.id))?.document).toEqual(document)
})
