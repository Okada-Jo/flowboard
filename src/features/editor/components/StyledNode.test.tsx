import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { expect, it, vi } from 'vitest'
import reducer, { boardLoaded, undo } from '../editorSlice'
import { useAppSelector } from '../../../app/hooks'
import { StyledNode } from './StyledNode'
import type { FlowNode, FlowEdge } from '../types'

const update = vi.hoisted(() => vi.fn())
vi.mock('@xyflow/react', () => ({
  Handle: ({ 'aria-label': label }: { 'aria-label': string }) => (
    <span aria-label={label} />
  ),
  NodeResizer: () => null,
  NodeToolbar: ({ children }: { children: React.ReactNode }) => children,
  Position: { Top: 'top', Right: 'right', Bottom: 'bottom' },
  useUpdateNodeInternals: () => update,
}))

function setup(node: FlowNode, edges: FlowEdge[] = []) {
  const store = configureStore({ reducer: { editor: reducer } })
  store.dispatch(boardLoaded({ nodes: [node], edges }))
  function Card() {
    const current = useAppSelector((state) => state.editor.nodes[0])
    return (
      <StyledNode
        id={current.id}
        data={current.data}
        kind={current.type}
        type={current.type}
        selected={true}
        dragging={false}
        isConnectable={true}
        selectable={true}
        deletable={true}
        draggable={true}
        zIndex={0}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    )
  }
  render(
    <Provider store={store}>
      <Card />
    </Provider>,
  )
  return store
}
const node: FlowNode = {
  id: 'a',
  type: 'process',
  position: { x: 0, y: 0 },
  data: { label: 'Start' },
}

it('edits title and multiline instructions directly, commits on Tab, and cancels with Escape', async () => {
  const store = setup(node)
  const user = userEvent.setup()
  const title = screen.getByRole('textbox', { name: 'Node title' })
  await user.click(title)
  await user.clear(title)
  await user.type(title, 'Review')
  expect(store.getState().editor.nodes[0].data.label).toBe('Start')
  await user.tab()
  const body = screen.getByRole('textbox', { name: 'Instructions' })
  expect(body).toHaveFocus()
  await user.type(body, 'First line{Enter}Second line')
  await user.tab()
  expect(store.getState().editor.nodes[0].data).toMatchObject({
    label: 'Review',
    description: 'First line\nSecond line',
  })
  await user.click(title)
  await user.type(title, ' discard{Escape}')
  expect(title).toHaveValue('Review')
  expect(store.getState().editor.past).toHaveLength(2)
})

it('creates editable decision outcomes and protects connected routes from removal', async () => {
  const store = setup(
    {
      ...node,
      type: 'decision',
      data: {
        label: 'Approved?',
        outcomes: [
          { id: 'yes', label: 'Yes' },
          { id: 'no', label: 'No' },
          { id: 'later', label: 'Later' },
        ],
      },
    },
    [{ id: 'edge', source: 'a', target: 'b', sourceHandle: 'later' }],
  )
  const user = userEvent.setup()
  expect(
    screen.getByRole('button', { name: 'Remove outcome Later' }),
  ).toBeDisabled()
  await user.click(screen.getByRole('button', { name: '+ Add outcome' }))
  expect(store.getState().editor.nodes[0].data.outcomes).toHaveLength(4)
  const outcomes = screen.getAllByRole('textbox', { name: 'Outcome label' })
  await user.clear(outcomes[0])
  await user.type(outcomes[0], 'Approved{Tab}')
  expect(store.getState().editor.nodes[0].data.outcomes?.[0]).toEqual({
    id: 'yes',
    label: 'Approved',
  })
  expect(store.getState().editor.edges[0].sourceHandle).toBe('later')
})

it('tracks manually checked readiness and restores criteria through undo', async () => {
  const store = setup({
    ...node,
    type: 'checkpoint',
    data: {
      label: 'Publish',
      criteria: [{ id: 'tests', label: 'Tests passed', done: false }],
    },
  })
  expect(screen.getByRole('status')).toHaveTextContent(
    '0 of 1 ready · Not ready',
  )
  await userEvent.click(
    screen.getByRole('checkbox', { name: 'Ready: Tests passed' }),
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    '1 of 1 ready · Ready to continue',
  )
  act(() => {
    store.dispatch(undo())
  })
  expect(screen.getByRole('checkbox')).not.toBeChecked()
  expect(screen.getByRole('status')).toHaveTextContent('Not ready')
})
