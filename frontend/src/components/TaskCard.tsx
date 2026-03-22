import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { Task, Priority } from '@/types'
import { format, isPast, isToday } from 'date-fns'

interface Props {
  task: Task
}

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-slate-400 bg-slate-700' },
  medium: { label: 'Medium', color: 'text-amber-400 bg-amber-400/10' },
  high: { label: 'High', color: 'text-red-400 bg-red-400/10' },
}

export default function TaskCard({ task }: Props) {
  const navigate = useNavigate()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = dueDate && isPast(dueDate) && task.status !== 'done'
  const isDueToday = dueDate && isToday(dueDate)

  const { label: priorityLabel, color: priorityColor } = priorityConfig[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card cursor-pointer hover:border-slate-600 transition-all group ${
        isDragging ? 'shadow-lg shadow-black/40 rotate-1' : ''
      }`}
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="invisible group-hover:visible absolute -left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        ⋮⋮
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-100 leading-snug line-clamp-2">
            {task.title}
          </p>
          <span className={`badge shrink-0 ${priorityColor}`}>{priorityLabel}</span>
        </div>

        {task.description && (
          <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
        )}

        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <span
                key={tag.id}
                className="badge text-white"
                style={{ backgroundColor: tag.color + '33', color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {dueDate && (
          <p
            className={`text-xs ${
              isOverdue
                ? 'text-red-400'
                : isDueToday
                ? 'text-amber-400'
                : 'text-slate-500'
            }`}
          >
            {isOverdue ? '⚠ ' : ''}
            {format(dueDate, 'MMM d')}
            {isDueToday ? ' (today)' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
