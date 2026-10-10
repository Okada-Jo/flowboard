import { db } from './db'

import type { DiagramDocument, StoredBoard } from '../features/editor/types'

export async function getBoard(id: string): Promise<StoredBoard | undefined> {
  return db.boards.get(id)
}

export async function listBoards(): Promise<StoredBoard[]> {
  return db.boards.orderBy('updatedAt').reverse().toArray()
}

export async function createBoard(
  name: string,
  document: DiagramDocument = {
    nodes: [],
    edges: [],
  },
): Promise<StoredBoard> {
  const now = new Date().toISOString()

  const board: StoredBoard = {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    document,
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

export async function importBoard(
  name: string,
  document: DiagramDocument,
): Promise<StoredBoard> {
  const now = new Date().toISOString()

  const board: StoredBoard = {
    id: crypto.randomUUID(),
    name,
    document,
    createdAt: now,
    updatedAt: now,
  }

  await db.boards.add(board)

  return board
}

// Import a linked collection atomically and give every included board a new ID.
export async function importFlowboardFile(
  file: import('../import-export/schema').FlowboardFile,
): Promise<StoredBoard> {
  const records = [file.board, ...(file.linkedBoards ?? [])]
  const ids = records.map(() => crypto.randomUUID())
  const idMap = new Map(
    records.flatMap((board, index) =>
      board.id ? [[board.id, ids[index]]] : [],
    ),
  )
  const now = new Date().toISOString()
  const boards: StoredBoard[] = records.map((board, index) => ({
    id: ids[index],
    name: board.name,
    createdAt: now,
    updatedAt: now,
    document: {
      nodes: board.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          ...(node.data.linkedBoardId
            ? {
                linkedBoardId:
                  idMap.get(node.data.linkedBoardId) ?? node.data.linkedBoardId,
              }
            : {}),
        },
      })),
      edges: board.edges,
    },
  }))
  await db.transaction('rw', db.boards, () => db.boards.bulkAdd(boards))
  return boards[0]
}
