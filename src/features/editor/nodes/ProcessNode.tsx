import { Handle, Position, type NodeProps } from '@xyflow/react'

type ProcessNodeData = {
  label: string
}

export function ProcessNode({ data }: NodeProps) {
  const { label } = data as ProcessNodeData

  return (
    <div className="min-w-40 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 shadow-lg">
      <Handle type="target" position={Position.Top} />

      <div className="text-sm font-medium text-slate-100">{label}</div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}