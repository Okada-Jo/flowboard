import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FlowEdge, FlowNode } from './types'

type EditorState = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedNodeIds: string[]
}

const initialState: EditorState = {
  selectedNodeIds: [],
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
      state.edges.push(action.payload)
    },
    edgeDeleted(
      state,
      action: PayloadAction<string>,
    ) {
      state.edges = state.edges.filter(
        (edge) => edge.id !== action.payload,
      )
    },
    nodeAdded(
      state,
      action: PayloadAction<FlowNode>,
    ) {
      state.nodes.push(action.payload)
    },
    nodeDeleted(
      state,
      action: PayloadAction<string>,
    ) {
      const nodeId = action.payload

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

      if (!node) {
        return
      }

      node.data.label = action.payload.label
    },
  },
})

export const { nodePositionChanged, nodeLabelChanged, nodeDeleted, nodeSelectionChanged, edgeAdded, edgeDeleted, nodeAdded } = editorSlice.actions

export default editorSlice.reducer