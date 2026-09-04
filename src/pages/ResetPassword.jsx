import { useState } from 'react'
import { useT } from '../i18n'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import Button from '../components/ui/Button'
import { PasswordInput } from '../components/ui/Form'
import { Banner, LoadingScreen } from '../components/ui/Feedback'

const MIN_PASSWORD_LENGTH = 8

export default function ResetPassword() {
  const t = useT()
  const { updatePassword, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const next = {}
    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = t('auth.minChars', { count: MIN_PASSWORD_LENGTH })
    }
    if (confirmPassword !== password) {
      next.confirmPassword = t('auth.passwordsDontMatch')
    }
    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/app', { replace: true }), 1800)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingScreen label={t('common.loading')} />

  return (
    <AuthShell
      title={t('auth.chooseNewPassword')}
      subtitle={t('auth.chooseNewSubtitle')}
      footer={
        <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
          {t('auth.backToSignIn')}
        </Link>
      }
    >
      {!isAuthenticated ? (
        <Banner tone="warning" title={t('auth.linkInvalid')}>
          {t('auth.linkInvalidBody')}{' '}
          <Link to="/forgot-password" className="font-medium underline">
            {t('auth.requestNew')}
          </Link>
          .
        </Banner>
      ) : done ? (
        <Banner tone="success" title={t('auth.passwordUpdated')}>
          {t('auth.redirecting')}
        </Banner>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && <Banner tone="danger">{formError}</Banner>}

          <PasswordInput
            label={t('auth.newPassword')}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            required
          />

          <PasswordInput
            label={t('auth.confirmNewPassword')}
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={errors.confirmPassword}
            required
          />

          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            {t('auth.updatePassword')}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
