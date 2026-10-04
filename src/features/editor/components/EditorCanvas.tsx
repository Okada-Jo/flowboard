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
  edgeSelectionChanged,
  historyTransactionCommitted,
  historyTransactionStarted,
  nodeAdded,
  nodeDeleted,
  nodePositionChanged,
  nodeSelectionChanged,
  redo,
  undo,
} from '../editorSlice'
import { ProcessNode } from '../nodes/ProcessNode'
import { useEditorShortcuts } from '../shortcuts/useEditorShortcuts'
import { NoteNode } from '../nodes/NoteNode'
import { InputOutputNode } from '../nodes/InputOutputNode'
import { DecisionNode } from '../nodes/DecisionNode'
import type { FlowNodeType } from '../types'

const nodeTypes = {
  process: ProcessNode,
  decision: DecisionNode,
  'input-output': InputOutputNode,
  note: NoteNode,
}

function EditorCanvasInner() {
  const isDraggingRef = useRef(false)

  useEditorShortcuts()

  const dispatch = useAppDispatch()
  const { screenToFlowPosition } = useReactFlow()

  const nodes = useAppSelector((state) => state.editor.nodes)
  const edges = useAppSelector((state) => state.editor.edges)
  const selectedNodeIds = useAppSelector(
    (state) => state.editor.selectedNodeIds,
  )
  const selectedEdgeIds = useAppSelector(
    (state) => state.editor.selectedEdgeIds,
  )

  const canvasNodes = nodes.map((node) => ({
    ...node,
    selected: selectedNodeIds.includes(node.id),
  }))

  const canvasEdges = edges.map((edge) => ({
    ...edge,
    selected: selectedEdgeIds.includes(edge.id),
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
        if (change.type === 'select') {
          dispatch(
            edgeSelectionChanged({
              id: change.id,
              selected: change.selected,
            }),
          )
        }

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

  function handleAddNode(
    type: FlowNodeType,
    label: string,
  ) {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })

    dispatch(
      nodeAdded({
        id: crypto.randomUUID(),
        type,
        position,
        data: {
          label,
        },
      }),
    )
  }

  return (
    <ReactFlow
      nodes={canvasNodes}
      edges={canvasEdges}
      nodeTypes={nodeTypes}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onConnect={handleConnect}
      fitView
    >
      <Background />
      <Controls />

      <Panel position="top-left">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleAddNode('process', 'New Process')}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
          >
            Process
          </button>

          <button
            type="button"
            onClick={() => handleAddNode('decision', 'Decision?')}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
          >
            Decision
          </button>

          <button
            type="button"
            onClick={() => handleAddNode('input-output', 'Input / Output')}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
          >
            Input / Output
          </button>

          <button
            type="button"
            onClick={() => handleAddNode('note', 'Note')}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
          >
            Note
          </button>

          <button
            type="button"
            onClick={() => dispatch(undo())}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
          >
            Undo
          </button>

          <button
            type="button"
            onClick={() => dispatch(redo())}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
          >
            Redo
          </button>
        </div>
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