import { createSlice, current, type PayloadAction } from '@reduxjs/toolkit'
import type {
  DiagramDocument,
  FlowClipboard,
  FlowEdge,
  FlowNode,
  FlowNodeType,
} from './types'

type EditorState = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedNodeIds: string[]
  historyTransactionActive: boolean
  transactionStart: DiagramDocument | null
  past: DiagramDocument[]
  future: DiagramDocument[]
  selectedEdgeIds: string[]
  clipboard: FlowClipboard | null
}

type DuplicateSelectionPayload = {
  nodeIds: Record<string, string>
  edgeIds: Record<string, string>
}

type PasteClipboardPayload = {
  nodeIds: Record<string, string>
  edgeIds: Record<string, string>
}

const initialState: EditorState = {
  selectedNodeIds: [],
  historyTransactionActive: false,
  transactionStart: null,
  past: [],
  future: [],
  selectedEdgeIds: [],
  clipboard: null,
  nodes: [],
  edges: [],
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
    edgeAdded(state, action: PayloadAction<FlowEdge>) {
      recordHistory(state)
      state.edges.push(action.payload)
    },
    edgeDeleted(state, action: PayloadAction<string>) {
      if (!state.edges.some((edge) => edge.id === action.payload)) {
        return
      }

      recordHistory(state)

      state.edges = state.edges.filter((edge) => edge.id !== action.payload)

      state.selectedEdgeIds = state.selectedEdgeIds.filter(
        (id) => id !== action.payload,
      )
    },
    nodeAdded(state, action: PayloadAction<FlowNode>) {
      recordHistory(state)
      state.nodes.push(action.payload)
    },
    nodeDeleted(state, action: PayloadAction<string>) {
      const nodeId = action.payload

      if (!state.nodes.some((node) => node.id === nodeId)) {
        return
      }

      recordHistory(state)

      state.nodes = state.nodes.filter((node) => node.id !== nodeId)

      state.edges = state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      )

      state.selectedNodeIds = state.selectedNodeIds.filter(
        (id) => id !== nodeId,
      )
    },
    nodeTypeChanged(
      state,
      action: PayloadAction<{ id: string; type: FlowNodeType }>,
    ) {
      const node = state.nodes.find((node) => node.id === action.payload.id)
      if (!node || node.type === action.payload.type) return
      recordHistory(state)
      node.type = action.payload.type
    },
    nodeLabelChanged(
      state,
      action: PayloadAction<{
        id: string
        label: string
      }>,
    ) {
      const node = state.nodes.find((node) => node.id === action.payload.id)

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
      state.selectedEdgeIds = []
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
      state.selectedEdgeIds = []
    },
    edgeSelectionChanged(
      state,
      action: PayloadAction<{
        id: string
        selected: boolean
      }>,
    ) {
      const { id, selected } = action.payload

      if (selected) {
        if (!state.selectedEdgeIds.includes(id)) {
          state.selectedEdgeIds.push(id)
        }
      } else {
        state.selectedEdgeIds = state.selectedEdgeIds.filter(
          (edgeId) => edgeId !== id,
        )
      }
    },
    selectionDeleted(state) {
      const selectedNodeIds = new Set(state.selectedNodeIds)
      const selectedEdgeIds = new Set(state.selectedEdgeIds)

      if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) {
        return
      }

      recordHistory(state)

      state.nodes = state.nodes.filter((node) => !selectedNodeIds.has(node.id))

      state.edges = state.edges.filter(
        (edge) =>
          !selectedEdgeIds.has(edge.id) &&
          !selectedNodeIds.has(edge.source) &&
          !selectedNodeIds.has(edge.target),
      )

      state.selectedNodeIds = []
      state.selectedEdgeIds = []
    },
    duplicateSelection(
      state,
      action: PayloadAction<DuplicateSelectionPayload>,
    ) {
      if (state.selectedNodeIds.length === 0) {
        return
      }

      recordHistory(state)

      const selectedIds = new Set(state.selectedNodeIds)

      const duplicatedNodes = state.nodes
        .filter((node) => selectedIds.has(node.id))
        .map((node) => ({
          ...node,
          id: action.payload.nodeIds[node.id],
          position: {
            x: node.position.x + 40,
            y: node.position.y + 40,
          },
        }))

      const duplicatedEdges = state.edges
        .filter(
          (edge) =>
            selectedIds.has(edge.source) && selectedIds.has(edge.target),
        )
        .map((edge) => ({
          ...edge,
          id: action.payload.edgeIds[edge.id],
          source: action.payload.nodeIds[edge.source],
          target: action.payload.nodeIds[edge.target],
        }))

      state.nodes.push(...duplicatedNodes)
      state.edges.push(...duplicatedEdges)

      state.selectedNodeIds = duplicatedNodes.map((node) => node.id)
      state.selectedEdgeIds = []
    },
    selectionCopied(state) {
      if (state.selectedNodeIds.length === 0) {
        return
      }

      const selectedIds = new Set(state.selectedNodeIds)

      state.clipboard = {
        nodes: state.nodes.filter((node) => selectedIds.has(node.id)),
        edges: state.edges.filter(
          (edge) =>
            selectedIds.has(edge.source) && selectedIds.has(edge.target),
        ),
      }
    },
    clipboardPasted(state, action: PayloadAction<PasteClipboardPayload>) {
      if (!state.clipboard || state.clipboard.nodes.length === 0) {
        return
      }

      recordHistory(state)

      const pastedNodes = state.clipboard.nodes.map((node) => ({
        ...node,
        id: action.payload.nodeIds[node.id],
        position: {
          x: node.position.x + 40,
          y: node.position.y + 40,
        },
      }))

      const pastedEdges = state.clipboard.edges.map((edge) => ({
        ...edge,
        id: action.payload.edgeIds[edge.id],
        source: action.payload.nodeIds[edge.source],
        target: action.payload.nodeIds[edge.target],
      }))

      state.nodes.push(...pastedNodes)
      state.edges.push(...pastedEdges)

      state.selectedNodeIds = pastedNodes.map((node) => node.id)
      state.selectedEdgeIds = []
    },
    boardLoaded(state, action: PayloadAction<DiagramDocument>) {
      state.nodes = action.payload.nodes
      state.edges = action.payload.edges

      state.selectedNodeIds = []
      state.selectedEdgeIds = []

      state.past = []
      state.future = []

      state.historyTransactionActive = false
      state.transactionStart = null
    },
    selectAll(state) {
      state.selectedNodeIds = state.nodes.map((node) => node.id)
      state.selectedEdgeIds = state.edges.map((edge) => edge.id)
    },
    selectionCleared(state) {
      state.selectedNodeIds = []
      state.selectedEdgeIds = []
    },
  },
})

export const {
  undo,
  boardLoaded,
  selectionCopied,
  clipboardPasted,
  duplicateSelection,
  edgeSelectionChanged,
  selectionDeleted,
  redo,
  nodePositionChanged,
  historyTransactionStarted,
  historyTransactionCommitted,
  nodeLabelChanged,
  nodeTypeChanged,
  nodeDeleted,
  nodeSelectionChanged,
  edgeAdded,
  edgeDeleted,
  nodeAdded,
  selectAll,
  selectionCleared,
} = editorSlice.actions

export default editorSlice.reducer
