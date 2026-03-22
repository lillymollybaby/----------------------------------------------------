import { pendingOps } from './idb'
import { tasksApi } from '@/api/tasks'
import { CreateTaskData } from '@/api/tasks'
import { Status } from '@/types'

// Runs when we come back online — replays all queued operations
export async function syncPendingOps() {
  const ops = await pendingOps.getAll()
  if (!ops.length) return

  console.log(`[sync] Replaying ${ops.length} pending operations`)

  for (const op of ops) {
    try {
      if (op.type === 'create') {
        await tasksApi.create(op.payload as CreateTaskData)
      } else if (op.type === 'update') {
        const { id, ...data } = op.payload as { id: number } & Partial<CreateTaskData>
        await tasksApi.update(id, data)
      } else if (op.type === 'delete') {
        await tasksApi.delete((op.payload as { id: number }).id)
      } else if (op.type === 'status') {
        const { id, status } = op.payload as { id: number; status: Status }
        await tasksApi.updateStatus(id, status)
      }

      await pendingOps.remove(op.id)
    } catch (err) {
      console.error(`[sync] Failed to replay op ${op.id}:`, err)
      // Leave it in the queue to retry next time
    }
  }
}
