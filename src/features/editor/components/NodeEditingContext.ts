import { createContext } from 'react'

export const NodeEditingContext = createContext<{
  editingNodeId: string | null
  setEditingNodeId: (id: string | null) => void
}>({ editingNodeId: null, setEditingNodeId: () => {} })
