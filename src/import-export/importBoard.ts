import { flowboardFileSchema, type FlowboardFile } from './schema'

export type ImportResult =
  | {
      success: true
      file: FlowboardFile
    }
  | {
      success: false
      error: string
    }

export function parseFlowboardFile(text: string): ImportResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch {
    return {
      success: false,
      error: 'The selected file is not valid JSON.',
    }
  }

  const result = flowboardFileSchema.safeParse(parsed)

  if (!result.success) {
    return {
      success: false,
      error: 'The selected file is not a valid Flowboard file.',
    }
  }

  return {
    success: true,
    file: result.data,
  }
}
