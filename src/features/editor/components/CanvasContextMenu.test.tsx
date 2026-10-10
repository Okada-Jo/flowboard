import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { CanvasContextMenu } from './CanvasContextMenu'

function props() {
  return {
    x: 100,
    y: 100,
    onAdd: vi.fn(),
    onClose: vi.fn(),
    onExport: vi.fn(),
    onTypeChange: vi.fn(),
    onRename: vi.fn(),
    onSelect: vi.fn(),
  }
}

it('offers the five purposeful node types and board export', async () => {
  const callbacks = props()
  render(<CanvasContextMenu {...callbacks} />)
  const user = userEvent.setup()
  for (const [name, type, label] of [
    ['Step', 'process', 'Untitled step'],
    ['Decision', 'decision', 'What happens next?'],
    ['Note', 'note', ''],
    ['Checkpoint', 'checkpoint', 'Ready to continue?'],
    ['Linked flow', 'linked-flow', 'Explore a flow'],
  ]) {
    await user.click(screen.getByRole('menuitem', { name: `Add ${name}` }))
    expect(callbacks.onAdd).toHaveBeenLastCalledWith(type, label)
  }
  await user.click(screen.getByRole('menuitem', { name: 'Export board' }))
  expect(callbacks.onExport).toHaveBeenCalledOnce()
})

it('offers rename, selection and type changes for nodes', async () => {
  const callbacks = props()
  const { rerender } = render(
    <CanvasContextMenu
      {...callbacks}
      node={{ type: 'process', selected: false }}
    />,
  )
  const user = userEvent.setup()
  expect(screen.getByRole('menuitemradio', { name: 'Step' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await user.click(screen.getByRole('menuitemradio', { name: 'Decision' }))
  expect(callbacks.onTypeChange).toHaveBeenCalledWith('decision')
  await user.click(screen.getByRole('menuitem', { name: 'Edit text' }))
  await user.click(screen.getByRole('menuitem', { name: 'Add to selection' }))
  expect(callbacks.onRename).toHaveBeenCalledOnce()
  expect(callbacks.onSelect).toHaveBeenCalledOnce()
  rerender(
    <CanvasContextMenu
      {...callbacks}
      node={{ type: 'process', selected: true }}
    />,
  )
  expect(
    screen.getByRole('menuitem', { name: 'Already selected' }),
  ).toBeDisabled()
})

it('supports keyboard navigation, skips disabled actions and restores focus on close', async () => {
  const trigger = document.createElement('button')
  document.body.append(trigger)
  trigger.focus()
  const callbacks = props()
  const { unmount } = render(
    <CanvasContextMenu
      {...callbacks}
      node={{ type: 'process', selected: true }}
    />,
  )
  const user = userEvent.setup()
  expect(screen.getByRole('menuitem', { name: 'Edit text' })).toHaveFocus()
  await user.keyboard('{ArrowDown}')
  expect(screen.getByRole('menuitemradio', { name: 'Step' })).toHaveFocus()
  await user.keyboard('{End}')
  expect(
    screen.getByRole('menuitemradio', { name: 'Linked flow' }),
  ).toHaveFocus()
  await user.keyboard('{ArrowDown}')
  expect(screen.getByRole('menuitem', { name: 'Edit text' })).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(callbacks.onClose).toHaveBeenCalledOnce()
  unmount()
  expect(trigger).toHaveFocus()
  trigger.remove()
})

it('dismisses on outside clicks and removes listeners after unmount', () => {
  const callbacks = props()
  const { unmount } = render(<CanvasContextMenu {...callbacks} />)
  fireEvent.pointerDown(screen.getByRole('menu'))
  expect(callbacks.onClose).not.toHaveBeenCalled()
  fireEvent.pointerDown(document.body)
  expect(callbacks.onClose).toHaveBeenCalledOnce()
  unmount()
  fireEvent.pointerDown(document.body)
  fireEvent.resize(window)
  expect(callbacks.onClose).toHaveBeenCalledOnce()
})
