import type { DiagramDocument } from '../features/editor/types'
import { flowboardFileSchema, type FlowboardFile } from './schema'

export function createFlowboardFile(
  name: string,
  document: DiagramDocument,
): FlowboardFile {
  const file = {
    version: 1 as const,
    board: {
      name,
      nodes: document.nodes,
      edges: document.edges,
    },
  }

  return flowboardFileSchema.parse(file)
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
