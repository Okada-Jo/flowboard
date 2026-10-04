import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'

import type { FlowNodeData } from '../types'
import { EditableNodeLabel } from '../components/EditableNodeLabel'

export function InputOutputNode({ id, data }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className="relative min-w-44 skew-x-12 border border-slate-600 bg-slate-800 px-6 py-3 shadow-lg">
      <Handle type="target" position={Position.Top} />

      <div className="skew-x-12 text-center">
        <EditableNodeLabel
          nodeId={id}
          label={data.label}
          className="text-sm font-medium text-slate-100"
        />
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
