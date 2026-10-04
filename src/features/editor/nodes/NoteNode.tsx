import type { Node, NodeProps } from '@xyflow/react'

import type { FlowNodeData } from '../types'
import { EditableNodeLabel } from '../components/EditableNodeLabel'

export function NoteNode({
  id,
  data,
  selected,
}: NodeProps<Node<FlowNodeData>>) {
  return (
    <div
      className={[
        '...',
        selected
          ? 'border-blue-400 ring-2 ring-blue-400/40'
          : 'border-amber-600',
      ].join(' ')}
    >
      <div className="text-sm text-amber-100">
        <EditableNodeLabel
          nodeId={id}
          label={data.label}
          className="text-sm text-amber-100"
        />
      </div>
    </div>
  )
}
