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

it('exports and imports linked flows including cycles, remaps board IDs and preserves semantic node data', async () => {
  const { createFlowboardFile } = await import('../import-export/exportBoard')
  const { parseFlowboardFile } = await import('../import-export/importBoard')
  const { importFlowboardFile } = await import('./boardsRepository')
  const root = await createBoard('Overview')
  const child = await createBoard('Detail')
  root.document = {
    nodes: [
      {
        id: 'link',
        type: 'linked-flow',
        position: { x: 0, y: 0 },
        data: { label: 'Detail', linkedBoardId: child.id },
        width: 400,
        height: 300,
      },
    ],
    edges: [],
  }
  child.document = {
    nodes: [
      {
        id: 'back',
        type: 'linked-flow',
        position: { x: 0, y: 0 },
        data: { label: 'Back', linkedBoardId: root.id },
      },
      {
        id: 'check',
        type: 'checkpoint',
        position: { x: 100, y: 0 },
        data: {
          label: 'Ready?',
          criteria: [{ id: 'c', label: 'Verified', done: true }],
        },
      },
      {
        id: 'choose',
        type: 'decision',
        position: { x: 0, y: 100 },
        data: {
          label: 'Choose',
          outcomes: [
            { id: 'go', label: 'Go' },
            { id: 'stop', label: 'Stop' },
          ],
        },
      },
    ],
    edges: [
      { id: 'route', source: 'choose', target: 'check', sourceHandle: 'go' },
    ],
  }
  const exported = createFlowboardFile(root.name, root.document, {
    id: root.id,
    boards: [root, child],
  })
  expect(exported.version).toBe(2)
  expect(exported.linkedBoards).toHaveLength(1)
  const parsed = parseFlowboardFile(JSON.stringify(exported))
  expect(parsed.success).toBe(true)
  if (!parsed.success) throw new Error(parsed.error)
  const imported = await importFlowboardFile(parsed.file)
  const importedChildId = imported.document.nodes[0].data.linkedBoardId!
  expect(imported.id).not.toBe(root.id)
  expect(importedChildId).not.toBe(child.id)
  const importedChild = (await getBoard(importedChildId))!
  expect(importedChild.document.nodes[0].data.linkedBoardId).toBe(imported.id)
  expect(importedChild.document.nodes[1].data.criteria).toEqual(
    child.document.nodes[1].data.criteria,
  )
  expect(importedChild.document.edges).toEqual(child.document.edges)
  expect(imported.document.nodes[0]).toMatchObject({ width: 400, height: 300 })
})
