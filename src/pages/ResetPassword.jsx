import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import Button from '../components/ui/Button'
import { PasswordInput } from '../components/ui/Form'
import { Banner, LoadingScreen } from '../components/ui/Feedback'

const MIN_PASSWORD_LENGTH = 8

export default function ResetPassword() {
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
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    }
    if (confirmPassword !== password) {
      next.confirmPassword = 'The two passwords do not match.'
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

  if (loading) return <LoadingScreen label="Verifying your reset link…" />

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something you have not used before."
      footer={
        <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
          Back to sign in
        </Link>
      }
    >
      {!isAuthenticated ? (
        <Banner tone="warning" title="This link is no longer valid">
          Password reset links expire after one hour and can only be used once.{' '}
          <Link to="/forgot-password" className="font-medium underline">
            Request a new one
          </Link>
          .
        </Banner>
      ) : done ? (
        <Banner tone="success" title="Password updated">
          Taking you to your dashboard…
        </Banner>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && <Banner tone="danger">{formError}</Banner>}

          <PasswordInput
            label="New password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            required
          />

          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={errors.confirmPassword}
            required
          />

          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
