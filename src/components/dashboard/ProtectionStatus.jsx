import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShieldAlert, Zap, QrCode, Mic, Link2, Image, Search } from "lucide-react";
import { ConstellationField } from "@/shaders/constellation-field/ConstellationField";

const RING_RADIUS = 58;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function ProtectionStatus({ threatsBlocked = 0, safetyScore = 100, totalScans = 0 }) {
  const [quickInput, setQuickInput] = useState("");
  const navigate = useNavigate();
  const isHealthy = safetyScore >= 75;
  const scoreProgress = Math.min(100, Math.max(0, Number(safetyScore) || 0));
  const ringOffset = RING_CIRCUMFERENCE * (1 - scoreProgress / 100);

  const handleQuickScan = (e) => {
    e.preventDefault();
    const trimmed = quickInput.trim();
    if (!trimmed) {
      navigate(createPageUrl("MessageScanner"));
      return;
    }
    const isUrl = /^(https?:\/\/|www\.)/i.test(trimmed);
    navigate(createPageUrl(isUrl ? "LinkScanner" : "MessageScanner"), {
      state: { sharedContent: trimmed },
    });
  };

  const quickTriggers = [
    { label: "Link", page: "LinkScanner", icon: Link2 },
    { label: "QR", page: "QRScanner", icon: QrCode },
    { label: "Screenshot", page: "ScreenshotScanner", icon: Image },
    { label: "Voice", page: "VoiceScanner", icon: Mic },
  ];

  return (
    <div className="tb-card bg-white dark:bg-[#0d1424] p-5 sm:p-6 relative overflow-hidden border border-slate-200 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_0_35px_rgba(16,185,129,0.08)]">
      {/* ThreeUI Living Constellation / Particle Drift Background Field */}
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-40 pointer-events-none dark:mix-blend-screen">
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] items-center gap-6 relative z-10">
        
        {/* Left Posture Pitch & Quick-Scan Bar */}
        <div className="space-y-3.5 min-w-0">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md ${
              isHealthy
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400"
                : "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy
                  ? "bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_#10b981]"
                  : "bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_#f59e0b]"
              } animate-pulse`}
            />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
              {isHealthy
                ? "PROTECTED — No immediate threat detected"
                : "ATTENTION — Security Alerts Found"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display leading-tight">
            <span className="text-slate-950 dark:text-white">AI-Powered </span>
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              Scam Defense
            </span>
          </h1>

          <p className="text-xs sm:text-sm font-medium leading-relaxed max-w-md text-slate-600 dark:text-slate-400">
            TrustBreak AI protects users before they trust, click, scan, pay or respond.
          </p>

          {/* Interactive Glassmorphic Quick-Scan Bar */}
          <form
            onSubmit={handleQuickScan}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50 dark:border-slate-700/70 dark:bg-slate-900/80 p-1.5 backdrop-blur-xl shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0 px-2.5">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Paste suspicious SMS, URL, or payment link..."
                aria-label="Paste suspicious SMS, URL, or payment link"
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none py-2 min-w-0"
              />
            </div>

            <button
              type="submit"
              className="touch-manipulation min-h-[42px] px-4 rounded-xl text-xs font-bold font-mono tracking-wide uppercase bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.28)] transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Scan Now
            </button>
          </form>

          {/* Compact Quick-Action Icon Triggers */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {quickTriggers.map((trigger) => {
              const Icon = trigger.icon;
              return (
                <Link
                  key={trigger.page}
                  to={createPageUrl(trigger.page)}
                  className="touch-manipulation min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 text-xs font-semibold transition-all duration-150 active:scale-95"
                >
                  <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{trigger.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Unified Security Telemetry Card */}
        <div className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800/80 dark:bg-[#0d1424]/90 p-5 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          {/* Inner top highlight + ambient emerald wash (decorative) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
          <div className="pointer-events-none absolute -top-12 right-0 h-40 w-40 bg-[radial-gradient(circle,rgba(16,185,129,0.12),transparent_70%)]" />

          <div className="relative grid grid-cols-1 min-[480px]:grid-cols-[auto_minmax(0,1fr)] items-center gap-4">

            {/* Left — Radial Security Score */}
            <div className="flex flex-col items-center justify-center gap-2 min-[480px]:border-r min-[480px]:border-slate-200 dark:min-[480px]:border-slate-800/70 min-[480px]:pr-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
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
                  <circle cx="70" cy="70" r={RING_RADIUS} fill="none" strokeWidth="8" className="stroke-slate-200 dark:stroke-slate-800" />

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
                  <span className="font-mono text-[26px] font-bold leading-none tracking-tight tabular-nums text-emerald-600 dark:text-[#10b981]">
                    {safetyScore}
                  </span>
                  <span className="mb-0.5 ml-0.5 font-mono text-[13px] font-bold leading-none text-slate-500 dark:text-slate-400">
                    /100
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                {isHealthy ? "Strong Awareness" : "Review Alerts"}
              </span>
            </div>

            {/* Right — Stacked Compact Stat Rows */}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">

              {/* Threats Flagged */}
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800/70 dark:bg-slate-900/40 px-3.5 py-2.5 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-inset ring-rose-500/20">
                  <ShieldAlert className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-nowrap text-[11px] font-bold uppercase leading-tight tracking-wider text-slate-800 dark:text-slate-300">
                    THREATS FLAGGED
                  </p>
                  <p className="text-[10px] font-medium leading-tight text-slate-500 dark:text-slate-500">
                    High-risk attacks
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[24px] font-black leading-none tabular-nums text-rose-600 dark:text-[#f43f5e]">
                  {threatsBlocked}
                </span>
              </div>

              {/* Total Scans */}
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800/70 dark:bg-slate-900/40 px-3.5 py-2.5 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20">
                  <Zap className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-nowrap text-[11px] font-bold uppercase leading-tight tracking-wider text-slate-800 dark:text-slate-300">
                    TOTAL SCANS
                  </p>
                  <p className="text-[10px] font-medium leading-tight text-slate-500 dark:text-slate-500">
                    Multi-modal runs
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[24px] font-black leading-none tabular-nums text-slate-950 dark:text-white">
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

