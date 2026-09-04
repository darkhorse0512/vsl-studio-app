import { isSupabaseConfigured } from '../lib/supabase'
import { useT } from '../i18n'
import { Alert } from './Icons'

/**
 * Loud, unmissable banner when the environment variables are missing.
 * Without them every request fails with an opaque network error.
 */
export default function ConfigWarning() {
  const t = useT()
  if (isSupabaseConfigured) return null

  return (
    <div className="sticky top-0 z-[70] flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-center text-sm font-medium text-white">
      <Alert className="h-4 w-4 shrink-0" />
      <span>
        {t('errors.configTitle')} {t('errors.configBody')}
      </span>
    </div>
  )
}
