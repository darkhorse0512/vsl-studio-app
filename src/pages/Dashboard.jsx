import { useCallback, useEffect, useMemo, useState } from 'react'
import { useT } from '../i18n'
import { Link } from 'react-router-dom'
import { deleteProject, listProjects } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { PROJECT_STATUS, cn, timeAgo } from '../lib/utils'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import { Badge, Banner, Dot, EmptyState, Skeleton } from '../components/ui/Feedback'
import { ConfirmDialog } from '../components/ui/Modal'
import {
  ArrowRight,
  FileText,
  Grid,
  Layers,
  Plus,
  Puzzle,
  Sparkles,
  Trash,
} from '../components/Icons'

const FILTERS = [
  ['all', 'common.all'],
  ['analyzed', 'dashboard.filterAnalysed'],
  ['draft', 'dashboard.filterDraft'],
  ['failed', 'dashboard.filterFailed'],
]

export default function Dashboard() {
  const t = useT()
  const { profile } = useAuth()
  const toast = useToast()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProjects(await listProjects())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    const assets = projects.flatMap((project) => project.assets ?? [])
    return {
      projects: projects.length,
      analysed: projects.filter((project) => project.status === 'analyzed').length,
      salesPages: assets.filter((asset) => asset.type === 'sales_page').length,
      quizzes: assets.filter((asset) => asset.type === 'quiz').length,
    }
  }, [projects])

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()

    return projects.filter((project) => {
      if (filter !== 'all' && project.status !== filter) return false
      if (!term) return true
      return (
        project.name.toLowerCase().includes(term) ||
        (project.source_filename ?? '').toLowerCase().includes(term)
      )
    })
  }, [projects, query, filter])

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteProject(pendingDelete.id)
      setProjects((current) => current.filter((project) => project.id !== pendingDelete.id))
      toast.success(t('dashboard.deleted', { name: pendingDelete.name }))
      setPendingDelete(null)
    } catch (deleteError) {
      toast.error(deleteError.message)
    } finally {
      setDeleting(false)
    }
  }

  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <>
      <PageHeader
        title={firstName ? t('dashboard.welcome', { name: firstName }) : t('dashboard.titleFallback')}
        description={t('dashboard.subtitle')}
        actions={
          <Button to="/app/new">
            <Plus className="h-4.5 w-4.5" />
            {t('nav.newProject')}
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Stats ------------------------------------------------------ */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile icon={Layers} label={t('dashboard.statProjects')} value={stats.projects} loading={loading} />
          <StatTile icon={Sparkles} label={t('dashboard.statAnalysed')} value={stats.analysed} loading={loading} />
          <StatTile
            icon={FileText}
            label={t('dashboard.statPages')}
            value={stats.salesPages}
            loading={loading}
            tone="brand"
          />
          <StatTile
            icon={Puzzle}
            label={t('dashboard.statQuizzes')}
            value={stats.quizzes}
            loading={loading}
            tone="accent"
          />
        </div>

        {error && (
          <Banner
            tone="danger"
            title={t('dashboard.loadError')}
            action={
              <Button size="sm" variant="secondary" onClick={load}>
                {t('common.retry')}
              </Button>
            }
          >
            {error}
          </Banner>
        )}

        {/* Toolbar ---------------------------------------------------- */}
        {(projects.length > 0 || loading) && (
          <div className="flex flex-col gap-3 rounded-2xl border border-ink-800 bg-ink-900/50 p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('dashboard.searchPlaceholder')}
                aria-label={t('dashboard.searchPlaceholder')}
                className="h-10 w-full rounded-xl border border-ink-800 bg-ink-950/60 pl-10 pr-4 text-sm text-ink-50 placeholder:text-ink-500 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto rounded-xl border border-ink-800 bg-ink-950/60 p-1 scrollbar-none">
              {FILTERS.map(([value, labelKey]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                  className={cn(
                    'shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
                    filter === value
                      ? 'bg-ink-700 text-white shadow-sm'
                      : 'text-ink-400 hover:text-ink-100',
                  )}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List ------------------------------------------------------- */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="card space-y-4 p-6">
                <div className="flex gap-3">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={t('dashboard.emptyTitle')}
            description={t('dashboard.emptyBody')}
            action={
              <Button to="/app/new" size="lg">
                <Plus className="h-5 w-5" />
                {t('nav.newProject')}
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Grid}
            title={t('dashboard.noMatchTitle')}
            description={t('dashboard.noMatchBody')}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('')
                  setFilter('all')
                }}
              >
                {t('common.clearFilters')}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={() => setPendingDelete(project)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t('dashboard.deleteTitle')}
        confirmLabel={t('dashboard.deleteConfirm')}
        message={t('dashboard.deleteBody', { name: pendingDelete?.name })}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */

const TONE_CLASSES = {
  default: 'text-ink-400 bg-ink-800/80',
  brand: 'text-brand-300 bg-brand-500/12',
  accent: 'text-accent-400 bg-accent-500/12',
}

function StatTile({ icon: IconComponent, label, value, loading, tone = 'default' }) {
  return (
    <div className="card card-hover p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            TONE_CLASSES[tone],
          )}
        >
          <IconComponent className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-ink-500">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-1.5 h-6 w-10" />
          ) : (
            <p className="text-2xl font-bold leading-tight text-white">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project, onDelete }) {
  const t = useT()
  const status = PROJECT_STATUS[project.status] ?? PROJECT_STATUS.draft
  const assets = project.assets ?? []
  const pages = assets.filter((asset) => asset.type === 'sales_page').length
  const quizzes = assets.filter((asset) => asset.type === 'quiz').length

  return (
    <article className="card card-hover group relative flex flex-col overflow-hidden p-5">
      {/* hairline that lights up on hover */}
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-800 bg-ink-950/60 text-brand-300">
          <Layers className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <Link
            to={`/app/projects/${project.id}`}
            className="line-clamp-2 text-[15px] font-semibold leading-snug text-white transition-colors hover:text-brand-300"
          >
            {project.name}
            <span className="absolute inset-0" aria-hidden="true" />
          </Link>
          <p className="mt-1 truncate text-xs text-ink-500">
            {project.source_type === 'file' && project.source_filename
              ? project.source_filename
              : t('dashboard.pastedText')}{' '}
            · {timeAgo(project.created_at)}
          </p>
        </div>

        <Badge tone={status.tone} className="shrink-0">
          <Dot tone={status.tone} />
          {t(status.labelKey)}
        </Badge>
      </div>

      {project.status === 'failed' && project.error_message && (
        <p className="mt-4 line-clamp-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-300">
          {project.error_message}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {pages > 0 && (
          <Badge tone="brand">
            <FileText className="h-3.5 w-3.5" />
            {pages > 1 ? `${pages} ${t('dashboard.statPages')}` : t('assets.salesPage')}
          </Badge>
        )}
        {quizzes > 0 && (
          <Badge tone="brand">
            <Puzzle className="h-3.5 w-3.5" />
            {quizzes > 1 ? `${quizzes} ${t('dashboard.statQuizzes')}` : t('project.tabQuiz')}
          </Badge>
        )}
        {assets.length === 0 && (
          <span className="text-xs text-ink-500">{t(status.hintKey)}</span>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-ink-800 pt-4">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 transition-colors group-hover:text-brand-300">
          {t('dashboard.openProject')}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onDelete()
          }}
          aria-label={`${t('common.delete')} ${project.name}`}
          className="relative z-10 rounded-lg p-2 text-ink-500 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}
