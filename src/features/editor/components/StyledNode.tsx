import {
  NodeResizer,
  Handle,
  Position,
  type Node,
  type NodeProps,
} from '@xyflow/react'

import type { FlowNodeData, FlowNodeType } from '../types'
import { EditableNodeLabel } from './EditableNodeLabel'

const nodeDetails = {
  process: { title: 'Process', symbol: '▤' },
  decision: { title: 'Decision', symbol: '◇' },
  'input-output': { title: 'Input / Output', symbol: '⇄' },
  note: { title: 'Note', symbol: '✎' },
}

type StyledNodeProps = NodeProps<Node<FlowNodeData>> & {
  kind: FlowNodeType
}

export function StyledNode({ id, data, selected, kind }: StyledNodeProps) {
  const { title, symbol } = nodeDetails[kind]

  return (
    <div
      className={`flow-node flow-node--${kind}${selected ? ' is-selected' : ''}`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={kind === 'decision' ? 180 : kind === 'note' ? 148 : 100}
        color="var(--color-focus)"
        handleStyle={{ width: 10, height: 10, borderRadius: 0 }}
      />
      <div className="flow-node__surface" />
      <Handle type="target" position={Position.Top} />
      <div className="flow-node__content">
        <div className="flow-node__type">
          <span aria-hidden="true">{symbol}</span>
          {title}
        </div>
        <EditableNodeLabel
          nodeId={id}
          label={data.label}
          className="flow-node__label"
        />
        {data.description && (
          <p className="flow-node__description">{data.description}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
