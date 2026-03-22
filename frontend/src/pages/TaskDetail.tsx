import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import { tagsApi } from '@/api/tags'
import { format, isPast } from 'date-fns'
import { Task, Status, Priority, Tag } from '@/types'

const statusLabels: Record<Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const priorityColors: Record<Priority, string> = {
  low: 'text-slate-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Task> & { tags: Tag[] }>({ tags: [] })

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(Number(id)),
  })

  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.list })

  // Populate edit form when task loads
  useEffect(() => {
    if (task) setEditData({ ...task })
  }, [task])

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof tasksApi.update>[1]) =>
      tasksApi.update(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', id] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      setIsEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      navigate('/tasks')
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: Status) => tasksApi.updateStatus(Number(id), status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', id] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  if (isLoading) {
    return (
      <div className="p-5 max-w-2xl mx-auto">
        <div className="card animate-pulse h-64" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="p-5 text-center text-slate-500">
        Task not found.{' '}
        <button onClick={() => navigate('/tasks')} className="text-primary-400">
          Go back
        </button>
      </div>
    )
  }

  const isOverdue =
    task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done'

  function toggleTag(tag: Tag) {
    setEditData((d) => {
      const current = d.tags ?? []
      const exists = current.find((t) => t.id === tag.id)
      return {
        ...d,
        tags: exists ? current.filter((t) => t.id !== tag.id) : [...current, tag],
      }
    })
  }

  async function saveEdits() {
    if (!task) return
    const tagIds = (editData.tags ?? task.tags).map((t) => t.id)
    const dueDate = editData.dueDate !== undefined ? editData.dueDate : task.dueDate
    await updateMutation.mutateAsync({
      title: editData.title || task.title,
      description: editData.description ?? task.description ?? undefined,
      priority: editData.priority || task.priority,
      status: editData.status || task.status,
      dueDate: dueDate ?? undefined,
      tagIds,
    })
  }

  const currentTags = isEditing ? (editData.tags ?? task.tags) : task.tags

  return (
    <div className="p-5 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/tasks')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="flex-1" />
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="btn-ghost">
            Edit
          </button>
        ) : (
          <>
            <button onClick={() => { setIsEditing(false); setEditData({ ...task }) }} className="btn-ghost">
              Cancel
            </button>
            <button
              onClick={saveEdits}
              disabled={updateMutation.isPending}
              className="btn-primary"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
        <button
          onClick={() => {
            if (window.confirm('Delete this task?')) deleteMutation.mutate()
          }}
          className="btn-danger"
        >
          Delete
        </button>
      </div>

      <div className="card space-y-4">
        {/* Title */}
        {isEditing ? (
          <input
            value={editData.title ?? task.title}
            onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))}
            className="input text-lg font-semibold"
          />
        ) : (
          <h1 className="text-xl font-semibold text-white">{task.title}</h1>
        )}

        {/* Status buttons */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(statusLabels) as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => statusMutation.mutate(s)}
              className={`btn text-xs py-1 px-3 border ${
                task.status === s
                  ? 'border-primary-500 bg-primary-600/20 text-primary-300'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>

        {/* Description */}
        {isEditing ? (
          <textarea
            value={editData.description ?? task.description ?? ''}
            onChange={(e) => setEditData((d) => ({ ...d, description: e.target.value }))}
            rows={4}
            placeholder="Add a description..."
            className="input resize-none"
          />
        ) : task.description ? (
          <p className="text-sm text-slate-300 leading-relaxed">{task.description}</p>
        ) : (
          <p className="text-sm text-slate-600 italic">No description</p>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700">
          {/* Priority */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Priority</p>
            {isEditing ? (
              <select
                value={editData.priority ?? task.priority}
                onChange={(e) =>
                  setEditData((d) => ({ ...d, priority: e.target.value as Priority }))
                }
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            ) : (
              <p className={`text-sm font-medium capitalize ${priorityColors[task.priority]}`}>
                {task.priority}
              </p>
            )}
          </div>

          {/* Due date */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Due date</p>
            {isEditing ? (
              <input
                type="datetime-local"
                value={
                  (editData.dueDate ?? task.dueDate)
                    ? (editData.dueDate ?? task.dueDate)!.slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setEditData((d) => ({
                    ...d,
                    dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                  }))
                }
                className="input"
              />
            ) : task.dueDate ? (
              <p className={`text-sm ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                {isOverdue ? '⚠ ' : ''}
                {format(new Date(task.dueDate), 'MMM d, yyyy HH:mm')}
                {isOverdue ? ' (overdue)' : ''}
              </p>
            ) : (
              <p className="text-sm text-slate-600">Not set</p>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="border-t border-slate-700 pt-3">
          <p className="text-xs text-slate-500 mb-2">Tags</p>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = currentTags.some((t) => t.id === tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`badge cursor-pointer transition-all ${
                      active ? 'ring-2 ring-white/20' : 'opacity-50'
                    }`}
                    style={{
                      backgroundColor: tag.color + (active ? '40' : '15'),
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </button>
                )
              })}
              {tags.length === 0 && (
                <p className="text-xs text-slate-600">
                  No tags yet — create some in your profile
                </p>
              )}
            </div>
          ) : currentTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentTags.map((tag) => (
                <span
                  key={tag.id}
                  className="badge"
                  style={{ backgroundColor: tag.color + '30', color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600">No tags</p>
          )}
        </div>

        <div className="text-xs text-slate-600 pt-2 border-t border-slate-700/50">
          Created {format(new Date(task.createdAt), 'MMM d, yyyy')} · Updated{' '}
          {format(new Date(task.updatedAt), 'MMM d, yyyy')}
        </div>
      </div>
    </div>
  )
}
