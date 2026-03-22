import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { tasksApi, TaskFilters } from '@/api/tasks'
import { tagsApi } from '@/api/tags'
import { taskCache, pendingOps } from '@/lib/idb'
import { useTaskStore } from '@/store/taskStore'
import { useOffline } from '@/hooks/useOffline'
import { Task, Status, Priority } from '@/types'
import KanbanBoard from '@/components/KanbanBoard'
import TaskModal from '@/components/TaskModal'

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(searchParams.get('new') === '1')
  const [filters, setFilters] = useState<TaskFilters>({})
  const [search, setSearch] = useState('')

  const qc = useQueryClient()
  const { tasks, setTasks, moveTask } = useTaskStore()
  const isOffline = useOffline()

  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.list })

  const { data: fetchedTasks, isLoading } = useQuery({
    queryKey: ['tasks', filters, search],
    queryFn: async () => {
      if (isOffline) {
        return taskCache.getAll()
      }
      const data = await tasksApi.list({ ...filters, search: search || undefined })
      await taskCache.set(data)
      return data
    },
    placeholderData: (prev) => prev,
  })

  useEffect(() => {
    if (fetchedTasks) setTasks(fetchedTasks)
  }, [fetchedTasks, setTasks])

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Status }) =>
      tasksApi.updateStatus(id, status),
    onMutate: ({ id, status }) => {
      moveTask(id, status)
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      setShowModal(false)
    },
  })

  async function handleStatusChange(taskId: number, status: Status) {
    if (isOffline) {
      moveTask(taskId, status)
      await pendingOps.add({
        id: `status-${taskId}-${Date.now()}`,
        type: 'status',
        payload: { id: taskId, status },
        createdAt: Date.now(),
      })
      const task = tasks.find((t) => t.id === taskId)
      if (task) await taskCache.put({ ...task, status })
      return
    }
    statusMutation.mutate({ id: taskId, status })
  }

  async function handleCreate(data: Parameters<typeof tasksApi.create>[0]) {
    if (isOffline) {
      const tempTask: Task = {
        id: -Date.now(),
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? 'todo',
        priority: data.priority ?? 'medium',
        dueDate: data.dueDate ?? null,
        userId: 0,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setTasks([tempTask, ...tasks])
      await taskCache.put(tempTask)
      await pendingOps.add({
        id: `create-${Date.now()}`,
        type: 'create',
        payload: data,
        createdAt: Date.now(),
      })
      setShowModal(false)
      return
    }
    await createMutation.mutateAsync(data)
  }

  useEffect(() => {
    if (!showModal && searchParams.get('new')) {
      setSearchParams({}, { replace: true })
    }
  }, [showModal])

  const priorityOptions: Priority[] = ['low', 'medium', 'high']

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="input max-w-xs"
        />

        <select
          value={filters.priority ?? ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              priority: (e.target.value as Priority) || undefined,
            }))
          }
          className="input w-auto"
        >
          <option value="">All priorities</option>
          {priorityOptions.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>

        {tags.length > 0 && (
          <select
            value={filters.tagId ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                tagId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="input w-auto"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        )}

        <button onClick={() => setShowModal(true)} className="btn-primary ml-auto">
          + New task
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 p-5 overflow-auto">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-slate-800/30 h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <KanbanBoard tasks={tasks} onStatusChange={handleStatusChange} />
        )}
      </div>

      {showModal && (
        <TaskModal onSubmit={handleCreate} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
