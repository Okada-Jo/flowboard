import {
  addEdge,
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  type Connection,
  type Edge,
  type NodeChange,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'

import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { nodePositionChanged } from '../editorSlice'
import { ProcessNode } from '../nodes/ProcessNode'


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
  const dispatch = useAppDispatch()

  const nodes = useAppSelector((state) => state.editor.nodes)

  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  function handleNodesChange(changes: NodeChange[]) {
    for (const change of changes) {
      if (
        change.type === 'position' &&
        change.position &&
        change.dragging !== undefined
      ) {
        dispatch(
          nodePositionChanged({
            id: change.id,
            position: change.position,
          }),
        )
      }
    }
  }

  function handleConnect(connection: Connection) {
    setEdges((currentEdges) => addEdge(connection, currentEdges))
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={handleNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      fitView
    >
      <Background />
      <Controls />
    </ReactFlow>
  )
}