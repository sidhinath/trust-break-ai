import React from 'react'
import { Button } from '@/components/ui/button'

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected application error',
    }
  }

  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught an error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--ghost-bg)' }}>
        <div className="ghost-card w-full max-w-xl p-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ghost-red)' }}>
            Application Error
          </p>
          <h1 className="text-2xl font-extrabold text-white">Something went wrong.</h1>
          <p className="text-sm" style={{ color: 'var(--ghost-text-dim)' }}>
            GhostNet encountered an unexpected error. Your session is safe, but this view could not render.
          </p>
          <div className="rounded-xl px-3 py-2 text-xs font-medium break-all" style={{ background: 'var(--ghost-surface-2)', color: '#8fa8c8' }}>
            {this.state.errorMessage}
          </div>
          <div className="flex gap-2">
            <Button className="rounded-xl" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={this.handleReload}
              style={{ background: 'transparent', color: 'var(--ghost-neon)' }}
            >
              Reload App
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
