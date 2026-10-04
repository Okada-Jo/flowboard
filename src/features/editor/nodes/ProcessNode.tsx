import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'

import type { FlowNodeData } from '../types'
import { EditableNodeLabel } from '../components/EditableNodeLabel'

export function ProcessNode({ id, data }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className="min-w-40 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 shadow-lg">
      <Handle type="target" position={Position.Top} />

      <EditableNodeLabel
        nodeId={id}
        label={data.label}
        className="text-sm font-medium text-slate-100"
      />

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
