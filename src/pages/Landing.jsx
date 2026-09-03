import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { APP_NAME } from '../lib/supabase'
import Button from '../components/ui/Button'
import { Badge } from '../components/ui/Feedback'
import {
  ArrowRight,
  Bolt,
  Check,
  Code,
  FileText,
  Layers,
  Puzzle,
  Shield,
  Sparkles,
  Target,
  Upload,
} from '../components/Icons'

const STEPS = [
  {
    icon: Upload,
    title: 'Bring your VSL',
    body: 'Paste the script straight into the dashboard or upload it as a .txt or .pdf. We extract the text in your browser before anything is sent.',
  },
  {
    icon: Sparkles,
    title: 'The AI reads it like a strategist',
    body: 'One deep analysis pulls out the promise, the audience, every pain and desire, the unique mechanism, the full offer stack and the objections.',
  },
  {
    icon: Layers,
    title: 'Two assets, one story',
    body: 'A long-form sales page and an interactive quiz are generated from that same brief — preview them, copy the code, or export the HTML.',
  },
]

const FEATURES = [
  {
    icon: Target,
    title: 'Strategic analysis, not a summary',
    body: 'Awareness level, psychographics, mechanism, offer stack, objections and proof — the same brief a senior copywriter would write before touching a page.',
  },
  {
    icon: Layers,
    title: 'Guaranteed consistency',
    body: 'Both assets are generated from one stored analysis. The promise, audience and offer cannot drift apart between your page and your quiz.',
  },
  {
    icon: Code,
    title: 'Clean, self-contained HTML',
    body: 'One file per asset. No frameworks, no CDNs, no build step. Drop it on any host, funnel builder or landing page tool and it just works.',
  },
  {
    icon: Bolt,
    title: 'Live preview built in',
    body: 'See the real rendered page in desktop and mobile widths inside your dashboard before you ship a single line.',
  },
  {
    icon: Shield,
    title: 'Private by default',
    body: 'Every project is locked to your account with database-level row security. Previews run in a sandboxed frame that cannot touch your session.',
  },
  {
    icon: Puzzle,
    title: 'Versioned regeneration',
    body: 'Not happy with a result? Generate again. Every version is kept so you can compare angles and go back to the one that converted.',
  },
]

const SALES_PAGE_SECTIONS = [
  'Headline and subheadline',
  'Pain points that mirror the reader',
  'Desires and the future state',
  'The unique mechanism',
  'The solution, step by step',
  'Benefit grid',
  'Offer stack, bonuses and price',
  'Guarantee and scarcity',
  'Objection handling',
  'FAQ accordion',
  'Repeated calls to action',
]

const QUIZ_FEATURES = [
  'Engaging title and intro screen',
  '6–8 multiple-choice questions',
  'Back / next navigation',
  'Progress bar and question counter',
  'Weighted scoring across outcomes',
  'Personalised result profile',
  'Call to action tied to the offer',
  'Retake without reloading',
]

const FAQ = [
  {
    q: 'What exactly do I get from one VSL?',
    a: 'Two production-ready HTML files: a long-form responsive sales page and an interactive quiz with its own JavaScript. Both come from a single analysis of your script, so the promise, audience, pains, desires, mechanism and offer stay identical across them.',
  },
  {
    q: 'Which file formats can I upload?',
    a: 'Plain text (.txt), Markdown (.md) and PDF (.pdf). PDFs are parsed in your browser, so scanned documents without a text layer will not work — paste the transcript instead. You can always paste the script directly.',
  },
  {
    q: 'Can I edit the generated code?',
    a: 'Yes. Copy it to your clipboard or export the .html file and edit it in any editor. Everything is standard HTML, CSS and vanilla JavaScript with no dependencies.',
  },
  {
    q: 'Why does my account need approval?',
    a: 'Generation runs on paid AI capacity, so every new account is reviewed by an administrator before it is enabled. You can sign up straight away and you will get access as soon as your account is approved.',
  },
  {
    q: 'Will the AI invent testimonials or prices?',
    a: 'No. The analysis is explicitly instructed to work only from your transcript. If your VSL has no testimonials, guarantee or price, those sections are left out rather than fabricated.',
  },
]

