import { expect, it, vi } from 'vitest'
import { createFlowboardFile, downloadFlowboardFile } from './exportBoard'
import { parseFlowboardFile } from './importBoard'
import { diagram } from '../test/fixtures'

it('round-trips every node type and connections through JSON', () => {
  const document = diagram()
  document.nodes.push({
    id: 'io',
    type: 'input-output',
    position: { x: -10, y: 2.5 },
    data: { label: 'Input', description: 'Details' },
  })
  const file = createFlowboardFile('My board', document)
  expect(parseFlowboardFile(JSON.stringify(file))).toEqual({
    success: true,
    file: { version: 1, board: { name: 'My board', ...document } },
  })
})

it('reports malformed JSON', () => {
  expect(parseFlowboardFile('{')).toEqual({
    success: false,
    error: 'The selected file is not valid JSON.',
  })
})

it.each([
  null,
  { version: 2, board: { name: 'Board', ...diagram() } },
  { version: 1, board: { name: '', ...diagram() } },
  { version: 1, board: { name: 'Board', nodes: [], edges: diagram().edges } },
  {
    version: 1,
    board: {
      name: 'Board',
      nodes: [{ ...diagram().nodes[0], type: 'unknown' }],
      edges: [],
    },
  },
  {
    version: 1,
    board: {
      name: 'Board',
      nodes: [{ ...diagram().nodes[0], position: { x: 'bad', y: 0 } }],
      edges: [],
    },
  },
  ...['source', 'target'].map((endpoint) => ({
    version: 1,
    board: {
      name: 'Board',
      nodes: diagram().nodes,
      edges: [{ ...diagram().edges[0], [endpoint]: 'missing' }],
    },
  })),
])('rejects invalid or unsupported files: %j', (value) => {
  expect(parseFlowboardFile(JSON.stringify(value))).toEqual({
    success: false,
    error: 'The selected file is not a valid Flowboard file.',
  })
})

it.each([
  [' My / Board! ', 'my-board'],
  ['!!!', 'board'],
])(
  'downloads %s with a safe filename and releases its URL',
  (name, filename) => {
    const createObjectURL = vi.fn(() => 'blob:test')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal(
      'URL',
      Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }),
    )
    let anchor: { download: string; href: string } | undefined
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      anchor = { download: this.download, href: this.href }
    })
    downloadFlowboardFile(createFlowboardFile(name, diagram()))
    expect(anchor?.download).toBe(`${filename}.flowboard.json`)
    expect(anchor?.href).toBe('blob:test')
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
  },
)
