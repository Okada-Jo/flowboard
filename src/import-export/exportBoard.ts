import type { DiagramDocument, StoredBoard } from '../features/editor/types'
import { flowboardFileSchema, type FlowboardFile } from './schema'

export function createFlowboardFile(
  name: string,
  document: DiagramDocument,
  context?: { id: string; boards: StoredBoard[] },
): FlowboardFile {
  const linkedBoards: NonNullable<FlowboardFile['linkedBoards']> = []
  const visited = new Set(context ? [context.id] : [])
  function collect(doc: DiagramDocument) {
    for (const node of doc.nodes) {
      const id = node.data.linkedBoardId
      if (!id || visited.has(id)) continue
      visited.add(id)
      const board = context?.boards.find((board) => board.id === id)
      if (!board) continue
      linkedBoards.push({ id, name: board.name, ...board.document })
      collect(board.document)
    }
  }
  collect(document)
  const extended =
    linkedBoards.length > 0 ||
    document.nodes.some(
      (node) =>
        node.type === 'checkpoint' ||
        node.type === 'linked-flow' ||
        node.data.outcomes ||
        node.data.criteria,
    ) ||
    document.edges.some((edge) => edge.sourceHandle || edge.label)
  return flowboardFileSchema.parse({
    version: extended ? 2 : 1,
    board: { ...(context ? { id: context.id } : {}), name, ...document },
    ...(linkedBoards.length ? { linkedBoards } : {}),
  })
}

export function downloadFlowboardFile(file: FlowboardFile): void {
  const json = JSON.stringify(file, null, 2)

  const blob = new Blob([json], {
    type: 'application/json',
  })

  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${toSafeFilename(file.board.name)}.flowboard.json`

  anchor.click()

  URL.revokeObjectURL(url)
}

function toSafeFilename(name: string): string {
  const safeName = name
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  return safeName || 'board'
}
