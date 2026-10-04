import Dexie, { type EntityTable } from 'dexie'

import type { StoredBoard } from '../features/editor/types'

export const db = new Dexie('flowboard') as Dexie & {
  boards: EntityTable<StoredBoard, 'id'>
}

db.version(1).stores({
  boards: 'id, name, updatedAt',
})