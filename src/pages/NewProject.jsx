import { useRef, useState } from 'react'
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
import Button from '../components/ui/Button'
import { Input, Label, Textarea } from '../components/ui/Form'
import { Banner } from '../components/ui/Feedback'
import { ArrowLeft, Check, FileText, Loader, Sparkles, Upload, X } from '../components/Icons'

export default function NewProject() {
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

      toast.success(
        `Extracted ${extracted.length.toLocaleString()} characters from ${selected.name}.`,
      )
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
    if (!name.trim()) next.name = 'Give this project a name.'
    if (characters < MIN_TEXT_LENGTH) {
      next.text = `Add at least ${MIN_TEXT_LENGTH} characters of VSL script (currently ${characters}).`
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
          toast.info('The original file could not be stored, but the text was captured.')
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
    <div className="mx-auto max-w-3xl">
      <Button to="/app" variant="ghost" size="sm" className="mb-6 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Button>

      <h1 className="text-3xl font-bold tracking-tight text-white">New project</h1>
      <p className="mt-1.5 text-ink-400">
        Add your video sales letter. We analyse it once and build both assets from that brief.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
        {formError && <Banner tone="danger">{formError}</Banner>}

        <div className="card p-6">
          <Input
            label="Project name"
            placeholder="e.g. Método Emagrecer Leve — VSL v3"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setErrors((current) => ({ ...current, name: undefined }))
            }}
            error={errors.name}
            maxLength={160}
            required
          />
        </div>

        <div className="card p-6">
          <Label required>VSL script</Label>

          {/* Mode switch ------------------------------------------- */}
          <div className="mb-5 mt-2 inline-flex rounded-xl border border-ink-700 bg-ink-950/60 p-1">
            {[
              ['paste', 'Paste text', FileText],
              ['file', 'Upload file', Upload],
            ].map(([value, label, IconComponent]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-pressed={mode === value}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  mode === value ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-ink-100',
                )}
              >
                <IconComponent className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {mode === 'paste' ? (
            <Textarea
              rows={14}
              placeholder="Paste the full VSL transcript here…"
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setErrors((current) => ({ ...current, text: undefined }))
              }}
              error={errors.text}
              className="font-mono text-sm"
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
                className={cn(
                  'rounded-xl border-2 border-dashed p-8 text-center transition-colors',
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
                    <p className="text-sm text-ink-300">Reading {file?.name}…</p>
                    <div className="h-1.5 w-48 overflow-hidden rounded-full bg-ink-800">
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
                      <p className="text-xs text-ink-500">
                        {formatBytes(file.size)} · {characters.toLocaleString()} characters
                        extracted
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="inline-flex items-center gap-1.5 text-sm link-muted"
                    >
                      <X className="h-4 w-4" />
                      Choose a different file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-800 text-ink-300">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <label
                        htmlFor="vsl-file"
                        className="cursor-pointer font-medium text-brand-400 hover:text-brand-300"
                      >
                        Choose a file
                      </label>
                      <span className="text-ink-400"> or drag it here</span>
                    </div>
                    <p className="text-xs text-ink-500">.txt, .md or .pdf — up to 20 MB</p>
                  </div>
                )}
              </div>

              {errors.text && (
                <p role="alert" className="mt-2 text-sm text-red-400">
                  {errors.text}
                </p>
              )}

              {file && text && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm link-muted">
                    Review the extracted text
                  </summary>
                  <Textarea
                    rows={12}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    className="mt-3 font-mono text-sm"
                  />
                </details>
              )}
            </>
          )}

          {/* Counter --------------------------------------------------- */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
            <span className={characters < MIN_TEXT_LENGTH ? 'text-amber-400' : 'text-emerald-400'}>
              {characters.toLocaleString()} characters
            </span>
            <span>{words.toLocaleString()} words</span>
            {words > 0 && <span>≈ {readingMinutes(text)} min spoken</span>}
            <span className="ml-auto">Minimum {MIN_TEXT_LENGTH} characters</span>
          </div>
        </div>

        <Banner tone="info">
          Analysis usually takes 20–60 seconds. Once it finishes you can generate the sales page
          and the quiz as many times as you like — both always come from this same analysis.
        </Banner>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button to="/app" variant="secondary" size="lg">
            Cancel
          </Button>
          <Button type="submit" size="lg" loading={submitting} disabled={extracting}>
            <Sparkles className="h-5 w-5" />
            Create and analyse
          </Button>
        </div>
      </form>
    </div>
  )
}
