import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { tasksApi } from '@/api/tasks'
import { taskCache } from '@/lib/idb'
import StatCard from '@/components/StatCard'
import ActivityChart from '@/components/ActivityChart'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: tasksApi.stats,
    staleTime: 60 * 1000,
  })

  // Pre-warm task cache for offline use
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list(),
  })

  useEffect(() => {
    if (tasks && Array.isArray(tasks)) taskCache.set(tasks)
  }, [tasks])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <div className="pt-2">
        <h1 className="text-xl font-semibold text-white">
          {greeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Here's what's going on today</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-20 bg-slate-800" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total tasks"
            value={stats.total}
            icon="📋"
            color="bg-primary-600/20"
          />
          <StatCard
            label="In progress"
            value={stats.inProgress}
            icon="⚡"
            color="bg-amber-500/20"
          />
          <StatCard
            label="Done today"
            value={stats.doneToday}
            icon="✓"
            color="bg-emerald-500/20"
          />
          <StatCard
            label="Overdue"
            value={stats.overdue}
            icon="⚠"
            color="bg-red-500/20"
            description={stats.overdue > 0 ? 'Need attention' : undefined}
          />
        </div>
      ) : null}

      {stats?.activity && <ActivityChart data={stats.activity} />}

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300">Quick actions</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/tasks')}
            className="btn-ghost justify-start border border-slate-700 hover:border-slate-600"
          >
            <span>✓</span> View all tasks
          </button>
          <button
            onClick={() => navigate('/tasks?new=1')}
            className="btn-primary justify-start"
          >
            <span>+</span> New task
          </button>
        </div>
      </div>
    </div>
  )
}
