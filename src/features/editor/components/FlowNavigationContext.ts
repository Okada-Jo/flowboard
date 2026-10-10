import { createContext } from 'react'
import type { StoredBoard } from '../types'

export type FlowNavigation = {
  boardId?: string
  boards: StoredBoard[]
  onOpen?: (id: string) => Promise<void>
  onCreate?: (nodeId: string, name: string) => Promise<void>
}
export const FlowNavigationContext = createContext<FlowNavigation>({
  boards: [],
})
