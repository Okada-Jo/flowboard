import { useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

import { useAppDispatch } from '../../../app/hooks'
import { nodeLabelChanged } from '../editorSlice'

type ProcessNodeData = {
  label: string
}

export function ProcessNode({ id, data }: NodeProps) {
  const dispatch = useAppDispatch()
  const { label } = data as ProcessNodeData

  const [isEditing, setIsEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState(label)

  function finishEditing() {
    const trimmedLabel = draftLabel.trim()

    if (trimmedLabel && trimmedLabel !== label) {
      dispatch(
        nodeLabelChanged({
          id,
          label: trimmedLabel,
        }),
      )
    }

    if (!trimmedLabel) {
      setDraftLabel(label)
    }

    setIsEditing(false)
  }

  return (
    <div
      className="min-w-40 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 shadow-lg"
      onDoubleClick={() => {
        setDraftLabel(label)
        setIsEditing(true)
      }}
    >
      <Handle type="target" position={Position.Top} />

      {isEditing ? (
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
          className="nodrag w-full rounded bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-slate-400"
        />
      ) : (
        <div className="text-sm font-medium text-slate-100">
          {label}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}