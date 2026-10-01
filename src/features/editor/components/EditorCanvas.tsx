import {
  addEdge,
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'
import { ProcessNode } from '../nodes/ProcessNode'


const initialNodes: Node[] = [
  {
    id: '1',
    type: 'process',
    position: { x: 100, y: 100 },
    data: { label: 'User Signup' },
  },
  {
    id: '2',
    type: 'process',
    position: { x: 400, y: 250 },
    data: { label: 'Email verified?' },
  },
]

const initialEdges: Edge[] = [
  {
    id: '1-2',
    source: '1',
    target: '2',
  },
]

const nodeTypes = {
  process: ProcessNode,
}

export function EditorCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  function handleConnect(connection: Connection) {
    setEdges((currentEdges) => addEdge(connection, currentEdges))
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      fitView
    >
      <Background />
      <Controls />
    </ReactFlow>
  )
}