import { useState } from 'react'
import { useT } from '../i18n'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Form'
import { Banner } from '../components/ui/Feedback'

export default function ForgotPassword() {
  const t = useT()
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim()) {
      setError(t('auth.enterEmail'))
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
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSubtitle')}
      footer={
        <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
          {t('auth.backToSignIn')}
        </Link>
      }
    >
      {sent ? (
        <Banner tone="success" title={t('auth.checkInbox')}>
          {t('auth.resetSent', { email })}
        </Banner>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error && <Banner tone="danger">{error}</Banner>}

          <Input
            label={t('auth.email')}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            {t('auth.sendResetLink')}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
