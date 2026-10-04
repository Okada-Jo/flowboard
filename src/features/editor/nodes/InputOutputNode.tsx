import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'

import type { FlowNodeData } from '../types'
import { EditableNodeLabel } from '../components/EditableNodeLabel'

export function InputOutputNode({
  id,
  data,
  selected,
}: NodeProps<Node<FlowNodeData>>) {
  return (
    <div
      className={[
        'relative min-w-44 skew-x-12 border bg-slate-800 px-6 py-3 shadow-lg',
        selected
          ? 'border-blue-400 ring-2 ring-blue-400/40'
          : 'border-slate-600',
      ].join(' ')}
    >
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
