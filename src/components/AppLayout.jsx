import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { APP_NAME } from '../lib/supabase'
import { cn } from '../lib/utils'
import Button from './ui/Button'
import { ChevronDown, Grid, Logo, LogOut, Menu, Plus, User, X } from './Icons'

const NAV = [
  { to: '/app', label: 'Projects', icon: Grid, end: true },
  { to: '/app/account', label: 'Account', icon: User },
]

/**
 * Top-header application shell.
 *
 * The workspace is a single-column canvas: previews of generated pages need
 * the full width, so navigation lives in one slim sticky header rather than
 * a sidebar competing with the content.
 */
export default function AppLayout() {
  const { profile, user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  // Close the account menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Account'
  const initials = (profile?.full_name || user?.email || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  const linkClass = ({ isActive }) =>
    cn(
      'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'text-white' : 'text-ink-400 hover:text-ink-100',
      isActive &&
        'after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-brand-400 after:to-accent-400',
    )

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to="/app"
            className="flex shrink-0 items-center gap-2.5 rounded-lg transition-opacity hover:opacity-90"
          >
            <Logo className="h-8 w-8" />
            <span className="hidden text-[15px] font-semibold tracking-tight text-white sm:block">
              {APP_NAME}
            </span>
          </Link>

          <span className="mx-1 hidden h-5 w-px bg-ink-800 lg:block" />

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Button to="/app/new" size="sm" className="hidden sm:inline-flex">
              <Plus className="h-4 w-4" />
              New project
            </Button>

            {/* Account menu ---------------------------------------- */}
            <div className="relative hidden lg:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full border border-ink-800 py-1 pl-1 pr-2.5 transition-colors hover:border-ink-600 hover:bg-ink-900"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-[11px] font-bold text-white">
                  {initials}
                </span>
                <span className="max-w-[120px] truncate text-sm text-ink-200">{displayName}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-ink-500 transition-transform',
                    menuOpen && 'rotate-180',
                  )}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-2xl animate-fade-up"
                >
                  <div className="border-b border-ink-800 px-4 py-3">
                    <p className="truncate text-sm font-medium text-white">{displayName}</p>
                    <p className="truncate text-xs text-ink-500">{user?.email}</p>
                  </div>

                  <Link
                    to="/app/account"
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-200 transition-colors hover:bg-ink-800 hover:text-white"
                  >
                    <User className="h-4 w-4" />
                    Account settings
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 border-t border-ink-800 px-4 py-2.5 text-sm text-ink-200 transition-colors hover:bg-ink-800 hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="rounded-lg p-2 text-ink-300 transition-colors hover:bg-ink-800 hover:text-white lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile panel -------------------------------------------- */}
        {mobileOpen && (
          <div className="border-t border-ink-800 bg-ink-950/95 backdrop-blur-xl lg:hidden">
            <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-500/15 text-white'
                        : 'text-ink-300 hover:bg-ink-800 hover:text-white',
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}

              <div className="mt-3 space-y-2 border-t border-ink-800 pt-3">
                <Button to="/app/new" className="w-full sm:hidden">
                  <Plus className="h-4 w-4" />
                  New project
                </Button>

                <div className="flex items-center gap-3 px-1 py-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{displayName}</p>
                    <p className="truncate text-xs text-ink-500">{user?.email}</p>
                  </div>
                </div>

                <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
