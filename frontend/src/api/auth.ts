import { api } from './client'
import { User, AuthTokens } from '@/types'

interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<AuthTokens>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }).then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),

  updateProfile: (data: { name?: string; currentPassword?: string; newPassword?: string }) =>
    api.patch<User>('/auth/me', data).then((r) => r.data),
}
