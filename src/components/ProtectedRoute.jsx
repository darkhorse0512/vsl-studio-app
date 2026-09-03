import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingScreen } from './ui/Feedback'

/**
 * Gate for authenticated areas.
 * `requireApproved` sends users whose account an admin has not enabled yet
 * to the waiting-room page. RLS enforces the same rule on the server.
 */
export default function ProtectedRoute({ requireApproved = true, children }) {
  const { isAuthenticated, loading, profile } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen label="Checking your session…" />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // A missing profile is treated exactly like an unapproved one: the waiting
  // room can recover from it, the dashboard cannot.
  if (requireApproved && (!profile || profile.status !== 'approved')) {
    return <Navigate to="/pending" replace />
  }

  return children ?? <Outlet />
}

/** Keeps signed-in users away from the login/signup screens. */
export function GuestRoute({ children }) {
  const { isAuthenticated, loading, profile } = useAuth()

  if (loading) return <LoadingScreen />

  if (isAuthenticated) {
    return <Navigate to={profile?.status === 'approved' ? '/app' : '/pending'} replace />
  }

  return children ?? <Outlet />
}
