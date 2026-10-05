import { useContext, useState } from 'react'

import { useAppDispatch } from '../../../app/hooks'
import { NodeEditingContext } from './NodeEditingContext'
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

  const { editingNodeId, setEditingNodeId } = useContext(NodeEditingContext)
  const isEditing = editingNodeId === nodeId
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

    setEditingNodeId(null)
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        aria-label="Node name"
        onFocus={(event) => {
          setDraftLabel(label)
          event.currentTarget.select()
        }}
        value={draftLabel}
        onChange={(event) => setDraftLabel(event.target.value)}
        onBlur={finishEditing}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }

          if (event.key === 'Escape') {
            setDraftLabel(label)
            setEditingNodeId(null)
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
        setEditingNodeId(nodeId)
      }}
      className={className}
    >
      {label}
    </div>
  )
}
