import React from "react";
import { Cookie, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import ScannerHeader from "../components/scanner/ScannerHeader";

export default function CookiePolicy() {
  return (
    <div className="space-y-6">
      <ScannerHeader
        icon={Cookie}
        title="Cookie & Local Storage Policy"
        description="Detailed breakdown of essential cookies and browser storage tokens used on GhostNet.ai with zero ad tracking"
        color="#eab308"
      />

      <div className="ghost-card p-6 sm:p-8 space-y-6 text-xs leading-relaxed" style={{ color: 'var(--ghost-text)' }}>
        
        {/* Effective Date & Entity Header */}
        <div className="p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
          <div>
            <span className="font-bold text-sm block" style={{ color: 'var(--ghost-text)' }}>
              Zero Advertising & Third-Party Cookie Policy
            </span>
            <span style={{ color: 'var(--ghost-text-dim)' }}>
              Effective Date: September 26, 2026 | Version 1.3
            </span>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            Privacy First
          </span>
        </div>

        {/* Section 1: Introduction */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            1. What Are Cookies & Local Storage Tokens?
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            Cookies and browser Local Storage (`localStorage`) are small data files or key-value pairs stored on your device by your web browser when visiting web applications. They allow apps to remember session authentication states, UI theme choices, and security preferences across page navigation.
          </p>
        </section>

        {/* Section 2: What We Use */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            2. Essential Cookies & Local Storage Inventory
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            GhostNet.ai utilizes ONLY essential functional tokens necessary to deliver platform capabilities. We store the following items:
          </p>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl border space-y-1" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
              <div className="flex justify-between items-center font-bold">
                <span className="font-mono text-cyan-600 dark:text-cyan-400">ghostnet_theme</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">Functional</span>
              </div>
              <p style={{ color: 'var(--ghost-text-dim)' }}>Stores your active visual theme preference (Light or Dark mode). Duration: Permanent until cleared.</p>
            </div>

            <div className="p-3.5 rounded-xl border space-y-1" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
              <div className="flex justify-between items-center font-bold">
                <span className="font-mono text-cyan-600 dark:text-cyan-400">ghostnet_sidebar_open</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">Functional</span>
              </div>
              <p style={{ color: 'var(--ghost-text-dim)' }}>Remembers whether you preferred the desktop navigation sidebar open or collapsed. Duration: Permanent until cleared.</p>
            </div>

            <div className="p-3.5 rounded-xl border space-y-1" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
              <div className="flex justify-between items-center font-bold">
                <span className="font-mono text-cyan-600 dark:text-cyan-400">ghostnet_cookie_consent</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">Consent</span>
              </div>
              <p style={{ color: 'var(--ghost-text-dim)' }}>Stores your cookie consent choice ("accepted" or "essential_only") to suppress repeated cookie notifications. Duration: 365 Days.</p>
            </div>

            <div className="p-3.5 rounded-xl border space-y-1" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
              <div className="flex justify-between items-center font-bold">
                <span className="font-mono text-cyan-600 dark:text-cyan-400">sb-[id]-auth-token</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">Authentication</span>
              </div>
              <p style={{ color: 'var(--ghost-text-dim)' }}>Encrypted JWT authentication token generated by Supabase Auth to maintain secure signed-in sessions. Duration: Session / 7 Days.</p>
            </div>
          </div>
        </section>

        {/* Section 3: Zero Advertising Tracking Guarantee */}
        <section className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> 3. Zero Third-Party Advertising & Tracking Guarantee
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-medium">
            <div className="flex items-center gap-2 text-rose-500">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>NO Google Ads / Facebook Pixel Tracking</span>
            </div>
            <div className="flex items-center gap-2 text-rose-500">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>NO Cross-Site Behavioral Profiling</span>
            </div>
            <div className="flex items-center gap-2 text-rose-500">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>NO Data Brokering or Analytics Monetization</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>100% Privacy-Preserving Functional Cookies</span>
            </div>
          </div>
        </section>

        {/* Section 4: How to Control Cookies */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            4. Managing & Clearing Cookies
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            You can clear or block cookies at any time via your browser settings (Chrome, Firefox, Safari, Edge, Brave). Clearing `localStorage` will reset your theme preference and log you out of your current session.
          </p>
        </section>

      </div>
    </div>
  );
}
