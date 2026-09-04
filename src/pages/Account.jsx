import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { updateProfile } from '../lib/api'
import { SUPPORT_EMAIL } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import PageHeader from '../components/PageHeader'
import LanguagePicker from '../components/LanguagePicker'
import ThemePicker from '../components/ThemePicker'
import Button from '../components/ui/Button'
import { Input, PasswordInput } from '../components/ui/Form'
import { Badge, Banner } from '../components/ui/Feedback'

const MIN_PASSWORD_LENGTH = 8

export default function Account() {
  const t = useT()
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
      toast.success(t('account.detailsSaved'))
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
      next.password = t('auth.minChars', { count: MIN_PASSWORD_LENGTH })
    }
    if (confirmPassword !== password) {
      next.confirmPassword = t('auth.passwordsDontMatch')
    }
    setPasswordErrors(next)
    if (Object.keys(next).length) return

    setSavingPassword(true)
    try {
      await updatePassword(password)
      setPassword('')
      setConfirmPassword('')
      toast.success(t('account.passwordSaved'))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('account.title')} description={t('account.subtitle')} />

      <div className="space-y-6">
        {/* Status ------------------------------------------------------- */}
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-ink-400">{t('account.status')}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone={profile?.status === 'approved' ? 'success' : 'warning'}>
                  {profile?.status === 'approved' ? t('account.active') : t('account.awaiting')}
                </Badge>
                {profile?.role === 'admin' && <Badge tone="brand">{t('account.administrator')}</Badge>}
              </div>
            </div>
            <div className="text-right text-sm text-ink-500">
              <p>{t('account.memberSince', { date: formatDate(profile?.created_at) })}</p>
              {profile?.approved_at && <p>{t('account.approvedOn', { date: formatDate(profile.approved_at) })}</p>}
            </div>
          </div>
        </div>

        {/* Appearance --------------------------------------------------- */}
        <section className="card p-6">
          <h2 className="font-semibold text-white">{t('account.appearance')}</h2>
          <p className="mb-5 mt-1 text-sm text-ink-500">
            {t('account.appearanceBody')}
          </p>
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-ink-200">{t('language.label')}</h3>
            <LanguagePicker />
          </div>

          <ThemePicker />
        </section>

        {/* Profile ------------------------------------------------------ */}
        <form onSubmit={handleProfileSubmit} className="card space-y-5 p-6">
          <h2 className="font-semibold text-white">{t('account.yourDetails')}</h2>

          <Input
            label={t('auth.email')}
            value={user?.email ?? ''}
            disabled
            hint={t('account.cannotChange')}
          />

          <Input
            label={t('auth.fullName')}
            value={form.full_name}
            onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
            placeholder="Your name"
            maxLength={120}
          />

          <Input
            label={t('auth.company')}
            value={form.company}
            onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
            placeholder={t('common.optional')}
            maxLength={120}
          />

          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile}>
              {t('common.saveChanges')}
            </Button>
          </div>
        </form>

        {/* Password ----------------------------------------------------- */}
        <form onSubmit={handlePasswordSubmit} className="card space-y-5 p-6">
          <h2 className="font-semibold text-white">{t('account.changePassword')}</h2>

          <PasswordInput
            label={t('auth.newPassword')}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={passwordErrors.password}
          />

          <PasswordInput
            label={t('auth.confirmNewPassword')}
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={passwordErrors.confirmPassword}
          />

          <div className="flex justify-end">
            <Button type="submit" variant="secondary" loading={savingPassword} disabled={!password}>
              {t('auth.updatePassword')}
            </Button>
          </div>
        </form>

        <Banner tone="neutral">
          {t('account.supportNote')}{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-brand-400 hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </Banner>
      </div>
    </div>
  )
}
