import { describe, expect, it } from 'vitest'
import reducer, * as actions from './editorSlice'
import { diagram } from '../../test/fixtures'

function loaded() {
  return reducer(undefined, actions.boardLoaded(diagram()))
}
function selected() {
  let state = loaded()
  for (const id of ['a', 'b'])
    state = reducer(state, actions.nodeSelectionChanged({ id, selected: true }))
  return state
}
const ids = { nodeIds: { a: 'a2', b: 'b2' }, edgeIds: { ab: 'ab2' } }

describe('diagram editing', () => {
  it('adds nodes and connections and restores them through undo/redo', () => {
    let state = reducer(undefined, actions.nodeAdded(diagram().nodes[0]))
    state = reducer(state, actions.nodeAdded(diagram().nodes[1]))
    state = reducer(state, actions.edgeAdded(diagram().edges[0]))
    expect(state.nodes).toHaveLength(2)
    expect(state.edges).toEqual([diagram().edges[0]])
    state = reducer(state, actions.undo())
    expect(state.edges).toEqual([])
    expect(reducer(state, actions.redo()).edges).toEqual([diagram().edges[0]])
  })

  it('changes labels and types, ignores unchanged edits, and clears redo on a new edit', () => {
    let state = loaded()
    state = reducer(
      state,
      actions.nodeLabelChanged({ id: 'a', label: 'Renamed' }),
    )
    state = reducer(
      state,
      actions.nodeTypeChanged({ id: 'a', type: 'input-output' }),
    )
    expect(state.nodes[0]).toMatchObject({
      type: 'input-output',
      data: { label: 'Renamed' },
    })
    expect(
      reducer(
        state,
        actions.nodeTypeChanged({ id: 'a', type: 'input-output' }),
      ),
    ).toBe(state)
    state = reducer(state, actions.undo())
    expect(state.nodes[0].type).toBe('process')
    state = reducer(
      state,
      actions.nodeLabelChanged({ id: 'a', label: 'New branch' }),
    )
    expect(state.future).toEqual([])
    expect(reducer(state, actions.redo())).toBe(state)
  })

  it('groups a drag into one undoable transaction', () => {
    let state = reducer(loaded(), actions.historyTransactionStarted())
    for (const x of [30, 60, 90])
      state = reducer(
        state,
        actions.nodePositionChanged({ id: 'a', position: { x, y: 50 } }),
      )
    state = reducer(state, actions.historyTransactionCommitted())
    expect(state.past).toHaveLength(1)
    expect(reducer(state, actions.undo()).nodes).toEqual(diagram().nodes)
    expect(
      reducer(reducer(state, actions.undo()), actions.redo()).nodes[0].position,
    ).toEqual({ x: 90, y: 50 })
  })

  it('deletes a node and its incident edges without deleting unrelated nodes', () => {
    const state = reducer(selected(), actions.nodeDeleted('b'))
    expect(state.nodes.map((n) => n.id)).toEqual(['a', 'c'])
    expect(state.edges).toEqual([])
    expect(state.selectedNodeIds).toEqual(['a'])
    expect(reducer(state, actions.undo()).nodes).toEqual(diagram().nodes)
  })

  it('deletes selected nodes and edges in one undo step', () => {
    let state = reducer(
      loaded(),
      actions.nodeSelectionChanged({ id: 'a', selected: true }),
    )
    state = reducer(
      state,
      actions.edgeSelectionChanged({ id: 'bc', selected: true }),
    )
    state = reducer(state, actions.selectionDeleted())
    expect(state.nodes.map((n) => n.id)).toEqual(['b', 'c'])
    expect(state.edges).toEqual([])
    expect(state.selectedNodeIds).toEqual([])
    expect(state.selectedEdgeIds).toEqual([])
    expect(reducer(state, actions.undo())).toMatchObject(diagram())
  })

  it('duplicates only internal connections and selects the offset copies', () => {
    const state = reducer(selected(), actions.duplicateSelection(ids))
    expect(state.nodes).toHaveLength(5)
    expect(state.nodes[3]).toMatchObject({
      id: 'a2',
      position: { x: 50, y: 60 },
    })
    expect(state.edges).toEqual([
      ...diagram().edges,
      { id: 'ab2', source: 'a2', target: 'b2' },
    ])
    expect(state.selectedNodeIds).toEqual(['a2', 'b2'])
    expect(reducer(state, actions.undo())).toMatchObject(diagram())
  })

  it('copies a snapshot and pastes it after the originals are edited or deleted', () => {
    let state = reducer(selected(), actions.selectionCopied())
    expect(state.past).toHaveLength(0)
    state = reducer(
      state,
      actions.nodeLabelChanged({ id: 'a', label: 'Changed' }),
    )
    state = reducer(state, actions.selectionDeleted())
    state = reducer(state, actions.clipboardPasted(ids))
    expect(state.nodes.find((n) => n.id === 'a2')?.data.label).toBe('Start')
    expect(state.edges).toEqual([{ id: 'ab2', source: 'a2', target: 'b2' }])
    expect(state.selectedNodeIds).toEqual(['a2', 'b2'])
  })

  it('selects all, clears selection, and resets history when loading another board', () => {
    let state = reducer(loaded(), actions.selectAll())
    expect(state.selectedNodeIds).toEqual(['a', 'b', 'c'])
    expect(state.selectedEdgeIds).toEqual(['ab', 'bc'])
    state = reducer(state, actions.selectionCleared())
    expect(state.selectedNodeIds).toEqual([])
    expect(state.selectedEdgeIds).toEqual([])
    state = reducer(state, actions.nodeDeleted('a'))
    state = reducer(state, actions.historyTransactionStarted())
    state = reducer(state, actions.boardLoaded({ nodes: [], edges: [] }))
    expect(state).toMatchObject({
      nodes: [],
      edges: [],
      past: [],
      future: [],
      historyTransactionActive: false,
      transactionStart: null,
    })
  })

  it('ignores empty clipboard, empty selection, and missing node/edge deletions', () => {
    const state = loaded()
    for (const action of [
      actions.clipboardPasted(ids),
      actions.duplicateSelection(ids),
      actions.selectionDeleted(),
      actions.nodeDeleted('missing'),
      actions.edgeDeleted('missing'),
      actions.undo(),
      actions.redo(),
    ]) {
      expect(reducer(state, action)).toBe(state)
    }
  })
})

