import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { I18nProvider } from './i18n'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute, { GuestRoute } from './components/ProtectedRoute'
import MarketingLayout from './components/MarketingLayout'
import AppLayout from './components/AppLayout'
import ConfigWarning from './components/ConfigWarning'
import { LoadingScreen } from './components/ui/Feedback'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import PendingApproval from './pages/PendingApproval'
import NotFound from './pages/NotFound'

// The dashboard is only needed once a user signs in - keep it out of the
// landing page bundle (pdf.js in particular is heavy).
const Dashboard = lazy(() => import('./pages/Dashboard'))
const NewProject = lazy(() => import('./pages/NewProject'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Account = lazy(() => import('./pages/Account'))

/** Reset scroll position on navigation, except for in-page anchors. */
function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <ConfigWarning />
            <ScrollToTop />

            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public marketing site */}
                <Route element={<MarketingLayout />}>
                  <Route index element={<Landing />} />
                </Route>

                {/* Authentication */}
                <Route
                  path="/login"
                  element={
                    <GuestRoute>
                      <Login />
                    </GuestRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <GuestRoute>
                      <Signup />
                    </GuestRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <GuestRoute>
                      <ForgotPassword />
                    </GuestRoute>
                  }
                />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/pending" element={<PendingApproval />} />

                {/* Dashboard - requires an approved account */}
                <Route path="/app" element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="new" element={<NewProject />} />
                    <Route path="projects/:id" element={<ProjectDetail />} />
                    <Route path="account" element={<Account />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}
