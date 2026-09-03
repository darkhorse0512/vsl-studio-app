import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import Button from '../components/ui/Button'
import { Input, PasswordInput } from '../components/ui/Form'
import { Banner } from '../components/ui/Feedback'
import { CheckCircle } from '../components/Icons'

const MIN_PASSWORD_LENGTH = 8

export default function Signup() {
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

    if (!form.fullName.trim()) next.fullName = 'Tell us who you are.'
    if (!form.email.trim()) {
      next.email = 'Enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'That email address does not look right.'
    }

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'The two passwords do not match.'
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
        title="Check your inbox"
        subtitle="One more step before we can enable your account."
      >
        <div className="card p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
          <p className="mt-4 text-ink-200">
            We sent a confirmation link to{' '}
            <span className="font-medium text-white">{form.email}</span>.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-400">
            Confirm your address, then sign in. An administrator will review and enable your
            account before you can create projects.
          </p>
          <Button to="/login" className="mt-6 w-full">
            Go to sign in
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up in seconds. An administrator enables your access."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <Banner tone="danger">{formError}</Banner>}

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Full name"
            name="fullName"
            autoComplete="name"
            placeholder="Ana Silva"
            value={form.fullName}
            onChange={update('fullName')}
            error={errors.fullName}
            required
          />
          <Input
            label="Company"
            name="company"
            autoComplete="organization"
            placeholder="Optional"
            value={form.company}
            onChange={update('company')}
          />
        </div>

        <Input
          label="Email address"
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
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          required
        />

        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          error={errors.confirmPassword}
          required
        />

        <Banner tone="info">
          New accounts start in review. You will be able to sign in immediately and will get full
          access as soon as an administrator approves you.
        </Banner>

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  )
}
