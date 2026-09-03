import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { APP_NAME, SUPPORT_EMAIL } from '../lib/supabase'
import { cn } from '../lib/utils'
import Button from './ui/Button'
import { Logo, Menu, X } from './Icons'

const LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#features', label: 'Features' },
  { href: '/#assets', label: 'What you get' },
  { href: '/#faq', label: 'FAQ' },
]

export default function MarketingLayout() {
  const { isAuthenticated, profile } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const dashboardHref = profile?.status === 'approved' ? '/app' : '/pending'

  return (
    <div className="flex min-h-screen flex-col bg-ink-950">
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-ink-800 bg-ink-950/85 backdrop-blur-lg'
            : 'border-b border-transparent',
        )}
      >
        <div className="container-page flex h-16 items-center gap-6 sm:h-18">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="text-lg font-semibold tracking-tight text-white">{APP_NAME}</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-7 md:flex">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm link-muted">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <Button to={dashboardHref} size="sm">
                Go to dashboard
              </Button>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm">
                  Sign in
                </Button>
                <Button to="/signup" size="sm">
                  Create account
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="ml-auto rounded-lg p-2 text-ink-300 hover:bg-ink-800 hover:text-white md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-ink-800 bg-ink-950/95 px-5 py-4 backdrop-blur md:hidden">
            <nav className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-ink-200 hover:bg-ink-800 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              {isAuthenticated ? (
                <Button to={dashboardHref}>Go to dashboard</Button>
              ) : (
                <>
                  <Button to="/login" variant="secondary">
                    Sign in
                  </Button>
                  <Button to="/signup">Create account</Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink-800 bg-ink-950">
        <div className="container-page py-12">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <Link to="/" className="flex items-center gap-2.5">
                <Logo className="h-8 w-8" />
                <span className="font-semibold text-white">{APP_NAME}</span>
              </Link>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">
                One VSL in. A conversion-ready sales page and an interactive quiz out — built
                from the same analysis, so every asset tells the same story.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 text-sm sm:gap-16">
              <div>
                <p className="mb-3 font-semibold text-white">Product</p>
                <ul className="space-y-2">
                  {LINKS.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="link-muted">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 font-semibold text-white">Account</p>
                <ul className="space-y-2">
                  <li>
                    <Link to="/login" className="link-muted">
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link to="/signup" className="link-muted">
                      Create account
                    </Link>
                  </li>
                  <li>
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="link-muted">
                      Support
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-ink-800 pt-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
            <p>New accounts are reviewed by an administrator before access is granted.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
