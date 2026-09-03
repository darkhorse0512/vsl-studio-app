import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteProject, listProjects } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { ASSET_LABEL, PROJECT_STATUS, cn, timeAgo } from '../lib/utils'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Form'
import { Badge, Banner, Dot, EmptyState, Skeleton } from '../components/ui/Feedback'
import { ConfirmDialog } from '../components/ui/Modal'
import { ArrowRight, FileText, Grid, Plus, Puzzle, Sparkles, Trash } from '../components/Icons'

export default function Dashboard() {
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
      salesPages: assets.filter((asset) => asset.type === 'sales_page').length,
      quizzes: assets.filter((asset) => asset.type === 'quiz').length,
      analysed: projects.filter((project) => project.status === 'analyzed').length,
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
      toast.success(`"${pendingDelete.name}" was deleted.`)
      setPendingDelete(null)
    } catch (deleteError) {
      toast.error(deleteError.message)
    } finally {
      setDeleting(false)
    }
  }

  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="space-y-8">
      {/* Header ------------------------------------------------------- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {firstName ? `Welcome back, ${firstName}` : 'Your projects'}
          </h1>
          <p className="mt-1.5 text-ink-400">
            Every project holds one VSL analysis and the assets generated from it.
          </p>
        </div>
        <Button to="/app/new" size="md">
          <Plus className="h-4.5 w-4.5" />
          New project
        </Button>
      </div>

      {/* Stats -------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Grid} label="Projects" value={stats.projects} />
        <StatCard icon={Sparkles} label="Analysed" value={stats.analysed} />
        <StatCard icon={FileText} label="Sales pages" value={stats.salesPages} />
        <StatCard icon={Puzzle} label="Quizzes" value={stats.quizzes} />
      </div>

      {error && (
        <Banner tone="danger" title="Could not load your projects" action={
          <Button size="sm" variant="secondary" onClick={load}>
            Retry
          </Button>
        }>
          {error}
        </Banner>
      )}

      {/* Filters ------------------------------------------------------ */}
      {(projects.length > 0 || loading) && (
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="search"
            placeholder="Search projects…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:max-w-xs"
            aria-label="Search projects"
          />
          <div className="flex flex-wrap gap-1.5">
            {[
              ['all', 'All'],
              ['analyzed', 'Analysed'],
              ['draft', 'Draft'],
              ['failed', 'Failed'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  filter === value
                    ? 'bg-ink-700 text-white'
                    : 'text-ink-400 hover:bg-ink-800 hover:text-ink-100',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List --------------------------------------------------------- */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="card space-y-3 p-6">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Create your first project"
          description="Paste a VSL script or upload a .txt or .pdf file. We will analyse it and generate a sales page and a quiz from the same brief."
          action={
            <Button to="/app/new" size="lg">
              <Plus className="h-5 w-5" />
              New project
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Grid}
          title="No projects match your filters"
          description="Try a different search term or clear the status filter."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setFilter('all')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={() => setPendingDelete(project)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this project?"
        confirmLabel="Delete project"
        message={`"${pendingDelete?.name}" and every asset generated from it will be permanently removed. This cannot be undone.`}
      />
    </div>
  )
}

function StatCard({ icon: IconComponent, label, value }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-400">{label}</p>
        <IconComponent className="h-4.5 w-4.5 text-ink-500" />
      </div>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

function ProjectCard({ project, onDelete }) {
  const status = PROJECT_STATUS[project.status] ?? PROJECT_STATUS.draft
  const assets = project.assets ?? []

  const counts = {
    sales_page: assets.filter((asset) => asset.type === 'sales_page').length,
    quiz: assets.filter((asset) => asset.type === 'quiz').length,
  }

  return (
    <div className="card card-hover group relative flex flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            to={`/app/projects/${project.id}`}
            className="block truncate text-lg font-semibold text-white hover:text-brand-300"
          >
            {project.name}
          </Link>
          <p className="mt-1 text-xs text-ink-500">
            {project.source_type === 'file' && project.source_filename
              ? project.source_filename
              : 'Pasted text'}{' '}
            · created {timeAgo(project.created_at)}
          </p>
        </div>

        <Badge tone={status.tone}>
          <Dot tone={status.tone} />
          {status.label}
        </Badge>
      </div>

      {project.status === 'failed' && project.error_message && (
        <p className="mt-3 line-clamp-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {project.error_message}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {counts.sales_page > 0 && (
          <Badge tone="brand">
            <FileText className="h-3.5 w-3.5" />
            {ASSET_LABEL.sales_page}
            {counts.sales_page > 1 ? ` ×${counts.sales_page}` : ''}
          </Badge>
        )}
        {counts.quiz > 0 && (
          <Badge tone="brand">
            <Puzzle className="h-3.5 w-3.5" />
            {ASSET_LABEL.quiz}
            {counts.quiz > 1 ? ` ×${counts.quiz}` : ''}
          </Badge>
        )}
        {assets.length === 0 && <span className="text-xs text-ink-500">{status.hint}</span>}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-ink-800 pt-4">
        <Link
          to={`/app/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
        >
          Open project
          <ArrowRight className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${project.name}`}
          className="rounded-lg p-2 text-ink-500 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
