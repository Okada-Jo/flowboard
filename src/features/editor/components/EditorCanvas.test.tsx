import { act, render } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import type { NodeChange, Connection, Edge } from '@xyflow/react'
import { expect, it, vi } from 'vitest'
import reducer, {
  boardLoaded,
  undo,
  redo,
  nodeDataChanged,
} from '../editorSlice'
import { diagram } from '../../../test/fixtures'
import { EditorCanvas } from './EditorCanvas'

const canvas = vi.hoisted(() => ({
  onNodesChange: vi.fn<(changes: NodeChange[]) => void>(),
  onConnect: vi.fn<(connection: Connection) => void>(),
  edges: [] as Edge[],
}))

vi.mock('@xyflow/react', () => ({
  ReactFlow: (props: {
    onNodesChange: typeof canvas.onNodesChange
    onConnect: typeof canvas.onConnect
    edges: Edge[]
  }) => {
    canvas.onNodesChange = props.onNodesChange
    canvas.onConnect = props.onConnect
    canvas.edges = props.edges
    return null
  },
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => children,
  useReactFlow: () => ({ screenToFlowPosition: (point: unknown) => point }),
  Background: () => null,
  Controls: () => null,
  Panel: () => null,
  Handle: () => null,
  NodeResizer: () => null,
  NodeToolbar: () => null,
  useUpdateNodeInternals: () => () => {},
  Position: { Top: 'top', Bottom: 'bottom' },
}))

it('ignores measurements and groups resize dimensions and position changes into one undo step', () => {
  const store = configureStore({ reducer: { editor: reducer } })
  store.dispatch(boardLoaded(diagram()))
  render(
    <Provider store={store}>
      <EditorCanvas onExport={() => {}} />
    </Provider>,
  )
  act(() =>
    canvas.onNodesChange([
      { type: 'dimensions', id: 'a', dimensions: { width: 210, height: 100 } },
    ]),
  )
  expect(store.getState().editor.nodes).toEqual(diagram().nodes)
  expect(store.getState().editor.past).toHaveLength(0)

  act(() =>
    canvas.onNodesChange([
      { type: 'position', id: 'a', position: { x: -50, y: -30 } },
      {
        type: 'dimensions',
        id: 'a',
        resizing: true,
        setAttributes: true,
        dimensions: { width: 320, height: 200 },
      },
    ]),
  )
  act(() =>
    canvas.onNodesChange([
      {
        type: 'dimensions',
        id: 'a',
        resizing: false,
        dimensions: { width: 320, height: 200 },
      },
    ]),
  )
  expect(store.getState().editor.past).toHaveLength(1)
  expect(store.getState().editor.nodes[0]).toMatchObject({
    width: 320,
    height: 200,
    position: { x: -50, y: -30 },
  })
  act(() => {
    store.dispatch(undo())
  })
  expect(store.getState().editor.nodes).toEqual(diagram().nodes)
  act(() => {
    store.dispatch(redo())
  })
  expect(store.getState().editor.nodes[0]).toMatchObject({
    width: 320,
    height: 200,
  })
})

it('persists named decision routes, updates labels, and distinguishes notes and incomplete checkpoints', () => {
  const store = configureStore({ reducer: { editor: reducer } })
  const document = diagram()
  document.nodes[0].type = 'checkpoint'
  document.nodes[0].data.criteria = [
    { id: 'check', label: 'Verified', done: false },
  ]
  store.dispatch(boardLoaded(document))
  render(
    <Provider store={store}>
      <EditorCanvas onExport={() => {}} />
    </Provider>,
  )
  expect(canvas.edges.find((edge) => edge.id === 'ab')).toMatchObject({
    label: 'Not ready',
    style: { strokeDasharray: '8 5' },
  })
  expect(canvas.edges.find((edge) => edge.id === 'bc')).toMatchObject({
    label: 'Note',
    style: { strokeDasharray: '3 5' },
  })
  act(() =>
    canvas.onConnect({
      source: 'b',
      target: 'a',
      sourceHandle: 'yes',
      targetHandle: null,
    }),
  )
  expect(store.getState().editor.edges.at(-1)?.sourceHandle).toBe('yes')
  expect(canvas.edges.at(-1)?.label).toBe('Yes')
  act(() => {
    store.dispatch(
      nodeDataChanged({
        id: 'b',
        changes: {
          outcomes: [
            { id: 'yes', label: 'Approved' },
            { id: 'no', label: 'No' },
          ],
        },
      }),
    )
  })
  expect(canvas.edges.at(-1)?.label).toBe('Approved')
  act(() => {
    store.dispatch(
      nodeDataChanged({
        id: 'a',
        changes: { criteria: [{ id: 'check', label: 'Verified', done: true }] },
      }),
    )
  })
  expect(
    canvas.edges.find((edge) => edge.id === 'ab')?.style?.strokeDasharray,
  ).toBeUndefined()
})
