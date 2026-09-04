import { useState } from 'react'
import { useT } from '../i18n'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import Button from '../components/ui/Button'
import { Input, PasswordInput } from '../components/ui/Form'
import { Banner } from '../components/ui/Feedback'

export default function Login() {
  const t = useT()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const nextErrors = {}
    if (!form.email.trim()) nextErrors.email = t('auth.enterEmail')
    if (!form.password) nextErrors.password = t('auth.enterPassword')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      await signIn(form)
      navigate(location.state?.from || '/app', { replace: true })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title={t('auth.welcomeBack')}
      subtitle={t('auth.signInSubtitle')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/signup" className="font-medium text-brand-400 hover:text-brand-300">
            {t('auth.createOne')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <Banner tone="danger">{formError}</Banner>}

        <Input
          label={t('auth.email')}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          required
        />

        <PasswordInput
          label={t('auth.password')}
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          hint={
            <Link to="/forgot-password" className="text-brand-400 hover:text-brand-300">
              {t('auth.forgotPassword')}
            </Link>
          }
          required
        />

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {t('nav.signIn')}
        </Button>
      </form>
    </AuthShell>
  )
}
