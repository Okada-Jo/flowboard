import { useThemePreference } from '../../../theme/theme'
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
  nodeDimensionsChanged,
  nodeSelectionChanged,
  redo,
  undo,
} from '../editorSlice'
import { CheckpointNode } from '../nodes/CheckpointNode'
import { LinkedFlowNode } from '../nodes/LinkedFlowNode'
import { nodeCatalog, outcomesFor, checkpointReady } from '../nodeCatalog'
import {
  FlowNavigationContext,
  type FlowNavigation,
} from './FlowNavigationContext'
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
  checkpoint: CheckpointNode,
  'linked-flow': LinkedFlowNode,
}

type EditorCanvasProps = { onExport: () => void; navigation?: FlowNavigation }

function EditorCanvasInner({ onExport, navigation }: EditorCanvasProps) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const isDraggingRef = useRef(false)
  const isResizingRef = useRef(false)
  const [contextMenu, setContextMenu] = useState<{
    nodeId?: string
    x: number
    y: number
    position: { x: number; y: number }
  } | null>(null)
  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const theme = useThemePreference()

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
    dragHandle: '.node-drag-handle',
    selected: selectedNodeIds.includes(node.id),
  }))

  const canvasEdges = edges.map((edge) => {
    const selected = selectedEdgeIds.includes(edge.id)
    const source = nodes.find((node) => node.id === edge.source)
    const target = nodes.find((node) => node.id === edge.target)
    const attachment = source?.type === 'note' || target?.type === 'note'
    const waiting =
      source?.type === 'checkpoint' && !checkpointReady(source.data)
    const outcome =
      source?.type === 'decision'
        ? outcomesFor(source.data).find((item) => item.id === edge.sourceHandle)
            ?.label
        : undefined

    return {
      ...edge,
      label: attachment
        ? 'Note'
        : (outcome ?? (waiting ? 'Not ready' : edge.label)),
      selected,
      style: {
        stroke: selected ? 'var(--color-edge-selected)' : 'var(--color-edge)',
        strokeWidth: selected ? 2.5 : 1.5,
        strokeDasharray: attachment ? '3 5' : waiting ? '8 5' : undefined,
        opacity: waiting ? 0.6 : 1,
      },
    }
  })

  function handleNodesChange(changes: NodeChange[]) {
    // Start before applying position changes from the top/left resize handles.
    if (
      changes.some(
        (change) => change.type === 'dimensions' && change.resizing === true,
      ) &&
      !isResizingRef.current
    ) {
      isResizingRef.current = true
      dispatch(historyTransactionStarted())
    }

    for (const change of changes) {
      // Ignore automatic DOM measurements; only explicit resizing is saved.
      if (
        change.type === 'dimensions' &&
        change.resizing !== undefined &&
        change.dimensions
      ) {
        dispatch(nodeDimensionsChanged({ id: change.id, ...change.dimensions }))
      }

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

    if (
      isResizingRef.current &&
      changes.some(
        (change) => change.type === 'dimensions' && change.resizing === false,
      )
    ) {
      isResizingRef.current = false
      dispatch(historyTransactionCommitted())
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
        ...(connection.sourceHandle
          ? { sourceHandle: connection.sourceHandle }
          : {}),
        ...(connection.targetHandle
          ? { targetHandle: connection.targetHandle }
          : {}),
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
    const id = crypto.randomUUID()
    dispatch(
      nodeAdded({
        id,
        type,
        position,
        data: {
          label,
        },
      }),
    )
    dispatch(nodeSelectionChanged({ id, selected: true }))
    setEditingNodeId(id)
  }

  return (
    <FlowNavigationContext.Provider value={navigation ?? { boards: [] }}>
      <NodeEditingContext.Provider value={{ editingNodeId, setEditingNodeId }}>
        <ReactFlow
          className="flow-canvas"
          colorMode={theme}
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
              {nodeCatalog.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  title={item.hint}
                  onClick={() => handleAddNode(item.type, item.label)}
                  className="tool-button"
                >
                  <span className="tool-symbol" aria-hidden="true">
                    {item.symbol}
                  </span>{' '}
                  {item.name}
                </button>
              ))}

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
                <span className="selection-count">
                  {selectionCount} selected
                </span>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </NodeEditingContext.Provider>
    </FlowNavigationContext.Provider>
  )
}

export function EditorCanvas(props: EditorCanvasProps) {
  return (
    <ReactFlowProvider>
      <EditorCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
