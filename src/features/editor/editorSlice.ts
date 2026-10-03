import { createSlice, current, type PayloadAction } from '@reduxjs/toolkit'
import type { DiagramDocument, FlowEdge, FlowNode } from './types'

type EditorState = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedNodeIds: string[]

  historyTransactionActive: boolean
  transactionStart: DiagramDocument | null

  past: DiagramDocument[]
  future: DiagramDocument[]
}

const initialState: EditorState = {
  selectedNodeIds: [],
  historyTransactionActive: false,
  transactionStart: null,
  past: [],
  future: [],
  nodes: [
    {
      id: '1',
      type: 'process',
      position: { x: 100, y: 100 },
      data: {
        label: 'User Signup',
      },
    },
    {
      id: '2',
      type: 'process',
      position: { x: 400, y: 250 },
      data: {
        label: 'Email verified?',
      },
    },
  ],
  edges: [
    {
      id: '1-2',
      source: '1',
      target: '2',
    },
  ],
}

function snapshotDocument(state: EditorState): DiagramDocument {
  const snapshot = current(state)

  return {
    nodes: snapshot.nodes,
    edges: snapshot.edges,
  }
}

function recordHistory(state: EditorState) {
  if (state.historyTransactionActive) {
    return
  }

  state.past.push(snapshotDocument(state))
  state.future = []
}

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    nodePositionChanged(
      state,
      action: PayloadAction<{
        id: string
        position: { x: number; y: number }
      }>,
    ) {
      const node = state.nodes.find((node) => node.id === action.payload.id)

      if (!node) {
        return
      }

      node.position = action.payload.position
    },
    nodeSelectionChanged(
      state,
      action: PayloadAction<{
        id: string
        selected: boolean
      }>,
    ) {
      const { id, selected } = action.payload

      if (selected) {
        if (!state.selectedNodeIds.includes(id)) {
          state.selectedNodeIds.push(id)
        }
      } else {
        state.selectedNodeIds = state.selectedNodeIds.filter(
          (nodeId) => nodeId !== id,
        )
      }
    },
    edgeAdded(
      state,
      action: PayloadAction<FlowEdge>,
    ) {
      recordHistory(state)
      state.edges.push(action.payload)
    },
    edgeDeleted(
      state,
      action: PayloadAction<string>,
    ) {
      if (!state.edges.some((edge) => edge.id === action.payload)) {
        return
      }

      recordHistory(state)

      state.edges = state.edges.filter(
        (edge) => edge.id !== action.payload,
      )
    },
    nodeAdded(
      state,
      action: PayloadAction<FlowNode>,
    ) {
      recordHistory(state)
      state.nodes.push(action.payload)
    },
    nodeDeleted(
      state,
      action: PayloadAction<string>,
    ) {
      const nodeId = action.payload

      if (!state.nodes.some((node) => node.id === nodeId)) {
        return
      }

      recordHistory(state)

      state.nodes = state.nodes.filter(
        (node) => node.id !== nodeId,
      )

      state.edges = state.edges.filter(
        (edge) =>
          edge.source !== nodeId &&
          edge.target !== nodeId,
      )

      state.selectedNodeIds = state.selectedNodeIds.filter(
        (id) => id !== nodeId,
      )
    },
    nodeLabelChanged(
      state,
      action: PayloadAction<{
        id: string
        label: string
      }>,
    ) {
      const node = state.nodes.find(
        (node) => node.id === action.payload.id,
      )

      if (!node || node.data.label === action.payload.label) {
        return
      }

      recordHistory(state)

      node.data.label = action.payload.label
    },
    historyTransactionStarted(state) {
      if (state.historyTransactionActive) {
        return
      }

      state.historyTransactionActive = true
      state.transactionStart = snapshotDocument(state)
    },

    historyTransactionCommitted(state) {
      if (!state.historyTransactionActive || !state.transactionStart) {
        return
      }

      state.past.push(state.transactionStart)
      state.future = []

      state.historyTransactionActive = false
      state.transactionStart = null
    },
    undo(state) {
      const previous = state.past.pop()

      if (!previous) {
        return
      }

      state.future.push(snapshotDocument(state))

      state.nodes = previous.nodes
      state.edges = previous.edges

      state.selectedNodeIds = []
    },
    redo(state) {
      const next = state.future.pop()

      if (!next) {
        return
      }

      state.past.push(snapshotDocument(state))

      state.nodes = next.nodes
      state.edges = next.edges

      state.selectedNodeIds = []
    },
  },
})

export const { undo, redo, nodePositionChanged, historyTransactionStarted, historyTransactionCommitted, nodeLabelChanged, nodeDeleted, nodeSelectionChanged, edgeAdded, edgeDeleted, nodeAdded } = editorSlice.actions

export default editorSlice.reducer