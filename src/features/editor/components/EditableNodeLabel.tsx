import { useState } from 'react'

import { useAppDispatch } from '../../../app/hooks'
import { nodeLabelChanged } from '../editorSlice'

type EditableNodeLabelProps = {
  nodeId: string
  label: string
  className?: string
  inputClassName?: string
}

export function EditableNodeLabel({
  nodeId,
  label,
  className,
  inputClassName,
}: EditableNodeLabelProps) {
  const dispatch = useAppDispatch()

  const [isEditing, setIsEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState(label)

  function finishEditing() {
    const trimmedLabel = draftLabel.trim()

    if (trimmedLabel && trimmedLabel !== label) {
      dispatch(
        nodeLabelChanged({
          id: nodeId,
          label: trimmedLabel,
        }),
      )
    }

    if (!trimmedLabel) {
      setDraftLabel(label)
    }

    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        value={draftLabel}
        onChange={(event) => setDraftLabel(event.target.value)}
        onBlur={finishEditing}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }

          if (event.key === 'Escape') {
            setDraftLabel(label)
            setIsEditing(false)
          }
        }}
        className={`nodrag node-label-input w-full px-2 py-1 text-sm outline-none ${
          inputClassName ?? ''
        }`}
      />
    )
  }

  return (
    <div
      onDoubleClick={() => {
        setDraftLabel(label)
        setIsEditing(true)
      }}
      className={className}
    >
      {label}
    </div>
  )
}
