import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import ptBR from './locales/pt-BR'
import en from './locales/en'
import es from './locales/es'

/**
 * Minimal i18n runtime.
 *
 * pt-BR is the source locale and the fallback: a key missing from en/es
 * renders the Portuguese string rather than a raw key, so a partial
 * translation degrades gracefully instead of showing "dashboard.title".
 */

export const LANGUAGES = [
  { id: 'pt-BR', name: 'Português (Brasil)', short: 'PT', flag: '🇧🇷' },
  { id: 'en', name: 'English', short: 'EN', flag: '🇺🇸' },
  { id: 'es', name: 'Español', short: 'ES', flag: '🇪🇸' },
]

const DICTIONARIES = { 'pt-BR': ptBR, en, es }
const DEFAULT_LANGUAGE = 'pt-BR'
const STORAGE_KEY = 'vsl-studio.language'

const I18nContext = createContext(null)

function readStored() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && DICTIONARIES[stored]) return stored
  } catch {
    /* private mode */
  }

  // Fall back to the browser's preference when it is one we support.
  try {
    for (const tag of navigator.languages ?? []) {
      const lower = tag.toLowerCase()
      if (lower.startsWith('pt')) return 'pt-BR'
      if (lower.startsWith('es')) return 'es'
      if (lower.startsWith('en')) return 'en'
    }
  } catch {
    /* no navigator */
  }

  return DEFAULT_LANGUAGE
}

/** Resolve "a.b.c" against a nested dictionary. */
function lookup(dictionary, path) {
  return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), dictionary)
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(readStored)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next) => {
    if (!DICTIONARIES[next]) return
    setLanguageState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const t = useCallback(
    (path, values) => {
      const raw =
        lookup(DICTIONARIES[language], path) ??
        lookup(DICTIONARIES[DEFAULT_LANGUAGE], path) ??
        path

      if (typeof raw !== 'string') return path
      if (!values) return raw

      return raw.replace(/\{(\w+)\}/g, (match, key) =>
        values[key] === undefined || values[key] === null ? match : String(values[key]),
      )
    },
    [language],
  )

  const value = useMemo(() => ({ language, setLanguage, t, languages: LANGUAGES }), [
    language,
    setLanguage,
    t,
  ])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>')
  return context
}

/** Convenience: `const t = useT()` for components that only translate. */
export function useT() {
  return useI18n().t
}
