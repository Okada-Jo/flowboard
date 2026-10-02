import { useRef } from 'react'
import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'

import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import {
  edgeAdded,
  edgeDeleted,
  historyTransactionCommitted,
  historyTransactionStarted,
  nodeAdded,
  nodeDeleted,
  nodePositionChanged,
  nodeSelectionChanged,
} from '../editorSlice'
import { ProcessNode } from '../nodes/ProcessNode'

const nodeTypes = {
  process: ProcessNode,
}

function EditorCanvasInner() {
  const isDraggingRef = useRef(false)

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
        if (change.dragging && !isDraggingRef.current) {
          isDraggingRef.current = true
          dispatch(historyTransactionStarted())
        }

        dispatch(
          nodePositionChanged({
            id: change.id,
            position: change.position,
          }),
        )

        if (change.dragging === false && isDraggingRef.current) {
          isDraggingRef.current = false
          dispatch(historyTransactionCommitted())
        }
      }

      if (change.type === 'select') {
        dispatch(
          nodeSelectionChanged({
            id: change.id,
            selected: change.selected,
          }),
        )
      }

      if (change.type === 'remove') {
        dispatch(nodeDeleted(change.id))
      }
    }
  }

  function handleEdgesChange(changes: EdgeChange[]) {
    for (const change of changes) {
      if (change.type === 'remove') {
        dispatch(edgeDeleted(change.id))
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