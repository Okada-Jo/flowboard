import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { InlineText } from './InlineText'

function Editor() {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('First title')
  return (
    <>
      <button onClick={() => setEditing(true)}>Edit</button>
      <InlineText
        label="Title"
        value={title}
        placeholder="Title"
        autoFocus={editing}
        onCommit={setTitle}
        onFinished={() => setEditing(false)}
      />
      <InlineText
        label="Body"
        value=""
        placeholder="Body"
        multiline
        onCommit={() => {}}
      />
    </>
  )
}

it('focuses an existing title on Edit and preserves the field and Tab destination on commit', async () => {
  render(<Editor />)
  const user = userEvent.setup()
  const title = screen.getByRole('textbox', { name: 'Title' })
  await user.click(screen.getByRole('button', { name: 'Edit' }))
  expect(title).toHaveFocus()
  await user.keyboard('Revised')
  await user.tab()
  expect(screen.getByRole('textbox', { name: 'Title' })).toBe(title)
  expect(title).toHaveValue('Revised')
  expect(screen.getByRole('textbox', { name: 'Body' })).toHaveFocus()
  await user.click(screen.getByRole('button', { name: 'Edit' }))
  expect(title).toHaveFocus()
  await user.keyboard('Discard{Escape}')
  expect(title).toHaveValue('Revised')
})
