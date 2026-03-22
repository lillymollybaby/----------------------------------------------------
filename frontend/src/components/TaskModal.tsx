import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { tagsApi } from '@/api/tags'
import { Task, Status, Priority } from '@/types'
import { CreateTaskData } from '@/api/tasks'

interface Props {
  task?: Task | null
  onSubmit: (data: CreateTaskData) => Promise<void>
  onClose: () => void
}

interface FormData {
  title: string
  description: string
  priority: Priority
  status: Status
  dueDate: string
  tagIds: number[]
}

export default function TaskModal({ task, onSubmit, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.list })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<FormData>({
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 'medium',
      status: task?.status ?? 'todo',
      dueDate: task?.dueDate ? task.dueDate.slice(0, 16) : '',
      tagIds: task?.tags.map((t) => t.id) ?? [],
    },
  })

  const selectedTagIds = watch('tagIds')

  function toggleTag(id: number) {
    const current = selectedTagIds || []
    if (current.includes(id)) {
      setValue('tagIds', current.filter((t) => t !== id))
    } else {
      setValue('tagIds', [...current, id])
    }
  }

  // Close on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function handleFormSubmit(data: FormData) {
    await onSubmit({
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      tagIds: data.tagIds,
    })
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-base font-semibold text-white">
            {task ? 'Edit task' : 'New task'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4">
          <div>
            <input
              {...register('title', { required: 'Title is required' })}
              placeholder="Task title"
              className="input"
              autoFocus
            />
            {errors.title && (
              <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>
            )}
          </div>

          <textarea
            {...register('description')}
            placeholder="Description (optional)"
            rows={3}
            className="input resize-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Priority</label>
              <select {...register('priority')} className="input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Status</label>
              <select {...register('status')} className="input">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Due date</label>
            <input
              {...register('dueDate')}
              type="datetime-local"
              className="input"
            />
          </div>

          {tags.length > 0 && (
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = selectedTagIds?.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`badge transition-all cursor-pointer ${
                        active ? 'ring-2 ring-white/20' : 'opacity-60'
                      }`}
                      style={{
                        backgroundColor: tag.color + (active ? '40' : '20'),
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Saving...' : task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
