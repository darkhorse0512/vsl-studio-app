import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { APP_NAME, SUPPORT_EMAIL } from '../lib/supabase'
import Button from '../components/ui/Button'
import { Banner } from '../components/ui/Feedback'
import { Check, Clock, Logo, LogOut, Refresh } from '../components/Icons'

const POLL_INTERVAL_MS = 20_000

const TIMELINE = [
  { key: 'pending.stepCreated', done: true },
  { key: 'pending.stepReview', done: false, current: true },
  { key: 'pending.stepAccess', done: false },
]

export default function PendingApproval() {
  const t = useT()
  const { profile, refreshProfile, signOut, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)

  // Poll quietly so the page unlocks itself the moment an admin approves.
  useEffect(() => {
    const timer = setInterval(refreshProfile, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [refreshProfile])

  if (!loading && !isAuthenticated) return <Navigate to="/login" replace />
  if (profile?.status === 'approved') return <Navigate to="/app" replace />

  const handleCheck = () => {
    setChecking(true)
    refreshProfile()
    setTimeout(() => setChecking(false), 900)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const rejected = profile?.status === 'rejected'
  const suspended = profile?.status === 'suspended'

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[700px] -translate-x-1/2 rounded-full bg-brand-600/15 blur-[120px]" />

      <div className="relative w-full max-w-lg animate-fade-up">
        <div className="mb-8 flex justify-center">
          <Logo className="h-11 w-11" />
        </div>

        <div className="card p-8 text-center">
          {rejected || suspended ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
                <Clock className="h-7 w-7" />
              </div>
              <h1 className="mt-5 text-2xl font-bold text-white">
                {rejected ? t('pending.rejectedTitle') : t('pending.suspendedTitle')}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">
                {rejected
                  ? t('pending.rejectedBody')
                  : t('pending.suspendedBody')}{' '}
                {t('pending.contactHint')}
              </p>
              <Button href={`mailto:${SUPPORT_EMAIL}`} className="mt-7 w-full">
                {t('pending.contactSupport')}
              </Button>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
                <Clock className="h-7 w-7" />
              </div>
              <h1 className="mt-5 text-2xl font-bold text-white">{t('pending.title')}</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">
                {t('pending.body')}
              </p>

              <ol className="mt-8 space-y-3 text-left">
                {TIMELINE.map((step) => (
                  <li key={step.key} className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                        step.done
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                          : step.current
                            ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                            : 'border-ink-700 bg-ink-800 text-ink-500'
                      }`}
                    >
                      {step.done ? <Check className="h-4 w-4" /> : ''}
                    </span>
                    <span
                      className={`text-sm ${
                        step.done || step.current ? 'text-ink-100' : 'text-ink-500'
                      }`}
                    >
                      {t(step.key)}
                    </span>
                  </li>
                ))}
              </ol>

              <Button onClick={handleCheck} className="mt-8 w-full" loading={checking}>
                <Refresh className="h-4 w-4" />
                {t('pending.checkStatus')}
              </Button>
            </>
          )}

          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 link-muted"
            >
              <LogOut className="h-4 w-4" />
              {t('nav.signOut')}
            </button>
            <span className="text-ink-700">·</span>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="link-muted">
              {t('pending.contactSupport')}
            </a>
          </div>
        </div>

        {profile?.email && (
          <Banner tone="neutral" className="mt-5">
            {t('pending.signedInAs')} <span className="font-medium text-white">{profile.email}</span> ·{' '}
            {APP_NAME}
          </Banner>
        )}
      </div>
    </div>
  )
}
