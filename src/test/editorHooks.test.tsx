import { configureStore } from '@reduxjs/toolkit'
import { act, fireEvent, renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import type { PropsWithChildren } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import reducer, {
  boardLoaded,
  nodeLabelChanged,
  selectAll,
} from '../features/editor/editorSlice'
import { useEditorShortcuts } from '../features/editor/shortcuts/useEditorShortcuts'
import { useBoardAutosave } from '../persistence/useBoardAutosave'
import { saveBoard } from '../persistence/boardsRepository'
import { diagram } from './fixtures'

vi.mock('../persistence/boardsRepository', () => ({
  saveBoard: vi.fn().mockResolvedValue(undefined),
}))
afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

function setup() {
  const store = configureStore({ reducer: { editor: reducer } })
  store.dispatch(boardLoaded(diagram()))
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  )
  return { store, wrapper }
}

it.each(['ctrlKey', 'metaKey'])(
  'supports selection, copy/paste, delete, undo/redo, duplicate and escape with %s',
  (modifier) => {
    const { store, wrapper } = setup()
    renderHook(useEditorShortcuts, { wrapper })
    const key = (key: string, shiftKey = false) =>
      fireEvent.keyDown(window, { key, [modifier]: true, shiftKey })
    key('a')
    expect(store.getState().editor.selectedNodeIds).toHaveLength(3)
    key('c')
    key('v')
    expect(store.getState().editor.nodes).toHaveLength(6)
    expect(new Set(store.getState().editor.nodes.map((n) => n.id)).size).toBe(6)
    fireEvent.keyDown(window, { key: 'Delete' })
    expect(store.getState().editor.nodes).toHaveLength(3)
    key('z')
    expect(store.getState().editor.nodes).toHaveLength(6)
    key('z', true)
    expect(store.getState().editor.nodes).toHaveLength(3)
    key('a')
    key('d')
    expect(store.getState().editor.nodes).toHaveLength(6)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(store.getState().editor.selectedNodeIds).toEqual([])
  },
)

it.each(['input', 'textarea', 'select'])(
  'does not delete diagram nodes while typing in a %s',
  (tag) => {
    const { store, wrapper } = setup()
    store.dispatch(selectAll())
    const { unmount } = renderHook(useEditorShortcuts, { wrapper })
    const input = document.createElement(tag)
    document.body.append(input)
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(store.getState().editor.nodes).toHaveLength(3)
    input.remove()
    unmount()
    fireEvent.keyDown(window, { key: 'Delete' })
    expect(store.getState().editor.nodes).toHaveLength(3)
  },
)

it('debounces autosave and persists the latest document only', () => {
  vi.useFakeTimers()
  const { store, wrapper } = setup()
  renderHook(() => useBoardAutosave({ boardId: 'board', enabled: true }), {
    wrapper,
  })
  act(() => {
    vi.advanceTimersByTime(400)
    store.dispatch(nodeLabelChanged({ id: 'a', label: 'Latest' }))
  })
  act(() => vi.advanceTimersByTime(499))
  expect(saveBoard).not.toHaveBeenCalled()
  act(() => vi.advanceTimersByTime(1))
  expect(saveBoard).toHaveBeenCalledExactlyOnceWith('board', {
    nodes: store.getState().editor.nodes,
    edges: diagram().edges,
  })
})

it('does not autosave before loading and cancels pending saves on board changes or unmount', () => {
  vi.useFakeTimers()
  const { wrapper } = setup()
  const { rerender, unmount } = renderHook(useBoardAutosave, {
    wrapper,
    initialProps: { boardId: undefined as string | undefined, enabled: false },
  })
  act(() => vi.advanceTimersByTime(500))
  rerender({ boardId: 'old', enabled: false })
  act(() => vi.advanceTimersByTime(500))
  expect(saveBoard).not.toHaveBeenCalled()
  rerender({ boardId: 'old', enabled: true })
  act(() => vi.advanceTimersByTime(400))
  rerender({ boardId: 'new', enabled: true })
  act(() => vi.advanceTimersByTime(500))
  expect(saveBoard).toHaveBeenCalledExactlyOnceWith('new', diagram())
  rerender({ boardId: 'pending', enabled: true })
  unmount()
  act(() => vi.advanceTimersByTime(500))
  expect(saveBoard).toHaveBeenCalledTimes(1)
})
