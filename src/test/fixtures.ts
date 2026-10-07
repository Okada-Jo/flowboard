import type { DiagramDocument } from '../features/editor/types'

export function diagram(): DiagramDocument {
  return {
    nodes: [
      {
        id: 'a',
        type: 'process',
        position: { x: 10, y: 20 },
        data: { label: 'Start' },
      },
      {
        id: 'b',
        type: 'decision',
        position: { x: 100, y: 200 },
        data: { label: 'Ready?' },
      },
      {
        id: 'c',
        type: 'note',
        position: { x: 300, y: 200 },
        data: { label: 'Note' },
      },
    ],
    edges: [
      { id: 'ab', source: 'a', target: 'b' },
      { id: 'bc', source: 'b', target: 'c' },
    ],
  }
}
