import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Form'
import { Banner } from '../components/ui/Feedback'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Enter the email address on your account.')
      return
    }

    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will email you a link to choose a new one."
      footer={
        <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <Banner tone="success" title="Check your inbox">
          If an account exists for <span className="font-medium">{email}</span>, a reset link is on
          its way. The link expires in one hour.
        </Banner>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error && <Banner tone="danger">{error}</Banner>}

          <Input
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
