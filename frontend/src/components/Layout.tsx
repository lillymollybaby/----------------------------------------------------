import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import { useOffline } from '@/hooks/useOffline'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import OfflineBanner from './OfflineBanner'
import InstallPrompt from './InstallPrompt'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞', exact: true },
  { to: '/tasks', label: 'Tasks', icon: '✓' },
  { to: '/profile', label: 'Profile', icon: '◎' },
]

export default function Layout() {
  const { user, refreshToken, logout } = useAuthStore()
  const navigate = useNavigate()
  const isOffline = useOffline()
  const { canInstall, install } = useInstallPrompt()

  async function handleLogout() {
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // Fine, just clear local state
    }
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-dvh bg-slate-900">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="flex h-16 items-center gap-2 px-5 border-b border-slate-800">
          <span className="text-primary-400 text-xl font-bold">Flow</span>
          <span className="text-white text-xl font-bold">Task</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full justify-start text-slate-500">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {isOffline && <OfflineBanner />}
        {canInstall && <InstallPrompt onInstall={install} />}

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex border-t border-slate-800 bg-slate-900/90 backdrop-blur">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                  isActive ? 'text-primary-400' : 'text-slate-500'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
