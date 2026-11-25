import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isChunkLoadError, reloadForChunkError } from '@/lib/lazyWithRetry'

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: '',
      isChunkError: false,
      autoReloading: false,
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected application error',
      isChunkError: isChunkLoadError(error),
    }
  }

  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught an error:', error, info)

    if (isChunkLoadError(error)) {
      // Stale chunk after a deployment — fetch the latest build automatically.
      // The helper is cooldown-guarded, so this can never reload in a loop.
      const reloading = reloadForChunkError()
      if (reloading) this.setState({ autoReloading: true })
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      errorMessage: '',
      isChunkError: false,
      autoReloading: false,
    })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const { isChunkError, autoReloading, errorMessage } = this.state

    // Stale-deployment recovery: never offer "Try Again" here, because
    // React.lazy caches the rejected import and would throw again.
    if (isChunkError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--tb-bg)' }}>
          <div className="tb-card w-full max-w-xl p-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--tb-neon)' }}>
              App Update
            </p>
            <h1 className="text-2xl font-extrabold text-white">A new version is available.</h1>
            <p className="text-sm" style={{ color: 'var(--tb-text-dim)' }}>
              {autoReloading
                ? 'Refreshing to load the latest version of TrustBreak AI…'
                : 'TrustBreak AI was updated while you were browsing. Refresh to load the latest version — your session stays signed in.'}
            </p>
            <div className="flex gap-2">
              <Button className="rounded-xl" onClick={this.handleReload} disabled={autoReloading}>
                {autoReloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {autoReloading ? 'Refreshing…' : 'Refresh Now'}
              </Button>
            </div>
            {!autoReloading && (
              <p className="text-[11px]" style={{ color: 'var(--tb-text-muted)' }}>
                If this keeps happening, close and reopen the app.
              </p>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--tb-bg)' }}>
        <div className="tb-card w-full max-w-xl p-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--tb-red)' }}>
            Application Error
          </p>
          <h1 className="text-2xl font-extrabold text-white">Something went wrong.</h1>
          <p className="text-sm" style={{ color: 'var(--tb-text-dim)' }}>
            TrustBreak AI encountered an unexpected error. Your session is safe, but this view could not render.
          </p>
          <div className="rounded-xl px-3 py-2 text-xs font-medium break-all" style={{ background: 'var(--tb-surface-2)', color: '#8fa8c8' }}>
            {errorMessage}
          </div>
          <div className="flex gap-2">
            <Button className="rounded-xl" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={this.handleReload}
              style={{ background: 'transparent', color: 'var(--tb-neon)' }}
            >
              Reload App
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
