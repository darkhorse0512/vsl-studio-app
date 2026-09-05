import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  analyzeProject,
  deleteProject,
  generateAsset,
  getProject,
  getSourceFileUrl,
  listAssets,
  renameProject,
  updateProjectSettings,
} from '../lib/api'
import { useToast } from '../context/ToastContext'
import {
  ASSET_LABEL_KEY,
  PROJECT_STATUS,
  cn,
  formatDateTime,
  readingMinutes,
  timeAgo,
  wordCount,
} from '../lib/utils'
import { useT } from '../i18n'
import PageHeader from '../components/PageHeader'
import AnalysisPanel from '../components/AnalysisPanel'
import GenerationSettings, { isEmptySettings } from '../components/GenerationSettings'
import CodeStudio from '../components/CodeStudio'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import { Input } from '../components/ui/Form'
import { Badge, Banner, Dot, EmptyState, LoadingScreen } from '../components/ui/Feedback'
import Modal, { ConfirmDialog } from '../components/ui/Modal'
import {
  ArrowLeft,
  Book,
  Check,
  Download,
  Eye,
  FileText,
  Layers,
  Megaphone,
  Puzzle,
  Refresh,
  Sparkles,
  Trash,
} from '../components/Icons'

const TABS = [
  { id: 'analysis', labelKey: 'project.tabAnalysis', icon: Sparkles },
  { id: 'sales_page', labelKey: 'project.tabSalesPage', icon: FileText },
  { id: 'quiz', labelKey: 'project.tabQuiz', icon: Puzzle },
  { id: 'product', labelKey: 'project.tabProduct', icon: Book },
  { id: 'ad_creative', labelKey: 'project.tabAd', icon: Megaphone },
  { id: 'source', labelKey: 'project.tabSource', icon: Layers },
]

/** Everything the four generators need, in one place. */
const GENERATORS = [
  {
    type: 'sales_page',
    icon: FileText,
    titleKey: 'assets.salesPage',
    descKey: 'assets.salesPageDesc',
  },
  { type: 'quiz', icon: Puzzle, titleKey: 'assets.quiz', descKey: 'assets.quizDesc', accent: true },
  { type: 'product', icon: Book, titleKey: 'assets.product', descKey: 'assets.productDesc' },
  {
    type: 'ad_creative',
    icon: Megaphone,
    titleKey: 'assets.adCreative',
    descKey: 'assets.adCreativeDesc',
    accent: true,
  },
]

const ASSET_KIND = {
  sales_page: 'html',
  quiz: 'html',
  product: 'html',
  ad_creative: 'markdown',
}