it('resizes and repositions a node in one undo step and preserves dimensions in copies', () => {
  let state = reducer(selected(), actions.historyTransactionStarted())
  for (const width of [250, 320]) {
    state = reducer(
      state,
      actions.nodePositionChanged({ id: 'a', position: { x: -50, y: -20 } }),
    )
    state = reducer(
      state,
      actions.nodeDimensionsChanged({ id: 'a', width, height: 200 }),
    )
  }
  state = reducer(state, actions.historyTransactionCommitted())
  expect(state.past).toHaveLength(1)
  const undone = reducer(state, actions.undo())
  expect(undone.nodes).toEqual(diagram().nodes)
  expect(reducer(undone, actions.redo()).nodes).toEqual(state.nodes)
  state = reducer(state, actions.duplicateSelection(ids))
  expect(state.nodes.find((node) => node.id === 'a2')).toMatchObject({
    width: 320,
    height: 200,
  })
  state = reducer(state, actions.selectionCopied())
  state = reducer(
    state,
    actions.clipboardPasted({
      nodeIds: { a2: 'a3', b2: 'b3' },
      edgeIds: { ab2: 'ab3' },
    }),
  )
  expect(state.nodes.find((node) => node.id === 'a3')).toMatchObject({
    width: 320,
    height: 200,
  })
})

it('preserves decision connections and their meaning when converting types, with reversible history', () => {
  let state = reducer(
    undefined,
    actions.boardLoaded({
      nodes: [
        {
          ...diagram().nodes[0],
          type: 'decision',
          data: {
            label: 'Ready?',
            outcomes: [
              { id: 'yes', label: 'Approved' },
              { id: 'no', label: 'Revise' },
            ],
          },
        },
        diagram().nodes[1],
      ],
      edges: [{ id: 'ab', source: 'a', target: 'b', sourceHandle: 'yes' }],
    }),
  )
  const original = state.nodes
  state = reducer(state, actions.nodeTypeChanged({ id: 'a', type: 'process' }))
  expect(state.edges).toEqual([
    { id: 'ab', source: 'a', target: 'b', label: 'Approved' },
  ])
  expect(state.nodes[0].data.outcomes).toEqual(original[0].data.outcomes)
  state = reducer(state, actions.undo())
  expect(state.nodes).toEqual(original)
  expect(state.edges[0].sourceHandle).toBe('yes')
})