export default function Landing() {
  const { isAuthenticated, profile } = useAuth()
  const primaryHref = isAuthenticated
    ? profile?.status === 'approved'
      ? '/app'
      : '/pending'
    : '/signup'

  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden">
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />

        <div className="container-page relative pb-20 pt-16 sm:pb-28 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="brand" className="animate-fade-in">
              <Sparkles className="h-3.5 w-3.5" />
              One analysis. Two conversion assets.
            </Badge>

            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-white animate-fade-up sm:text-6xl">
              Turn any VSL into a <span className="text-gradient">sales page</span> and an{' '}
              <span className="text-gradient">interactive quiz</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-300 animate-fade-up">
              Paste your video sales letter or upload the file. {APP_NAME} reads it like a
              direct-response strategist and builds both assets from the same brief — so your
              promise, audience and offer never contradict each other.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button to={primaryHref} size="lg" className="w-full sm:w-auto">
                {isAuthenticated ? 'Open your dashboard' : 'Start free'}
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button href="#how-it-works" variant="outline" size="lg" className="w-full sm:w-auto">
                See how it works
              </Button>
            </div>

            <p className="mt-4 text-sm text-ink-500">
              No credit card required · New accounts are enabled by an administrator
            </p>
          </div>

          <HeroPreview />
        </div>
      </section>

      {/* ========================= HOW IT WORKS ======================== */}
      <section id="how-it-works" className="border-t border-ink-800 py-20 sm:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="How it works"
            title="From script to shippable in three steps"
            subtitle="No prompt engineering, no copy-paste juggling between tools."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="card card-hover relative p-7">
                <span className="absolute right-6 top-6 text-5xl font-bold text-ink-800">
                  {index + 1}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================== CONSISTENCY ======================== */}
      <section className="py-4">
        <div className="container-page">
          <div className="card relative overflow-hidden p-8 sm:p-12">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-600/15 blur-[90px]" />
            <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <Badge tone="brand">
                  <Layers className="h-3.5 w-3.5" />
                  The core principle
                </Badge>
                <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Both assets are built from a single shared brief
                </h2>
                <p className="mt-4 leading-relaxed text-ink-300">
                  Most teams generate a page in one tool and a quiz in another, and the two end up
                  promising different things to different people. {APP_NAME} analyses your VSL
                  once, stores that brief, and renders every asset from it.
                </p>
                <ul className="mt-6 space-y-2.5">
                  {[
                    'The same promise, word for word',
                    'The same audience and awareness level',
                    'The same pains, desires and mechanism',
                    'The same offer, guarantee and call to action',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-ink-200">
                      <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <ConsistencyDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* =========================== FEATURES ========================== */}
      <section id="features" className="py-20 sm:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Features"
            title="Built for people who ship funnels"
            subtitle="Everything you need between the script and the live page."
          />

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card card-hover p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-800 text-brand-300">
                  <feature.icon className="h-5.5 w-5.5" />
                </div>
                <h3 className="mt-4 font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================= WHAT YOU GET ======================== */}
      <section id="assets" className="border-t border-ink-800 py-20 sm:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="What you get"
            title="Two assets, ready to publish"
            subtitle="Each one is a single self-contained HTML file."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <AssetCard
              icon={FileText}
              title="Long-form sales page"
              description="A responsive, conversion-structured page written in your VSL's own language and tone."
              items={SALES_PAGE_SECTIONS}
            />
            <AssetCard
              icon={Puzzle}
              title="Interactive quiz"
              description="A segmenting quiz that qualifies the same audience and hands them to the same offer."
              items={QUIZ_FEATURES}
              accent
            />
          </div>
        </div>
      </section>

      {/* ============================= FAQ ============================= */}
      <section id="faq" className="py-20 sm:py-24">
        <div className="container-page max-w-3xl">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" />

          <div className="mt-12 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="card group px-5 py-4 transition-colors [&[open]]:border-ink-600"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-white marker:hidden">
                  {item.q}
                  <span className="shrink-0 text-ink-500 transition-transform duration-200 group-open:rotate-45">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-400">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ========================== FINAL CTA ========================== */}
      <section className="pb-24">
        <div className="container-page">
          <div className="card glow relative overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-600/15 via-transparent to-accent-600/15" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Your next funnel is one VSL away
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-ink-300">
                Create your account, upload a script, and see both assets rendered in your
                dashboard.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button to={primaryHref} size="lg">
                  {isAuthenticated ? 'Open your dashboard' : 'Create your account'}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                {!isAuthenticated && (
                  <Link to="/login" className="text-sm link-muted">
                    or sign in to an existing account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Presentational pieces                                               */
/* ------------------------------------------------------------------ */

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-400">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-ink-400">{subtitle}</p>}
    </div>
  )
}

