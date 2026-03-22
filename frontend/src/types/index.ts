export type Status = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'medium' | 'high'

export interface Tag {
  id: number
  name: string
  color: string
  userId: number
  _count?: { tasks: number }
}

export interface Task {
  id: number
  title: string
  description?: string | null
  status: Status
  priority: Priority
  dueDate?: string | null
  userId: number
  tags: Tag[]
  createdAt: string
  updatedAt: string
}

export interface User {
  id: number
  email: string
  name: string
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface DashboardStats {
  total: number
  inProgress: number
  doneToday: number
  overdue: number
  activity: { date: string; count: number }[]
}

// For offline queue
export interface PendingOperation {
  id: string
  type: 'create' | 'update' | 'delete' | 'status'
  payload: unknown
  createdAt: number
}
