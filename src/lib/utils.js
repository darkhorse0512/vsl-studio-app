/** Join class names, dropping falsy values. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(value) {
  if (!value) return '—'

  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
  const steps = [
    [60, 'second', 1],
    [3600, 'minute', 60],
    [86400, 'hour', 3600],
    [604800, 'day', 86400],
    [2629800, 'week', 604800],
    [31557600, 'month', 2629800],
  ]

  if (seconds < 45) return 'just now'

  for (const [limit, unit, divisor] of steps) {
    if (seconds < limit) {
      const amount = Math.round(seconds / divisor)
      return `${amount} ${unit}${amount === 1 ? '' : 's'} ago`
    }
  }

  const years = Math.round(seconds / 31557600)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

export function wordCount(text = '') {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

/** Rough spoken duration of a VSL script, in minutes. */
export function readingMinutes(text = '') {
  return Math.max(1, Math.round(wordCount(text) / 150))
}

export function truncate(text = '', length = 120) {
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text
}

export function slugify(text = '') {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'download'
  )
}

/** Copy text to the clipboard, with a fallback for insecure contexts. */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

export function downloadFile(filename, content, mime = 'text/html;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  // Give Safari a moment before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Open generated HTML in a new browser tab. */
export function openInNewTab(html) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const tab = window.open(url, '_blank', 'noopener,noreferrer')

  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return Boolean(tab)
}

export const PROJECT_STATUS = {
  draft: {
    label: 'Draft',
    labelKey: 'project.statusDraft',
    tone: 'neutral',
    hint: 'Ready to analyse',
    hintKey: 'project.hintDraft',
  },
  analyzing: {
    label: 'Analysing',
    labelKey: 'project.statusAnalyzing',
    tone: 'info',
    hint: 'The AI is reading your VSL',
    hintKey: 'project.hintAnalyzing',
  },
  analyzed: {
    label: 'Analysed',
    labelKey: 'project.statusAnalyzed',
    tone: 'success',
    hint: 'Assets can be generated',
    hintKey: 'project.hintAnalyzed',
  },
  failed: {
    label: 'Failed',
    labelKey: 'project.statusFailed',
    tone: 'danger',
    hint: 'The last analysis did not finish',
    hintKey: 'project.hintFailed',
  },
}

export const ASSET_LABEL = {
  sales_page: 'Sales page',
  quiz: 'Quiz',
  product: 'Product',
  ad_creative: 'Ad creative',
}

export const ASSET_LABEL_KEY = {
  sales_page: 'assets.salesPage',
  quiz: 'assets.quiz',
  product: 'assets.product',
  ad_creative: 'assets.adCreative',
}
