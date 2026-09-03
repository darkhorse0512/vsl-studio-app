import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { updateProfile } from '../lib/api'
import { SUPPORT_EMAIL } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import { Input, PasswordInput } from '../components/ui/Form'
import { Badge, Banner } from '../components/ui/Feedback'

const MIN_PASSWORD_LENGTH = 8

export default function Account() {
  const { user, profile, refreshProfile, updatePassword } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({ full_name: '', company: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState({})
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name ?? '', company: profile.company ?? '' })
    }
  }, [profile])

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setSavingProfile(true)
    try {
      await updateProfile(user.id, form)
      refreshProfile()
      toast.success('Your details were saved.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()

    const next = {}
    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    }
    if (confirmPassword !== password) {
      next.confirmPassword = 'The two passwords do not match.'
    }
    setPasswordErrors(next)
    if (Object.keys(next).length) return

    setSavingPassword(true)
    try {
      await updatePassword(password)
      setPassword('')
      setConfirmPassword('')
      toast.success('Your password was updated.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Account" description="Manage your details and password." />

      <div className="space-y-6">
        {/* Status ------------------------------------------------------- */}
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-ink-400">Account status</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone={profile?.status === 'approved' ? 'success' : 'warning'}>
                  {profile?.status === 'approved' ? 'Active' : 'Awaiting approval'}
                </Badge>
                {profile?.role === 'admin' && <Badge tone="brand">Administrator</Badge>}
              </div>
            </div>
            <div className="text-right text-sm text-ink-500">
              <p>Member since {formatDate(profile?.created_at)}</p>
              {profile?.approved_at && <p>Approved {formatDate(profile.approved_at)}</p>}
            </div>
          </div>
        </div>

        {/* Profile ------------------------------------------------------ */}
        <form onSubmit={handleProfileSubmit} className="card space-y-5 p-6">
          <h2 className="font-semibold text-white">Your details</h2>

          <Input label="Email address" value={user?.email ?? ''} disabled hint="Cannot be changed" />

          <Input
            label="Full name"
            value={form.full_name}
            onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
            placeholder="Your name"
            maxLength={120}
          />

          <Input
            label="Company"
            value={form.company}
            onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
            placeholder="Optional"
            maxLength={120}
          />

          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile}>
              Save changes
            </Button>
          </div>
        </form>

        {/* Password ----------------------------------------------------- */}
        <form onSubmit={handlePasswordSubmit} className="card space-y-5 p-6">
          <h2 className="font-semibold text-white">Change password</h2>

          <PasswordInput
            label="New password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={passwordErrors.password}
          />

          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={passwordErrors.confirmPassword}
          />

          <div className="flex justify-end">
            <Button type="submit" variant="secondary" loading={savingPassword} disabled={!password}>
              Update password
            </Button>
          </div>
        </form>

        <Banner tone="neutral">
          Need to close your account or have a billing question? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-brand-400 hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </Banner>
      </div>
    </div>
  )
}
