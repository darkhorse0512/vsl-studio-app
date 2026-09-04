import { useState } from 'react'
import { useT } from '../i18n'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import Button from '../components/ui/Button'
import { Input, PasswordInput } from '../components/ui/Form'
import { Banner } from '../components/ui/Feedback'
import { CheckCircle } from '../components/Icons'

const MIN_PASSWORD_LENGTH = 8

export default function Signup() {
  const t = useT()
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const validate = () => {
    const next = {}

    if (!form.fullName.trim()) next.fullName = t('auth.enterName')
    if (!form.email.trim()) {
      next.email = t('auth.enterEmail')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = t('auth.invalidEmail')
    }

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      next.password = t('auth.minChars', { count: MIN_PASSWORD_LENGTH })
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = t('auth.passwordsDontMatch')
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const { needsEmailConfirmation } = await signUp(form)

      if (needsEmailConfirmation) {
        setConfirmationSent(true)
      } else {
        navigate('/pending', { replace: true })
      }
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmationSent) {
    return (
      <AuthShell
        title={t('auth.checkInbox')}
        subtitle={t('auth.confirmSubtitle')}
      >
        <div className="card p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
          <p className="mt-4 text-ink-200">
            {t('auth.confirmSent', { email: form.email })}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-400">
            {t('auth.confirmHint')}
          </p>
          <Button to="/login" className="mt-6 w-full">
            {t('auth.goToSignIn')}
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth.signUpTitle')}
      subtitle={t('auth.signUpSubtitle')}
      footer={
        <>
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
            {t('nav.signIn')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <Banner tone="danger">{formError}</Banner>}

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label={t('auth.fullName')}
            name="fullName"
            autoComplete="name"
            placeholder="Ana Silva"
            value={form.fullName}
            onChange={update('fullName')}
            error={errors.fullName}
            required
          />
          <Input
            label={t('auth.company')}
            name="company"
            autoComplete="organization"
            placeholder={t('common.optional')}
            value={form.company}
            onChange={update('company')}
          />
        </div>

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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          required
        />

        <PasswordInput
          label={t('auth.confirmPassword')}
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          error={errors.confirmPassword}
          required
        />

        <Banner tone="info">
          {t('auth.signUpNotice')}
        </Banner>

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {t('nav.createAccount')}
        </Button>
      </form>
    </AuthShell>
  )
}
