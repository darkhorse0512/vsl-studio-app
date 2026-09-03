import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import { Logo } from '../components/Icons'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <Link to="/" className="mb-8">
        <Logo className="h-11 w-11" />
      </Link>
      <p className="text-7xl font-bold text-gradient">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">This page does not exist</h1>
      <p className="mt-2 max-w-sm text-ink-400">
        The link may be broken, or the page may have been moved.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button to="/">Back to home</Button>
        <Button to="/app" variant="secondary">
          Go to dashboard
        </Button>
      </div>
    </div>
  )
}
