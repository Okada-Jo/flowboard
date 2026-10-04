import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'

import type { FlowNodeData } from '../types'
import { EditableNodeLabel } from '../components/EditableNodeLabel'

export function DecisionNode({
  id,
  data,
  selected,
}: NodeProps<Node<FlowNodeData>>) {
  return (
    <div
      className={[
        'relative flex h-32 w-32 rotate-45 items-center justify-center border bg-slate-800 shadow-lg',
        selected
          ? 'border-blue-400 ring-2 ring-blue-400/40'
          : 'border-slate-600',
      ].join(' ')}
    >
      <Handle type="target" position={Position.Top} />

      <div className="-rotate-45 px-3 text-center">
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
