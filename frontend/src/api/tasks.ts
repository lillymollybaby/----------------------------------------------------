import { api } from './client'
import { Task, DashboardStats, Status, Priority } from '@/types'

export interface TaskFilters {
  status?: Status
  priority?: Priority
  tagId?: number
  search?: string
}

export interface CreateTaskData {
  title: string
  description?: string
  status?: Status
  priority?: Priority
  dueDate?: string | null
  tagIds?: number[]
}

export const tasksApi = {
  list: (filters?: TaskFilters) =>
    api.get<Task[]>('/tasks', { params: filters }).then((r) => r.data),

  get: (id: number) => api.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (data: CreateTaskData) => api.post<Task>('/tasks', data).then((r) => r.data),

  update: (id: number, data: Partial<CreateTaskData>) =>
    api.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),

  updateStatus: (id: number, status: Status) =>
    api.patch<Task>(`/tasks/${id}/status`, { status }).then((r) => r.data),

  delete: (id: number) => api.delete(`/tasks/${id}`).then((r) => r.data),

  stats: () => api.get<DashboardStats>('/tasks/stats/summary').then((r) => r.data),
}
