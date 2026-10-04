import type { Node, NodeProps } from '@xyflow/react'

import type { FlowNodeData } from '../types'
import { EditableNodeLabel } from '../components/EditableNodeLabel'

export function NoteNode({ id, data }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className="min-w-40 max-w-64 rounded-sm border border-amber-700/50 bg-amber-950/70 px-4 py-3 shadow-lg">
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
