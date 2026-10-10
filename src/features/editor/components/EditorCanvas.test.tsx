import { act, render } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import type { NodeChange } from '@xyflow/react'
import { expect, it, vi } from 'vitest'
import reducer, { boardLoaded, undo, redo } from '../editorSlice'
import { diagram } from '../../../test/fixtures'
import { EditorCanvas } from './EditorCanvas'

const canvas = vi.hoisted(() => ({
  onNodesChange: vi.fn<(changes: NodeChange[]) => void>(),
}))

vi.mock('@xyflow/react', () => ({
  ReactFlow: (props: { onNodesChange: typeof canvas.onNodesChange }) => {
    canvas.onNodesChange = props.onNodesChange
    return null
  },
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => children,
  useReactFlow: () => ({ screenToFlowPosition: (point: unknown) => point }),
  Background: () => null,
  Controls: () => null,
  Panel: () => null,
  Handle: () => null,
  NodeResizer: () => null,
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
