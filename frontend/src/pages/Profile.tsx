import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import { tagsApi } from '@/api/tags'
import { tasksApi } from '@/api/tasks'
import { Tag } from '@/types'

const TAG_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
]

interface ProfileFormData {
  name: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface TagFormData {
  name: string
  color: string
}

export default function Profile() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore()
  const qc = useQueryClient()
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0])
  const [profileMsg, setProfileMsg] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.list })
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: tasksApi.stats })

  const profileForm = useForm<ProfileFormData>({ defaultValues: { name: user?.name ?? '' } })
  const passwordForm = useForm<PasswordFormData>()
  const tagForm = useForm<TagFormData>({ defaultValues: { name: '', color: TAG_COLORS[0] } })

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updated) => {
      setAuth(updated, accessToken!, refreshToken!)
      setProfileMsg('Saved!')
      setTimeout(() => setProfileMsg(''), 2000)
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: () => {
      passwordForm.reset()
      setPasswordMsg('Password updated!')
      setTimeout(() => setPasswordMsg(''), 2000)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to update password'
      setPasswordMsg(msg)
    },
  })

  const createTagMutation = useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] })
      tagForm.reset()
      setSelectedColor(TAG_COLORS[0])
    },
  })

  const deleteTagMutation = useMutation({
    mutationFn: tagsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })

  async function handleProfileSave(data: ProfileFormData) {
    await updateProfileMutation.mutateAsync({ name: data.name })
  }

  async function handlePasswordSave(data: PasswordFormData) {
    if (data.newPassword !== data.confirmPassword) {
      setPasswordMsg('Passwords do not match')
      return
    }
    await updatePasswordMutation.mutateAsync({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })
  }

  async function handleTagCreate(data: TagFormData) {
    await createTagMutation.mutateAsync({ name: data.name, color: selectedColor })
  }

  return (
    <div className="p-5 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-white">Profile</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-1">Total tasks</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {stats.total - stats.inProgress - stats.overdue}
            </p>
            <p className="text-xs text-slate-500 mt-1">Completed</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.inProgress}</p>
            <p className="text-xs text-slate-500 mt-1">In progress</p>
          </div>
        </div>
      )}

      {/* Edit profile */}
      <div className="card space-y-4">
        <h2 className="text-sm font-medium text-slate-300">Account info</h2>

        <div className="text-sm text-slate-500">
          <span className="text-slate-400">{user?.email}</span>
        </div>

        <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Display name</label>
            <input
              {...profileForm.register('name', { required: true, minLength: 2 })}
              className="input"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="btn-primary"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save changes'}
            </button>
            {profileMsg && <span className="text-sm text-emerald-400">{profileMsg}</span>}
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card space-y-4">
        <h2 className="text-sm font-medium text-slate-300">Change password</h2>

        <form
          onSubmit={passwordForm.handleSubmit(handlePasswordSave)}
          className="space-y-3"
        >
          <input
            {...passwordForm.register('currentPassword', { required: true })}
            type="password"
            placeholder="Current password"
            className="input"
            autoComplete="current-password"
          />
          <input
            {...passwordForm.register('newPassword', { required: true, minLength: 6 })}
            type="password"
            placeholder="New password (min 6 chars)"
            className="input"
            autoComplete="new-password"
          />
          <input
            {...passwordForm.register('confirmPassword', { required: true })}
            type="password"
            placeholder="Confirm new password"
            className="input"
            autoComplete="new-password"
          />

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={updatePasswordMutation.isPending}
              className="btn-primary"
            >
              {updatePasswordMutation.isPending ? 'Updating...' : 'Update password'}
            </button>
            {passwordMsg && (
              <span
                className={`text-sm ${
                  passwordMsg.includes('updated') ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {passwordMsg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Tags management */}
      <div className="card space-y-4">
        <h2 className="text-sm font-medium text-slate-300">Tags</h2>

        <form onSubmit={tagForm.handleSubmit(handleTagCreate)} className="flex gap-2">
          <input
            {...tagForm.register('name', { required: true })}
            placeholder="Tag name"
            className="input flex-1"
          />
          <div className="flex gap-1">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`h-8 w-8 rounded-lg transition-transform ${
                  selectedColor === c ? 'scale-125 ring-2 ring-white/30' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={createTagMutation.isPending}
            className="btn-primary shrink-0"
          >
            Add
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag: Tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm"
              style={{ backgroundColor: tag.color + '25', color: tag.color }}
            >
              <span>{tag.name}</span>
              {tag._count && (
                <span className="text-xs opacity-60">({tag._count.tasks})</span>
              )}
              <button
                onClick={() => deleteTagMutation.mutate(tag.id)}
                className="opacity-50 hover:opacity-100 ml-1 text-xs leading-none"
              >
                ×
              </button>
            </div>
          ))}
          {tags.length === 0 && (
            <p className="text-sm text-slate-600">No tags yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
