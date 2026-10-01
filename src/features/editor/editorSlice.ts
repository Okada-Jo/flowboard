import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FlowEdge, FlowNode } from './types'

type EditorState = {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

const initialState: EditorState = {
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
  },
})

export const { nodePositionChanged } = editorSlice.actions

export default editorSlice.reducer