import {
  Handle,
  Position,
  type Node,
  type NodeProps,
} from '@xyflow/react'

import type { FlowNodeData } from '../types'
import { EditableNodeLabel } from '../components/EditableNodeLabel'

export function DecisionNode({
  id,
  data,
}: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className="relative flex h-32 w-32 rotate-45 items-center justify-center border border-slate-600 bg-slate-800 shadow-lg">
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