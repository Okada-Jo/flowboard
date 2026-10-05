import { useCallback, useRef, useState } from 'react'

import { NodeEditingContext } from './NodeEditingContext'
import { CanvasContextMenu } from './CanvasContextMenu'
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
  nodeTypeChanged,
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

type EditorCanvasProps = { onExport: () => void }

function EditorCanvasInner({ onExport }: EditorCanvasProps) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const isDraggingRef = useRef(false)
  const [contextMenu, setContextMenu] = useState<{
    nodeId?: string
    x: number
    y: number
    position: { x: number; y: number }
  } | null>(null)
  const closeContextMenu = useCallback(() => setContextMenu(null), [])

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

  const selectionCount = selectedNodeIds.length + selectedEdgeIds.length

  const canvasNodes = nodes.map((node) => ({
    ...node,
    selected: selectedNodeIds.includes(node.id),
  }))

  const canvasEdges = edges.map((edge) => {
    const selected = selectedEdgeIds.includes(edge.id)

    return {
      ...edge,
      selected,
      style: {
        stroke: selected ? 'var(--color-edge-selected)' : 'var(--color-edge)',
        strokeWidth: selected ? 2.5 : 1.5,
      },
    }
  })

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
    position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }),
  ) {
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
    <NodeEditingContext.Provider value={{ editingNodeId, setEditingNodeId }}>
      <ReactFlow
        className="flow-canvas"
        colorMode="light"
        nodes={canvasNodes}
        edges={canvasEdges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onPaneContextMenu={(event) => {
          event.preventDefault()
          setContextMenu({
            x: event.clientX,
            y: event.clientY,
            position: screenToFlowPosition({
              x: event.clientX,
              y: event.clientY,
            }),
          })
        }}
        onNodeContextMenu={(event, node) => {
          if ((event.target as HTMLElement).closest('input, textarea')) return
          event.preventDefault()
          event.stopPropagation()
          setContextMenu({
            x: event.clientX,
            y: event.clientY,
            nodeId: node.id,
            position: node.position,
          })
        }}
        onMoveStart={closeContextMenu}
        deleteKeyCode={null}
        fitView
      >
        <Background gap={24} size={1} color="var(--color-grid)" />
        <Controls />
        {contextMenu && (
          <CanvasContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            key={contextMenu.nodeId ?? 'pane'}
            onClose={closeContextMenu}
            node={
              contextMenu.nodeId
                ? (() => {
                    const node = nodes.find(
                      (item) => item.id === contextMenu.nodeId,
                    )
                    return node
                      ? {
                          type: node.type,
                          selected: selectedNodeIds.includes(node.id),
                        }
                      : undefined
                  })()
                : undefined
            }
            onExport={() => {
              closeContextMenu()
              onExport()
            }}
            onTypeChange={(type) => {
              if (contextMenu.nodeId)
                dispatch(nodeTypeChanged({ id: contextMenu.nodeId, type }))
              closeContextMenu()
            }}
            onRename={() => {
              setEditingNodeId(contextMenu.nodeId ?? null)
              closeContextMenu()
            }}
            onSelect={() => {
              if (contextMenu.nodeId)
                dispatch(
                  nodeSelectionChanged({
                    id: contextMenu.nodeId,
                    selected: true,
                  }),
                )
              closeContextMenu()
            }}
            onAdd={(type, label) => {
              handleAddNode(type, label, contextMenu.position)
              closeContextMenu()
            }}
          />
        )}

        <Panel position="top-left">
          <div className="node-toolbar">
            <button
              type="button"
              onClick={() => handleAddNode('process', 'New Process')}
              className="tool-button"
            >
              <span className="tool-symbol process-color" aria-hidden="true">
                ▤
              </span>{' '}
              Process
            </button>

            <button
              type="button"
              onClick={() => handleAddNode('decision', 'Decision?')}
              className="tool-button"
            >
              <span className="tool-symbol decision-color" aria-hidden="true">
                ◇
              </span>{' '}
              Decision
            </button>

            <button
              type="button"
              onClick={() => handleAddNode('input-output', 'Input / Output')}
              className="tool-button"
            >
              <span className="tool-symbol io-color" aria-hidden="true">
                ⇄
              </span>{' '}
              Input / Output
            </button>

            <button
              type="button"
              onClick={() => handleAddNode('note', 'Note')}
              className="tool-button"
            >
              <span className="tool-symbol note-color" aria-hidden="true">
                ✎
              </span>{' '}
              Note
            </button>

            <button
              type="button"
              onClick={() => dispatch(undo())}
              className="tool-button"
            >
              Undo
            </button>

            <button
              type="button"
              onClick={() => dispatch(redo())}
              className="tool-button"
            >
              Redo
            </button>
            {selectionCount > 0 && (
              <span className="selection-count">{selectionCount} selected</span>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </NodeEditingContext.Provider>
  )
}

export function EditorCanvas(props: EditorCanvasProps) {
  return (
    <ReactFlowProvider>
      <EditorCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
