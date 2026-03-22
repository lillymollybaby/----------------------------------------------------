import { api } from './client'
import { Tag } from '@/types'

export const tagsApi = {
  list: () => api.get<Tag[]>('/tags').then((r) => r.data),

  create: (data: { name: string; color: string }) =>
    api.post<Tag>('/tags', data).then((r) => r.data),

  update: (id: number, data: { name?: string; color?: string }) =>
    api.patch<Tag>(`/tags/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/tags/${id}`).then((r) => r.data),
}
