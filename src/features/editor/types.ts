export type FlowNodeType =
  | 'process'
  | 'decision'
  | 'input-output'
  | 'note'

export type FlowNode = {
  id: string
  type: FlowNodeType
  position: {
    x: number
    y: number
  }
  data: {
    label: string
    description?: string
  }
}

export type FlowEdge = {
  id: string
  source: string
  target: string
}