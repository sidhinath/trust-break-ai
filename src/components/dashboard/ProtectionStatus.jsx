import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShieldAlert, Zap, QrCode, Mic } from "lucide-react";
import { ConstellationField } from "@/shaders/constellation-field/ConstellationField";

const RING_RADIUS = 58;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function ProtectionStatus({ threatsBlocked = 0, safetyScore = 100, totalScans = 0 }) {
  const isHealthy = safetyScore >= 75;
  const scoreProgress = Math.min(100, Math.max(0, Number(safetyScore) || 0));
  const ringOffset = RING_CIRCUMFERENCE * (1 - scoreProgress / 100);

  return (
    <div className="tb-card p-5 sm:p-6 relative overflow-hidden border border-emerald-500/20 shadow-[0_0_35px_rgba(16,185,129,0.08)]">
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
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

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
            style={{ color: 'var(--tb-text)' }}>
            Your Digital Safety Layer
          </h1>

          <p className="text-xs sm:text-sm font-medium leading-relaxed"
            style={{ color: 'var(--tb-text-dim)' }}>
            TrustBreak AI protects users before they trust, click, scan, pay or respond.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <Link
              to={createPageUrl("MessageScanner")}
              className="inline-flex items-center justify-center gap-2 touch-manipulation min-h-[44px] min-w-[44px] px-4 rounded-xl text-xs font-bold font-mono tracking-wide uppercase bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-transform duration-75 active:scale-95">
              <Zap className="w-3.5 h-3.5 fill-current" />
              Scan Message
            </Link>
            <Link
              to={createPageUrl("LinkScanner")}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 flex items-center gap-1 px-2 py-1 min-h-[44px] min-w-[44px] rounded-lg hover:bg-emerald-500/10">
              Link →
            </Link>
            <Link
              to={createPageUrl("QRScanner")}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 flex items-center gap-1 px-2 py-1 min-h-[44px] min-w-[44px] rounded-lg hover:bg-purple-500/10">
              <QrCode className="w-3.5 h-3.5" />
              QR →
            </Link>
            <Link
              to={createPageUrl("VoiceScanner")}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 flex items-center gap-1 px-2 py-1 min-h-[44px] min-w-[44px] rounded-lg hover:bg-teal-500/10">
              <Mic className="w-3.5 h-3.5" />
              Voice →
            </Link>
          </div>
        </div>

        {/* Unified Security Telemetry Card */}
        <div className="relative w-full lg:w-[400px] shrink-0 overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1424]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          {/* Inner top highlight + ambient emerald wash (decorative) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
          <div className="pointer-events-none absolute -top-12 right-0 h-40 w-40 bg-[radial-gradient(circle,rgba(16,185,129,0.12),transparent_70%)]" />

          <div className="relative grid grid-cols-1 min-[480px]:grid-cols-[auto_1fr] items-center gap-4">

            {/* Left — Radial Security Score */}
            <div className="flex flex-col items-center justify-center gap-2 px-1 min-[480px]:border-r min-[480px]:border-slate-800/70 min-[480px]:pr-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Security Score
              </span>

              <div className="relative h-[140px] w-[140px]">
                <svg
                  viewBox="0 0 140 140"
                  className="h-full w-full -rotate-90"
                  role="img"
                  aria-label={`Security score ${safetyScore} out of 100`}
                >
                  <defs>
                    <linearGradient id="tb-score-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <filter id="tb-score-ring-glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Track */}
                  <circle cx="70" cy="70" r={RING_RADIUS} fill="none" stroke="#1e293b" strokeWidth="8" />

                  {/* Progress */}
                  <circle
                    cx="70"
                    cy="70"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="url(#tb-score-ring-gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={ringOffset}
                    filter="url(#tb-score-ring-glow)"
                    className="tb-score-ring"
                    style={{ '--tb-ring-circumference': String(RING_CIRCUMFERENCE) }}
                  />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-[26px] font-bold leading-none tracking-tight tabular-nums text-[#10b981]">
                    {safetyScore}
                  </span>
                  <span className="mb-0.5 ml-0.5 font-mono text-[13px] font-bold leading-none text-slate-400">
                    /100
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400 whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                {isHealthy ? "Strong Awareness" : "Review Alerts"}
              </span>
            </div>

            {/* Right — Stacked Compact Stat Rows */}
            <div className="flex flex-1 flex-col justify-center gap-2 min-[480px]:pl-2">

              {/* Threats Flagged */}
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-800/70 bg-slate-900/40 px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20">
                  <ShieldAlert className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-nowrap text-[11px] font-bold uppercase leading-tight tracking-wider text-slate-300">
                    THREATS FLAGGED
                  </p>
                  <p className="text-[10px] font-medium leading-tight text-slate-500">
                    High-risk attacks
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[24px] font-black leading-none tabular-nums text-[#f43f5e]">
                  {threatsBlocked}
                </span>
              </div>

              {/* Total Scans */}
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-800/70 bg-slate-900/40 px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20">
                  <Zap className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-nowrap text-[11px] font-bold uppercase leading-tight tracking-wider text-slate-300">
                    TOTAL SCANS
                  </p>
                  <p className="text-[10px] font-medium leading-tight text-slate-500">
                    Multi-modal runs
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[24px] font-black leading-none tabular-nums text-[#f8fafc]">
                  {totalScans}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

