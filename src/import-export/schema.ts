import { z } from 'zod'

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

const nodeDataSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
})

const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(['process', 'decision', 'input-output', 'note']),
  position: positionSchema,
  data: nodeDataSchema,
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
})

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
})

export const flowboardFileSchema = z
  .object({
    version: z.literal(1),

    board: z.object({
      name: z.string().min(1),
      nodes: z.array(nodeSchema),
      edges: z.array(edgeSchema),
    }),
  })
  .superRefine((file, ctx) => {
    const nodeIds = new Set(file.board.nodes.map((node) => node.id))

    file.board.edges.forEach((edge, index) => {
      if (!nodeIds.has(edge.source)) {
        ctx.addIssue({
          code: 'custom',
          path: ['board', 'edges', index, 'source'],
          message: `Source node "${edge.source}" does not exist`,
        })
      }

      if (!nodeIds.has(edge.target)) {
        ctx.addIssue({
          code: 'custom',
          path: ['board', 'edges', index, 'target'],
          message: `Target node "${edge.target}" does not exist`,
        })
      }
    })
  })

export type FlowboardFile = z.infer<typeof flowboardFileSchema>
