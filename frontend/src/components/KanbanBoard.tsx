import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import { Task, Status } from '@/types'
import TaskCard from './TaskCard'

interface Props {
  tasks: Task[]
  onStatusChange: (taskId: number, status: Status) => void
}

const columns: { id: Status; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'border-slate-600' },
  { id: 'in_progress', label: 'In Progress', color: 'border-amber-500/50' },
  { id: 'done', label: 'Done', color: 'border-emerald-500/50' },
]

export default function KanbanBoard({ tasks, onStatusChange }: Props) {
  const [draggingTask, setDraggingTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  function handleDragStart({ active }: { active: { id: number | string } }) {
    const task = tasks.find((t) => t.id === active.id)
    if (task) setDraggingTask(task)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDraggingTask(null)

    if (!over) return

    // Check if dropped over a column
    const targetColumn = columns.find((c) => c.id === over.id)
    if (targetColumn && active.id !== over.id) {
      onStatusChange(active.id as number, targetColumn.id)
      return
    }

    // Check if dropped over another task — use that task's column
    const overTask = tasks.find((t) => t.id === over.id)
    const activeTask = tasks.find((t) => t.id === active.id)
    if (overTask && activeTask && overTask.status !== activeTask.status) {
      onStatusChange(activeTask.id, overTask.status)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id)

          return (
            <div
              key={col.id}
              id={col.id}
              className={`flex flex-col rounded-xl border-t-2 bg-slate-800/30 ${col.color}`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                <h3 className="text-sm font-semibold text-slate-300">{col.label}</h3>
                <span className="text-xs text-slate-500 bg-slate-700 rounded-full px-2 py-0.5">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <SortableContext
                items={colTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[120px]">
                  {colTasks.map((task) => (
                    <div key={task.id} className="relative">
                      <TaskCard task={task} />
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-slate-700/50">
                      <p className="text-xs text-slate-600">Drop here</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {draggingTask ? (
          <div className="rotate-3 scale-105 opacity-90">
            <TaskCard task={draggingTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
