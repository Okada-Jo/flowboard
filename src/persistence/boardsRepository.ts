import { db } from './db'

import type { DiagramDocument, StoredBoard } from '../features/editor/types'

export async function getBoard(id: string): Promise<StoredBoard | undefined> {
  return db.boards.get(id)
}

export async function listBoards(): Promise<StoredBoard[]> {
  return db.boards.orderBy('updatedAt').reverse().toArray()
}

export async function createBoard(name: string): Promise<StoredBoard> {
  const now = new Date().toISOString()

  const board: StoredBoard = {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    document: {
      nodes: [],
      edges: [],
    },
  }

  await db.boards.add(board)

  return board
}

export async function saveBoard(
  id: string,
  document: DiagramDocument,
): Promise<void> {
  await db.boards.update(id, {
    document,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteBoard(id: string): Promise<void> {
  await db.boards.delete(id)
}

export async function renameBoard(id: string, name: string): Promise<void> {
  await db.boards.update(id, {
    name,
    updatedAt: new Date().toISOString(),
  })
}
