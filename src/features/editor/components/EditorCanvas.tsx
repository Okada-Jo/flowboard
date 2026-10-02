import {
  Background,
  Controls,
  ReactFlow,
  Panel,
  useReactFlow,
  ReactFlowProvider,
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
  nodeAdded,
  nodeDeleted,
} from '../editorSlice'
import { ProcessNode } from '../nodes/ProcessNode'


const nodeTypes = {
  process: ProcessNode,
}

function EditorCanvasInner() {
  const dispatch = useAppDispatch()
  const { screenToFlowPosition } = useReactFlow()

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
      if (change.type === 'remove') {
        dispatch(nodeDeleted(change.id))
      }
    }
  }

  function handleAddProcessNode() {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })

    dispatch(
      nodeAdded({
        id: crypto.randomUUID(),
        type: 'process',
        position,
        data: {
          label: 'New Process',
        },
      }),
    )
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
      <Panel position="top-left">
        <button
          type="button"
          onClick={handleAddProcessNode}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
        >
          + Process
        </button>
      </Panel>
    </ReactFlow>
  )
}

export function EditorCanvas() {
  return (
    <ReactFlowProvider>
      <EditorCanvasInner />
    </ReactFlowProvider>
  )
}