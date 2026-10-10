import type { FlowNodeData, FlowNodeType } from './types'

export const nodeCatalog = [
  {
    type: 'process',
    name: 'Step',
    label: 'Untitled step',
    symbol: '▤',
    hint: 'Describe something that happens',
  },
  {
    type: 'decision',
    name: 'Decision',
    label: 'What happens next?',
    symbol: '◇',
    hint: 'Choose between labelled routes',
  },
  {
    type: 'note',
    name: 'Note',
    label: '',
    symbol: '✎',
    hint: 'Add context without changing the route',
  },
  {
    type: 'checkpoint',
    name: 'Checkpoint',
    label: 'Ready to continue?',
    symbol: '☑',
    hint: 'Track what must be ready first',
  },
  {
    type: 'linked-flow',
    name: 'Linked flow',
    label: 'Explore a flow',
    symbol: '↗',
    hint: 'Open a detailed process on another board',
  },
] satisfies {
  type: FlowNodeType
  name: string
  label: string
  symbol: string
  hint: string
}[]

export function outcomesFor(data: FlowNodeData) {
  return (
    data.outcomes ?? [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ]
  )
}
export function checkpointReady(data: FlowNodeData) {
  return Boolean(
    data.criteria?.length && data.criteria.every((item) => item.done),
  )
}
