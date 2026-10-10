export type FlowNodeType =
  | 'process'
  | 'decision'
  | 'input-output'
  | 'note'
  | 'checkpoint'
  | 'linked-flow'

export type FlowNodeData = {
  label: string
  description?: string
  outcomes?: { id: string; label: string }[]
  criteria?: { id: string; label: string; done: boolean }[]
  linkedBoardId?: string
}

export type FlowNode = {
  id: string
  type: FlowNodeType
  position: {
    x: number
    y: number
  }
  data: FlowNodeData
  width?: number
  height?: number
}

export type FlowEdge = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
}

export type DiagramDocument = {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export type FlowClipboard = {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export type StoredBoard = {
  id: string
  name: string
  document: DiagramDocument
  createdAt: string
  updatedAt: string
}
