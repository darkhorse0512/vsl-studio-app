import { useI18n } from '../i18n'
import { cn } from '../lib/utils'
import { Check } from './Icons'

/**
 * Language switcher.
 *
 * `compact` renders the chip row used inside the account dropdown and the
 * marketing header; the default renders labelled rows for the Account page.
 */
export default function LanguagePicker({ compact = false }) {
  const { language, setLanguage, languages, t } = useI18n()

  if (compact) {
    return (
      <div className="px-4 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          {t('language.label')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {languages.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLanguage(item.id)}
              aria-pressed={language === item.id}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                language === item.id
                  ? 'border-brand-500 bg-brand-500/10 text-white'
                  : 'border-ink-800 text-ink-400 hover:border-ink-600 hover:text-ink-100',
              )}
            >
              <span aria-hidden="true">{item.flag}</span>
              {item.short}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div role="radiogroup" aria-label={t('language.label')} className="grid gap-2.5 sm:grid-cols-3">
      {languages.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={language === item.id}
          onClick={() => setLanguage(item.id)}
          className={cn(
            'flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all',
            language === item.id
              ? 'border-brand-500 bg-brand-500/10'
              : 'border-ink-800 hover:border-ink-600 hover:bg-ink-900',
          )}
        >
          <span className="text-lg" aria-hidden="true">
            {item.flag}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-ink-100">{item.name}</span>
          {language === item.id && <Check className="h-4 w-4 shrink-0 text-brand-400" />}
        </button>
      ))}
    </div>
  )
}
