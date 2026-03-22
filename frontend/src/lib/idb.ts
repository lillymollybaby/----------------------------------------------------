import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Task, PendingOperation } from '@/types'

interface FlowTaskDB extends DBSchema {
  tasks: {
    key: number
    value: Task
    indexes: { 'by-status': string }
  }
  pendingOps: {
    key: string
    value: PendingOperation
  }
}

let db: IDBPDatabase<FlowTaskDB> | null = null

async function getDB() {
  if (db) return db

  db = await openDB<FlowTaskDB>('flowtask', 1, {
    upgrade(database) {
      const taskStore = database.createObjectStore('tasks', { keyPath: 'id' })
      taskStore.createIndex('by-status', 'status')

      database.createObjectStore('pendingOps', { keyPath: 'id' })
    },
  })

  return db
}

// Task cache
export const taskCache = {
  async getAll(): Promise<Task[]> {
    const database = await getDB()
    return database.getAll('tasks')
  },

  async set(tasks: Task[]) {
    const database = await getDB()
    const tx = database.transaction('tasks', 'readwrite')
    await Promise.all([...tasks.map((t) => tx.store.put(t)), tx.done])
  },

  async put(task: Task) {
    const database = await getDB()
    await database.put('tasks', task)
  },

  async delete(id: number) {
    const database = await getDB()
    await database.delete('tasks', id)
  },

  async clear() {
    const database = await getDB()
    await database.clear('tasks')
  },
}

// Offline operation queue
export const pendingOps = {
  async getAll(): Promise<PendingOperation[]> {
    const database = await getDB()
    return database.getAll('pendingOps')
  },

  async add(op: PendingOperation) {
    const database = await getDB()
    await database.put('pendingOps', op)
  },

  async remove(id: string) {
    const database = await getDB()
    await database.delete('pendingOps', id)
  },

  async clear() {
    const database = await getDB()
    await database.clear('pendingOps')
  },
}
