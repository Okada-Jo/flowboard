import {
  Background,
  Controls,
  ReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'

import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import {
  edgeAdded,
  edgeDeleted,
  nodePositionChanged,
  nodeSelectionChanged,
} from '../editorSlice'
import { ProcessNode } from '../nodes/ProcessNode'


const nodeTypes = {
  process: ProcessNode,
}

export function EditorCanvas() {
  const dispatch = useAppDispatch()

  const nodes = useAppSelector((state) => state.editor.nodes)
  const edges = useAppSelector((state) => state.editor.edges)
  const selectedNodeIds = useAppSelector(
    (state) => state.editor.selectedNodeIds,
  )

  const canvasNodes = nodes.map((node) => ({
    ...node,
    selected: selectedNodeIds.includes(node.id),
  }))


  function handleNodesChange(changes: NodeChange[]) {
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        dispatch(
          nodePositionChanged({
            id: change.id,
            position: change.position,
          }),
        )
      }

      if (change.type === 'select') {
        dispatch(
          nodeSelectionChanged({
            id: change.id,
            selected: change.selected,
          }),
        )
      }
    }
  }

  function handleConnect(connection: Connection) {
    if (!connection.source || !connection.target) {
      return
    }

    dispatch(
      edgeAdded({
        id: crypto.randomUUID(),
        source: connection.source,
        target: connection.target,
      }),
    )
  }

  function handleEdgesChange(changes: EdgeChange[]) {
    for (const change of changes) {
      if (change.type === 'remove') {
        dispatch(edgeDeleted(change.id))
      }
    }
  }
  

  return (
    <ReactFlow
      nodes={canvasNodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onConnect={handleConnect}
      fitView
    >
      <Background />
      <Controls />
    </ReactFlow>
  )
}