export default function ProjectDetail() {
  const t = useT()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [project, setProject] = useState(null)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [tab, setTab] = useState('analysis')
  const [analyzing, setAnalyzing] = useState(false)
  const [generating, setGenerating] = useState({})
  const [selectedVersion, setSelectedVersion] = useState({})

  const [savingSettings, setSavingSettings] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const autoAnalyzeRequested = useRef(false)

  /* ---------------------------------------------------------------- */
  /* Load                                                              */
  /* ---------------------------------------------------------------- */
  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [projectData, assetData] = await Promise.all([getProject(id), listAssets(id)])
      if (!projectData) {
        setLoadError('This project does not exist, or you no longer have access to it.')
        return
      }
      setProject(projectData)
      setAssets(assetData)
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  /* ---------------------------------------------------------------- */
  /* Actions                                                           */
  /* ---------------------------------------------------------------- */
  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true)
    setProject((current) => (current ? { ...current, status: 'analyzing', error_message: null } : current))

    try {
      const updated = await analyzeProject(id)
      setProject((current) => ({ ...current, ...updated }))
      toast.success('Analysis complete. You can now generate both assets.')
      setTab('analysis')
    } catch (error) {
      setProject((current) =>
        current ? { ...current, status: 'failed', error_message: error.message } : current,
      )
      toast.error(error.message)
    } finally {
      setAnalyzing(false)
    }
  }, [id, toast])

  // Kick off automatically when arriving straight from the create form.
  useEffect(() => {
    if (autoAnalyzeRequested.current) return
    if (!project || loading) return
    if (!location.state?.autoAnalyze) return
    if (project.status !== 'draft') return

    autoAnalyzeRequested.current = true
    navigate(location.pathname, { replace: true, state: {} })
    handleAnalyze()
  }, [project, loading, location.state, location.pathname, navigate, handleAnalyze])

  const handleGenerate = async (type) => {
    setGenerating((current) => ({ ...current, [type]: true }))
    try {
      const asset = await generateAsset(id, type)
      setAssets((current) => [asset, ...current])
      setSelectedVersion((current) => ({ ...current, [type]: asset.id }))
      setTab(type)
      toast.success(
        t('assets.generatedToast', { asset: t(ASSET_LABEL_KEY[type]), version: asset.version }),
      )
    } catch (error) {
      toast.error(error.message)
    } finally {
      setGenerating((current) => ({ ...current, [type]: false }))
    }
  }

  const handleSaveSettings = async (settings) => {
    setSavingSettings(true)
    try {
      const updated = await updateProjectSettings(id, settings)
      setProject((current) => ({ ...current, generation_settings: updated.generation_settings }))
      toast.success(
        isEmptySettings(settings)
          ? 'Target product cleared - assets will follow the VSL again.'
          : 'Target product saved. Regenerate both assets to apply it.',
      )
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleRename = async () => {
    if (!renameValue.trim()) return
    setRenaming(true)
    try {
      const updated = await renameProject(id, renameValue)
      setProject((current) => ({ ...current, name: updated.name }))
      setRenameOpen(false)
      toast.success('Project renamed.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setRenaming(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteProject(id)
      toast.success('Project deleted.')
      navigate('/app', { replace: true })
    } catch (error) {
      toast.error(error.message)
      setDeleting(false)
    }
  }

  const handleDownloadSource = async () => {
    try {
      const url = await getSourceFileUrl(project.storage_path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      toast.error(error.message)
    }
  }

  /* ---------------------------------------------------------------- */
  /* Derived                                                           */
  /* ---------------------------------------------------------------- */
  const byType = useMemo(() => {
    const grouped = { sales_page: [], quiz: [], product: [], ad_creative: [] }
    for (const asset of assets) grouped[asset.type]?.push(asset)
    return grouped
  }, [assets])

  const activeAsset = (type) => {
    const list = byType[type]
    if (!list.length) return null
    return list.find((asset) => asset.id === selectedVersion[type]) ?? list[0]
  }

  const settings = project?.generation_settings ?? {}

  // Assets created before the current target-product settings still describe
  // the old offer - surface that rather than letting the two drift apart.
  const hasStaleAssets = useMemo(() => {
    if (isEmptySettings(settings) || !settings.updated_at) return false
    const savedAt = new Date(settings.updated_at)
    return assets.some((asset) => new Date(asset.created_at) < savedAt)
  }, [assets, settings])

  if (loading) return <LoadingScreen label="Loading project…" />

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl">
        <Banner tone="danger" title="Project unavailable">
          {loadError}
        </Banner>
        <Button to="/app" variant="secondary" className="mt-5">
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Button>
      </div>
    )
  }

  const status = PROJECT_STATUS[project.status] ?? PROJECT_STATUS.draft
  const isAnalyzed = project.status === 'analyzed' && Boolean(project.analysis)
  const busy = analyzing || project.status === 'analyzing'

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/app', label: 'All projects' }}
        title={project.name}
        badge={
          <Badge tone={busy ? 'info' : status.tone}>
            <Dot tone={busy ? 'info' : status.tone} />
            {busy ? 'Analysing' : status.label}
          </Badge>
        }
        meta={
          <>
            {project.source_type === 'file' && project.source_filename
              ? project.source_filename
              : 'Pasted text'}{' '}
            · {wordCount(project.vsl_text).toLocaleString()} words · created{' '}
            {timeAgo(project.created_at)}
            {project.analyzed_at ? ` · analysed ${timeAgo(project.analyzed_at)}` : ''}
          </>
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setRenameValue(project.name)
                setRenameOpen(true)
              }}
            >
              Rename
            </Button>
            {isAnalyzed && (
              <Button variant="secondary" size="sm" onClick={handleAnalyze} loading={analyzing}>
                <Refresh className="h-4 w-4" />
                Re-analyse
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              aria-label="Delete project"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {/* Analysis gate ------------------------------------------------ */}
      {!isAnalyzed && (
        <div className="card p-8 text-center">
          {busy ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15">
                <Sparkles className="h-7 w-7 animate-pulse text-brand-300" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-white">Reading your VSL…</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-400">
                The AI is extracting the promise, audience, pains, desires, mechanism and offer.
                This usually takes 20–60 seconds — keep this tab open.
              </p>
              <div className="mx-auto mt-6 h-1.5 w-64 overflow-hidden rounded-full bg-ink-800">
                <div className="h-full w-1/3 animate-[float_2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-brand-500 to-accent-500" />
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-white">
                {project.status === 'failed' ? 'The last analysis failed' : 'Ready to analyse'}
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-400">
                {project.status === 'failed'
                  ? 'Nothing was saved. Check the message below, then try again.'
                  : 'One analysis produces the shared brief that both your sales page and your quiz are built from.'}
              </p>

              {project.error_message && (
                <Banner tone="danger" className="mx-auto mt-5 max-w-lg text-left">
                  {project.error_message}
                </Banner>
              )}

              <Button size="lg" className="mt-7" onClick={handleAnalyze} loading={analyzing}>
                <Sparkles className="h-5 w-5" />
                {project.status === 'failed' ? 'Try again' : 'Analyse this VSL'}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Tabs --------------------------------------------------------- */}
      <div className="sticky top-16 z-30 -mx-4 flex gap-1 overflow-x-auto border-b border-ink-800 bg-ink-950/85 px-4 backdrop-blur-xl scrollbar-none sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {TABS.map((item) => {
          const locked = item.id !== 'source' && item.id !== 'analysis' && !isAnalyzed
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              disabled={locked}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                tab === item.id
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-ink-400 hover:text-ink-100',
                locked && 'cursor-not-allowed opacity-40 hover:text-ink-400',
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
              {item.id === 'sales_page' && byType.sales_page.length > 0 && (
                <span className="rounded-full bg-ink-700 px-1.5 text-[11px] text-ink-200">
                  {byType.sales_page.length}
                </span>
              )}
              {item.id === 'quiz' && byType.quiz.length > 0 && (
                <span className="rounded-full bg-ink-700 px-1.5 text-[11px] text-ink-200">
                  {byType.quiz.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Panels ------------------------------------------------------- */}
      {tab === 'analysis' &&
        (isAnalyzed ? (
          <>
            <GenerationSettings
              settings={settings}
              analysis={project.analysis}
              saving={savingSettings}
              onSave={handleSaveSettings}
              hasAssets={hasStaleAssets}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {GENERATORS.map((generator) => (
                <GenerateCard
                  key={generator.type}
                  icon={generator.icon}
                  title={t(generator.titleKey)}
                  description={t(generator.descKey)}
                  accent={generator.accent}
                  count={byType[generator.type].length}
                  loading={Boolean(generating[generator.type])}
                  onGenerate={() => handleGenerate(generator.type)}
                  onOpen={() => setTab(generator.type)}
                />
              ))}
            </div>

            <AnalysisPanel analysis={project.analysis} />

            {project.analysis_model && (
              <p className="text-center text-xs text-ink-600">
                Analysed with {project.analysis_model} on {formatDateTime(project.analyzed_at)}
              </p>
            )}
          </>
        ) : (
          !busy && (
            <EmptyState
              icon={Sparkles}
              title="No analysis yet"
              description="Run the analysis to unlock the sales page and quiz generators."
            />
          )
        ))}

      {ASSET_KIND[tab] && (
        <AssetPanel
          type={tab}
          assets={byType[tab]}
          active={activeAsset(tab)}
          projectName={project.name}
          loading={generating[tab]}
          onGenerate={() => handleGenerate(tab)}
          onSelect={(assetId) =>
            setSelectedVersion((current) => ({ ...current, [tab]: assetId }))
          }
        />
      )}

      {tab === 'source' && (
        <div className="card p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white">VSL transcript</h2>
              <p className="mt-1 text-sm text-ink-500">
                {project.vsl_text.length.toLocaleString()} characters ·{' '}
                {wordCount(project.vsl_text).toLocaleString()} words · ≈{' '}
                {readingMinutes(project.vsl_text)} min spoken
              </p>
            </div>
            {project.storage_path && (
              <Button variant="secondary" size="sm" onClick={handleDownloadSource}>
                <Download className="h-4 w-4" />
                Original file
              </Button>
            )}
          </div>

          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl bg-ink-950/70 p-5 text-sm leading-relaxed text-ink-300">
            {project.vsl_text}
          </pre>
        </div>
      )}

      {/* Dialogs ------------------------------------------------------ */}
      <Modal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} loading={renaming}>
              Save
            </Button>
          </>
        }
      >
        <Input
          label="Project name"
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          maxLength={160}
          autoFocus
        />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this project?"
        confirmLabel="Delete project"
        message="The VSL, its analysis and every generated asset will be permanently removed. This cannot be undone."
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function GenerateCard({
  icon: IconComponent,
  title,
  description,
  count,
  loading,
  onGenerate,
  onOpen,
  accent = false,
}) {
  return (
    <div className="card card-hover relative flex flex-col overflow-hidden p-6">
      <span
        aria-hidden="true"
        className={cn(
          'absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl transition-opacity',
          accent ? 'bg-accent-500/10' : 'bg-brand-500/10',
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <span
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl border',
            accent
              ? 'border-accent-500/25 bg-accent-500/12 text-accent-400'
              : 'border-brand-500/25 bg-brand-500/12 text-brand-300',
          )}
        >
          <IconComponent className="h-6 w-6" />
        </span>

        {count > 0 && (
          <Badge tone="success">
            <Check className="h-3.5 w-3.5" />
            {count === 1 ? '1 version' : `${count} versions`}
          </Badge>
        )}
      </div>

      <h3 className="relative mt-4 text-[15px] font-semibold text-white">{title}</h3>
      <p className="relative mt-1.5 flex-1 text-sm leading-relaxed text-ink-400">{description}</p>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <Button onClick={onGenerate} loading={loading} size="sm">
          <Sparkles className="h-4 w-4" />
          {count > 0 ? 'Generate again' : 'Generate'}
        </Button>
        {count > 0 && (
          <Button variant="secondary" size="sm" onClick={onOpen}>
            <Eye className="h-4 w-4" />
            Open
          </Button>
        )}
      </div>
    </div>
  )
}

function AssetPanel({ type, assets, active, projectName, loading, onGenerate, onSelect }) {
  const t = useT()
  const generator = GENERATORS.find((item) => item.type === type)
  const EmptyIcon = generator?.icon ?? FileText

  if (!assets.length) {
    return (
      <EmptyState
        icon={EmptyIcon}
        title={t(
          {
            sales_page: 'assets.emptySalesPage',
            quiz: 'assets.emptyQuiz',
            product: 'assets.emptyProduct',
            ad_creative: 'assets.emptyAd',
          }[type],
        )}
        description={t('assets.emptyBody')}
        action={
          <Button size="lg" onClick={onGenerate} loading={loading}>
            <Sparkles className="h-5 w-5" />
            {t('common.generate')}
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-white">{active?.title || ASSET_LABEL[type]}</h2>
          <p className="text-sm text-ink-500">
            Version {active?.version} · generated {timeAgo(active?.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {assets.length > 1 && (
            <Select
              value={active?.id}
              onChange={onSelect}
              align="right"
              className="w-56"
              options={assets.map((asset) => ({
                value: asset.id,
                label: `Version ${asset.version}`,
                description: timeAgo(asset.created_at),
              }))}
            />
          )}
          <Button variant="secondary" size="sm" onClick={onGenerate} loading={loading}>
            <Refresh className="h-4 w-4" />
            Regenerate
          </Button>
        </div>
      </div>

      {active && (
        <CodeStudio
          code={active.code}
          title={active.title}
          kind={ASSET_KIND[type]}
          printable={type === 'product'}
          downloadName={`${projectName}-${type.replace('_', '-')}-v${active.version}`}
          meta={active.model ? t('assets.generatedWith', { model: active.model }) : null}
        />
      )}
    </div>
  )
}
