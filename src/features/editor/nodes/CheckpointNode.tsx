import type { Node, NodeProps } from '@xyflow/react'
import type { FlowNodeData } from '../types'
import { StyledNode } from '../components/StyledNode'
export function CheckpointNode(props: NodeProps<Node<FlowNodeData>>) {
  return <StyledNode {...props} kind="checkpoint" />
}
