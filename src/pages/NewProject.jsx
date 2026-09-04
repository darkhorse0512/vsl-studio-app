import { useRef, useState } from 'react'
import { useT } from '../i18n'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { createProject, uploadSourceFile } from '../lib/api'
import {
  ACCEPTED_ATTR,
  MIN_TEXT_LENGTH,
  extractTextFromFile,
  formatBytes,
} from '../lib/extractText'
import { cn, readingMinutes, wordCount } from '../lib/utils'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import { Input, Label, Textarea } from '../components/ui/Form'
import { Banner } from '../components/ui/Feedback'
import {
  Check,
  FileText,
  Layers,
  Loader,
  Puzzle,
  Sparkles,
  Upload,
  X,
} from '../components/Icons'

const STEPS = [
  { icon: Layers, titleKey: 'newProject.step1Title', bodyKey: 'newProject.step1Body' },
  { icon: Sparkles, titleKey: 'newProject.step2Title', bodyKey: 'newProject.step2Body' },
  { icon: FileText, titleKey: 'newProject.step3Title', bodyKey: 'newProject.step3Body' },
]

const TIPS = ['newProject.tip1', 'newProject.tip2', 'newProject.tip3']

export default function NewProject() {
  const t = useT()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [mode, setMode] = useState('paste')
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const characters = text.trim().length
  const words = wordCount(text)
  const ready = characters >= MIN_TEXT_LENGTH

  /* ---------------------------------------------------------------- */
  /* File handling                                                     */
  /* ---------------------------------------------------------------- */
  const handleFile = async (selected) => {
    if (!selected) return

    setFormError('')
    setErrors((current) => ({ ...current, text: undefined }))
    setExtracting(true)
    setProgress(0)
    setFile(selected)

    try {
      const extracted = await extractTextFromFile(selected, setProgress)
      setText(extracted)

      if (!name.trim()) {
        setName(selected.name.replace(/\.[^.]+$/, '').slice(0, 120))
      }

      toast.success(t('newProject.extracted', { count: extracted.length.toLocaleString() }))
    } catch (error) {
      setFile(null)
      setFormError(error.message)
    } finally {
      setExtracting(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setText('')
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  /* ---------------------------------------------------------------- */
  /* Submit                                                            */
  /* ---------------------------------------------------------------- */
  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const next = {}
    if (!name.trim()) next.name = t('newProject.nameRequired')
    if (characters < MIN_TEXT_LENGTH) {
      next.text = t('newProject.tooShort', { min: MIN_TEXT_LENGTH, current: characters })
    }
    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      let storagePath = null

      // Keeping the original upload is a convenience, not a requirement:
      // never block project creation on it.
      if (mode === 'file' && file) {
        try {
          storagePath = await uploadSourceFile(user.id, file)
        } catch (uploadError) {
          console.warn('Original file could not be stored:', uploadError)
          toast.info(t('newProject.fileStoreWarning'))
        }
      }

      const project = await createProject({
        userId: user.id,
        name,
        vslText: text,
        sourceType: mode === 'file' && file ? 'file' : 'paste',
        sourceFilename: mode === 'file' && file ? file.name : null,
        storagePath,
      })

      navigate(`/app/projects/${project.id}`, { state: { autoAnalyze: true } })
    } catch (error) {
      setFormError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        back={{ to: '/app', label: t('project.allProjects') }}
        eyebrow={t('newProject.eyebrow')}
        title={t('newProject.title')}
        description={t('newProject.subtitle')}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Form ------------------------------------------------------- */}
        <form onSubmit={handleSubmit} noValidate className="min-w-0 space-y-5">
          {formError && <Banner tone="danger">{formError}</Banner>}

          <section className="card p-5 sm:p-6">
            <Input
              label={t('newProject.projectName')}
              placeholder={t('newProject.projectNamePlaceholder')}
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setErrors((current) => ({ ...current, name: undefined }))
              }}
              error={errors.name}
              maxLength={160}
              required
            />
          </section>

          <section className="card p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Label required>{t('newProject.scriptLabel')}</Label>

              <div className="inline-flex rounded-xl border border-ink-800 bg-ink-950/60 p-1">
                {[
                  ['paste', 'newProject.pasteTab', FileText],
                  ['file', 'newProject.uploadTab', Upload],
                ].map(([value, labelKey, IconComponent]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    aria-pressed={mode === value}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
                      mode === value
                        ? 'bg-ink-700 text-white shadow-sm'
                        : 'text-ink-400 hover:text-ink-100',
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'paste' ? (
              <Textarea
                rows={16}
                placeholder={t('newProject.pastePlaceholder')}
                value={text}
                onChange={(event) => {
                  setText(event.target.value)
                  setErrors((current) => ({ ...current, text: undefined }))
                }}
                error={errors.text}
                className="font-mono text-[13px]"
              />
            ) : (
              <>
                <div
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => !extracting && fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors focus:outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/40',
                    dragging
                      ? 'border-brand-500 bg-brand-500/5'
                      : 'border-ink-700 hover:border-ink-600',
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_ATTR}
                    className="sr-only"
                    id="vsl-file"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                  />

                  {extracting ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader className="h-8 w-8 text-brand-400" />
                      <p className="text-sm text-ink-300">
                        {t('newProject.reading', { name: file?.name })}
                      </p>
                      <div className="h-1.5 w-56 overflow-hidden rounded-full bg-ink-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : file && text ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                        <Check className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{file.name}</p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {formatBytes(file.size)} ·{' '}
                          {t('newProject.extracted', { count: characters.toLocaleString() })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          clearFile()
                        }}
                        className="inline-flex items-center gap-1.5 text-sm link-muted"
                      >
                        <X className="h-4 w-4" />
                        {t('newProject.differentFile')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-800 text-ink-300">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="font-medium text-brand-400">
                          {t('newProject.chooseFile')}
                        </span>
                        <span className="text-ink-400"> {t('newProject.orDragIt')}</span>
                      </div>
                      <p className="text-xs text-ink-500">{t('newProject.fileTypes')}</p>
                    </div>
                  )}
                </div>

                {errors.text && (
                  <p role="alert" className="mt-2 text-sm text-red-400">
                    {errors.text}
                  </p>
                )}

                {file && text && (
                  <details className="mt-4 rounded-xl border border-ink-800 p-4">
                    <summary className="cursor-pointer text-sm link-muted">
                      {t('newProject.reviewExtracted')}
                    </summary>
                    <Textarea
                      rows={12}
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      className="mt-3 font-mono text-[13px]"
                    />
                  </details>
                )}
              </>
            )}

            {/* Counter --------------------------------------------------- */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-ink-800 pt-3 text-xs">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 font-medium',
                  ready ? 'text-emerald-400' : 'text-amber-400',
                )}
              >
                {ready && <Check className="h-3.5 w-3.5" />}
                {characters.toLocaleString()} {t('common.characters')}
              </span>
              <span className="text-ink-500">
                {words.toLocaleString()} {t('common.words')}
              </span>
              {words > 0 && (
                <span className="text-ink-500">
                  {t('common.minSpoken', { minutes: readingMinutes(text) })}
                </span>
              )}
              <span className="ml-auto text-ink-600">
                {t('newProject.minCharacters', { count: MIN_TEXT_LENGTH })}
              </span>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button to="/app" variant="secondary" size="lg">
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="lg" loading={submitting} disabled={extracting}>
              <Sparkles className="h-5 w-5" />
              {t('newProject.createAndAnalyse')}
            </Button>
          </div>
        </form>

        {/* Helper column ---------------------------------------------- */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
              {t('newProject.whatHappens')}
            </h2>

            <ol className="mt-4 space-y-4">
              {STEPS.map((step, index) => (
                <li key={step.titleKey} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/12 text-xs font-bold text-brand-300">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{t(step.titleKey)}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-400">
                      {t(step.bodyKey)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
              {t('newProject.tipsTitle')}
            </h2>
            <ul className="mt-3 space-y-2.5">
              {TIPS.map((tip) => (
                <li key={tip} className="flex gap-2.5 text-xs leading-relaxed text-ink-400">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
                  {t(tip)}
                </li>
              ))}
            </ul>
          </div>

          <div className="card flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-500/12 text-accent-400">
              <Puzzle className="h-4.5 w-4.5" />
            </span>
            <p className="text-xs leading-relaxed text-ink-400">
              {t('newProject.timingNote')}
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
