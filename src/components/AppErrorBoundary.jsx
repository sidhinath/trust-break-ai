import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isChunkLoadError } from '@/lib/lazyWithRetry'
import { reloadAppOnce } from '@/lib/pwaUpdate'

/**
 * Last-resort boundary for real render errors.
 *
 * Stale-chunk failures are handled silently: lazyWithRetry() reloads once with
 * the shared sessionStorage guard, and this boundary only shows a small
 * transient loader while the browser navigates. There is no update prompt and
 * no "Refresh Now" button anywhere in the recovery path.
 */
export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: '',
      isChunkError: false,
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
      // Already guarded by `last_auto_reload` (10s). If a reload happened very
      // recently this returns false and the transient loader stays until the
      // next navigation/update check — no blocking prompt is ever rendered.
      reloadAppOnce({ reason: 'chunk-error' })
    }
  }

  handleReload = () => {
    reloadAppOnce({ reason: 'manual-reload', force: true })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      errorMessage: '',
      isChunkError: false,
    })
  }

  renderChunkRecovery() {
    return (
      <div
        role="status"
        aria-label="Restarting TrustBreak AI"
        className="flex min-h-[100dvh] w-full items-center justify-center"
        style={{ background: 'var(--tb-bg)' }}
      >
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--tb-neon)' }} />
      </div>
    )
  }

  renderApplicationError() {
    const { errorMessage } = this.state

    return (
      <div
        className="flex min-h-screen w-full items-center justify-center overflow-y-auto px-4 py-10"
        style={{ minHeight: '100dvh', background: 'var(--tb-bg)' }}
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="tb-app-error-title"
          className="tb-card w-full max-w-lg space-y-4 rounded-2xl p-5 text-center sm:p-6 sm:text-left"
        >
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--tb-red)' }}
          >
            Application Error
          </p>
          <h1 id="tb-app-error-title" className="text-xl font-extrabold text-white sm:text-2xl">
            Something went wrong.
          </h1>
          <p className="text-sm" style={{ color: 'var(--tb-text-dim)' }}>
            TrustBreak AI encountered an unexpected error. Your session is safe, but this view could not render.
          </p>
          <div
            className="break-all rounded-xl px-3 py-2 text-xs font-medium"
            style={{ background: 'var(--tb-surface-2)', color: '#8fa8c8' }}
          >
            {errorMessage}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="w-full rounded-xl sm:w-auto" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl sm:w-auto"
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

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.state.isChunkError) return this.renderChunkRecovery()
    return this.renderApplicationError()
  }
}
