export type FlowNodeType =
  | 'process'
  | 'decision'
  | 'input-output'
  | 'note'

export type FlowNodeData = {
  label: string
  description?: string
}

export type FlowNode = {
  id: string
  type: FlowNodeType
  position: {
    x: number
    y: number
  }
  data: FlowNodeData
}

export type FlowEdge = {
  id: string
  source: string
  target: string
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