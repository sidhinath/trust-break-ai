import React from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

/**
 * ProtectedPage
 *
 * Wraps a full page with access control. When a guest user navigates to
 * a protected page they see a premium lock screen instead of the page content.
 *
 * Usage in pages.config.js or any page:
 *   <ProtectedPage feature="Scan History Logs">
 *     <Reports />
 *   </ProtectedPage>
 *
 * Or wrap the page export directly:
 *   export default function Reports() {
 *     return (
 *       <ProtectedPage feature="Scan History Logs">
 *         { ... actual content ... }
 *       </ProtectedPage>
 *     )
 *   }
 */
export default function ProtectedPage({ children, feature }) {
  const { isAuthenticated, openSignIn, openSignUp } = useAuth()

  if (isAuthenticated) {
    return <>{children}</>
  }

  // Guest / unauthenticated — show lock screen
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md text-center space-y-6"
      >
        {/* Lock Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.12)]">
            <ShieldAlert className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--ghost-text)' }}>
            Authentication Required
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ghost-text-dim)' }}>
            {feature
              ? `The ${feature} is only available to signed-in users.`
              : 'This feature is only available to signed-in users.'}
            {' '}Please sign in or create a free account to continue.
          </p>
        </div>

        {/* Feature badge */}
        {feature && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/60 text-xs font-bold text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {feature}
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={openSignIn}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.25)] hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Sign In to Continue
          </button>

          <button
            type="button"
            onClick={openSignUp}
            className="w-full h-12 rounded-xl border border-cyan-500/30 bg-cyan-500/8 text-sm font-bold text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/15 transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Create Free Account
          </button>
        </div>

        <p className="text-xs" style={{ color: 'var(--ghost-text-muted)' }}>
          Free forever · No credit card required
        </p>
      </motion.div>
    </div>
  )
}
