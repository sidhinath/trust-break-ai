import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShieldAlert, Zap, Activity, QrCode, Mic } from "lucide-react";
import { ConstellationField } from "@/shaders/constellation-field/ConstellationField";

export default function ProtectionStatus({ threatsBlocked = 0, safetyScore = 100, totalScans = 0 }) {
  const isHealthy = safetyScore >= 75;

  return (
    <div className="ghost-card p-5 sm:p-6 relative overflow-hidden border border-cyan-500/20 shadow-[0_0_35px_rgba(0,229,255,0.08)]">
      {/* ThreeUI Living Constellation / Particle Drift Background Field */}
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-40 pointer-events-none dark:mix-blend-screen">
        <ConstellationField
          variant="particle-drift"
          mode="dark"
          speed={0.85}
          size={1.0}
          length={1.0}
          density={0.85}
          opacity={0.6}
        />
      </div>

      {/* Subtle depth gradient overlay to ensure text readability in both Light and Dark mode */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent dark:from-slate-950/90 dark:via-slate-950/65 pointer-events-none" />

      {/* Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        
        {/* Left Posture Pitch */}
        <div className="space-y-3 max-w-lg">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500'} animate-pulse`} />
            <span className={`text-xs font-mono font-bold tracking-wider uppercase ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {isHealthy ? "PROTECTED — No immediate threat detected" : "ATTENTION — Security Alerts Found"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display"
            style={{ color: 'var(--ghost-text)' }}>
            Your Digital Safety Layer
          </h1>

          <p className="text-xs sm:text-sm font-medium leading-relaxed"
            style={{ color: 'var(--ghost-text-dim)' }}>
            GhostNet protects users before they trust, click, scan, pay or respond.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <Link
              to={createPageUrl("ScanHub")}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-bold font-mono tracking-wide uppercase bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Zap className="w-3.5 h-3.5 fill-current" />
              Universal Scanner
            </Link>
            <Link
              to={createPageUrl("MessageScanner")}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-cyan-500/10">
              Message →
            </Link>
            <Link
              to={createPageUrl("LinkScanner")}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-cyan-500/10">
              Link →
            </Link>
            <Link
              to={createPageUrl("QRScanner")}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-purple-500/10">
              <QrCode className="w-3.5 h-3.5" />
              QR →
            </Link>
            <Link
              to={createPageUrl("VoiceScanner")}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-teal-500/10">
              <Mic className="w-3.5 h-3.5" />
              Voice →
            </Link>
          </div>
        </div>

        {/* Right Security Awareness Score & Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
          
          {/* Security Score */}
          <div className="p-4 rounded-xl border flex flex-col justify-between"
            style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ghost-text-dim)' }}>
                Security Score
              </span>
              <Activity className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <div className="my-1.5 flex items-baseline">
              <span className={`text-3xl font-black font-display ${isHealthy ? 'score-safe' : 'score-suspicious'}`}>
                {safetyScore}
              </span>
              <span className="text-xs font-bold ml-1" style={{ color: 'var(--ghost-text-muted)' }}>/100</span>
            </div>
            <span className="text-[10px] truncate" style={{ color: 'var(--ghost-text-dim)' }}>
              {isHealthy ? "Strong Awareness" : "Review Alerts"}
            </span>
          </div>

          {/* Threats Blocked */}
          <div className="p-4 rounded-xl border flex flex-col justify-between"
            style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ghost-text-dim)' }}>
                Threats Flagged
              </span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="my-1.5">
              <span className="text-3xl font-black font-display text-rose-500 dark:text-rose-400">
                {threatsBlocked}
              </span>
            </div>
            <span className="text-[10px] truncate" style={{ color: 'var(--ghost-text-dim)' }}>
              High-risk attacks
            </span>
          </div>

          {/* Total Inspections */}
          <div className="p-4 rounded-xl border flex flex-col justify-between col-span-2 sm:col-span-1"
            style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ghost-text-dim)' }}>
                Total Scans
              </span>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="my-1.5">
              <span className="text-3xl font-black font-display" style={{ color: 'var(--ghost-text)' }}>
                {totalScans}
              </span>
            </div>
            <span className="text-[10px] truncate" style={{ color: 'var(--ghost-text-dim)' }}>
              Multi-modal runs
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}