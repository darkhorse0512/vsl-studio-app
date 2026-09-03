import { Link } from 'react-router-dom'
import { APP_NAME } from '../lib/supabase'
import { Check, Logo } from './Icons'

const HIGHLIGHTS = [
  'One analysis powers both your sales page and your quiz',
  'Responsive, dependency-free HTML you can export in one click',
  'Live desktop and mobile preview inside the dashboard',
  'Every project private to your account',
]

/** Split-screen shell shared by all authentication screens. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side ---------------------------------------------------- */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link to="/" className="inline-flex items-center gap-2.5 self-start">
          <Logo className="h-9 w-9" />
          <span className="text-lg font-semibold text-white">{APP_NAME}</span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md animate-fade-up">
            <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="mt-2.5 text-ink-400">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-ink-400">{footer}</div>}
          </div>
        </div>
      </div>

      {/* Brand side --------------------------------------------------- */}
      <div className="relative hidden overflow-hidden border-l border-ink-800 lg:block">
        <div className="surface-grid absolute inset-0 opacity-30" />
        <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-brand-600/20 blur-[110px]" />
        <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-accent-600/15 blur-[110px]" />

        <div className="relative flex h-full flex-col justify-center px-14">
          <blockquote className="max-w-md">
            <p className="text-3xl font-bold leading-tight tracking-tight text-white">
              Stop rewriting the same offer three different ways.
            </p>
            <p className="mt-5 leading-relaxed text-ink-300">
              {APP_NAME} reads your VSL once and builds every asset from that single brief, so the
              promise your page makes is the promise your quiz delivers.
            </p>
          </blockquote>

          <ul className="mt-10 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-ink-200">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
