import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'

import type { FlowNodeData } from '../types'
import { EditableNodeLabel } from '../components/EditableNodeLabel'

export function ProcessNode({
  id,
  data,
  selected,
}: NodeProps<Node<FlowNodeData>>) {
  return (
    <div
      className={[
        'min-w-40 rounded-lg border bg-slate-800 px-4 py-3',
        selected
          ? 'border-blue-400 ring-2 ring-blue-400/40'
          : 'border-slate-600',
      ].join(' ')}
    >
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