function AssetCard({ icon: IconComponent, title, description, items, accent = false }) {
  return (
    <div className="card card-hover flex flex-col p-7">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          accent ? 'bg-accent-500/15 text-accent-400' : 'bg-brand-500/15 text-brand-300'
        }`}
      >
        <IconComponent className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-400">{description}</p>

      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-ink-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Stylised mock of the dashboard's dual preview. */
function HeroPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl animate-fade-up">
      <div className="card overflow-hidden p-2 shadow-2xl sm:p-3">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 text-xs text-ink-500">vsl-studio / project / assets</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          <MockSalesPage />
          <MockQuiz />
        </div>
      </div>
    </div>
  )
}

function MockSalesPage() {
  return (
    <div className="rounded-xl border border-ink-800 bg-white p-5 text-ink-950">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-600">
        Sales page
      </p>
      <div className="mt-3 h-3 w-11/12 rounded bg-ink-900/85" />
      <div className="mt-1.5 h-3 w-8/12 rounded bg-ink-900/85" />
      <div className="mt-3 space-y-1.5">
        <div className="h-1.5 w-full rounded bg-ink-300" />
        <div className="h-1.5 w-10/12 rounded bg-ink-300" />
      </div>
      <div className="mt-4 h-7 w-32 rounded-lg bg-gradient-to-r from-brand-600 to-accent-600" />
      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-md border border-ink-200 p-2">
            <div className="h-1.5 w-full rounded bg-ink-300" />
            <div className="mt-1 h-1.5 w-2/3 rounded bg-ink-200" />
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-md border border-dashed border-brand-300 bg-brand-50 p-2">
        <div className="h-1.5 w-1/2 rounded bg-brand-300" />
        <div className="mt-1 h-1.5 w-3/4 rounded bg-brand-200" />
      </div>
    </div>
  )
}

function MockQuiz() {
  return (
    <div className="rounded-xl border border-ink-800 bg-white p-5 text-ink-950">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-600">Quiz</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="h-1.5 w-20 rounded bg-ink-300" />
        <div className="h-1.5 w-12 rounded bg-ink-200" />
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
        <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-brand-500 to-accent-500" />
      </div>
      <div className="mt-4 h-3 w-10/12 rounded bg-ink-900/85" />
      <div className="mt-4 space-y-2">
        {[true, false, false].map((selected, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 rounded-lg border p-2 ${
              selected ? 'border-brand-500 bg-brand-50' : 'border-ink-200'
            }`}
          >
            <span
              className={`h-3 w-3 rounded-full border-2 ${
                selected ? 'border-brand-600 bg-brand-600' : 'border-ink-300'
              }`}
            />
            <div className="h-1.5 flex-1 rounded bg-ink-300" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <div className="h-6 w-16 rounded-lg border border-ink-200" />
        <div className="h-6 w-20 rounded-lg bg-gradient-to-r from-brand-600 to-accent-600" />
      </div>
    </div>
  )
}

function ConsistencyDiagram() {
  return (
    <div className="relative">
      <div className="card bg-ink-950/60 p-6">
        <div className="mx-auto max-w-xs rounded-xl border border-ink-700 bg-ink-900 p-4 text-center">
          <FileText className="mx-auto h-6 w-6 text-ink-300" />
          <p className="mt-2 text-sm font-medium text-white">Your VSL</p>
          <p className="text-xs text-ink-500">pasted or uploaded</p>
        </div>

        <div className="mx-auto my-3 h-6 w-px bg-gradient-to-b from-ink-600 to-brand-500" />

        <div className="mx-auto max-w-xs rounded-xl border border-brand-500/40 bg-brand-500/10 p-4 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-brand-300" />
          <p className="mt-2 text-sm font-medium text-white">Shared analysis</p>
          <p className="text-xs text-brand-300/80">promise · audience · offer</p>
        </div>

        <div className="mx-auto mt-3 flex max-w-xs items-start justify-center gap-8">
          <div className="h-6 w-px bg-gradient-to-b from-brand-500 to-ink-600" />
          <div className="h-6 w-px bg-gradient-to-b from-brand-500 to-ink-600" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 text-center">
            <FileText className="mx-auto h-5 w-5 text-brand-300" />
            <p className="mt-2 text-xs font-medium text-white">Sales page</p>
          </div>
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 text-center">
            <Puzzle className="mx-auto h-5 w-5 text-accent-400" />
            <p className="mt-2 text-xs font-medium text-white">Quiz</p>
          </div>
        </div>
      </div>
    </div>
  )
}
