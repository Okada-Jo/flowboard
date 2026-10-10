import { z } from 'zod'

const outcomeSchema = z.object({ id: z.string().min(1), label: z.string() })
const nodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'process',
    'decision',
    'input-output',
    'note',
    'checkpoint',
    'linked-flow',
  ]),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({
    label: z.string(),
    description: z.string().optional(),
    outcomes: z.array(outcomeSchema).min(2).optional(),
    criteria: z.array(outcomeSchema.extend({ done: z.boolean() })).optional(),
    linkedBoardId: z.string().optional(),
  }),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
})
const edgeSchema = z.object({
  id: z.string().min(1),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  label: z.string().optional(),
})
const boardSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1),
    nodes: z.array(nodeSchema),
    edges: z.array(edgeSchema),
  })
  .superRefine((board, ctx) => {
    const nodes = new Map(board.nodes.map((node) => [node.id, node]))
    if (
      nodes.size !== board.nodes.length ||
      new Set(board.edges.map((edge) => edge.id)).size !== board.edges.length
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Node and connection IDs must be unique',
      })
    }
    for (const node of board.nodes) {
      for (const items of [node.data.outcomes, node.data.criteria]) {
        if (
          items &&
          new Set(items.map((item) => item.id)).size !== items.length
        )
          ctx.addIssue({
            code: 'custom',
            message: 'Item IDs must be unique within a node',
          })
      }
    }
    board.edges.forEach((edge, index) => {
      if (!nodes.has(edge.source) || !nodes.has(edge.target))
        ctx.addIssue({
          code: 'custom',
          path: ['edges', index],
          message: 'Connection refers to a missing node',
        })
      const source = nodes.get(edge.source)
      if (
        source?.type === 'decision' &&
        edge.sourceHandle &&
        !(source.data.outcomes ?? [{ id: 'yes' }, { id: 'no' }]).some(
          (item) => item.id === edge.sourceHandle,
        )
      )
        ctx.addIssue({
          code: 'custom',
          path: ['edges', index, 'sourceHandle'],
          message: 'Connection refers to a missing outcome',
        })
    })
  })

export const flowboardFileSchema = z
  .object({
    version: z.union([z.literal(1), z.literal(2)]),
    board: boardSchema,
    linkedBoards: z
      .array(boardSchema.safeExtend({ id: z.string().min(1) }))
      .optional(),
  })
  .superRefine((file, ctx) => {
    const ids = [
      file.board.id,
      ...(file.linkedBoards ?? []).map((board) => board.id),
    ].filter(Boolean)
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: 'custom', message: 'Board IDs must be unique' })
  })
export type FlowboardFile = z.infer<typeof flowboardFileSchema>
