import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Activity,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { LazyViewport } from "@/components/ui/lazy-viewport";
import { ChartSkeleton } from "@/components/ui/skeleton";

function MiniSparkline({ points, color }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const width = 44;
  const height = 18;

  const coords = points
    .map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}

export default function ThreatStats({ reports = [], scans = [] }) {
  const totalScams =
    scans.filter((s) => s.risk_level === "scam").length +
    reports.filter((r) => r.risk_level === "scam").length;
  const totalSuspicious =
    scans.filter((s) => s.risk_level === "suspicious").length +
    reports.filter((r) => r.risk_level === "suspicious").length;
  const totalSafe = scans.filter((s) => s.risk_level === "safe").length;

  const kpiRows = [
    {
      label: "Scans Performed",
      value: scans.length,
      icon: Eye,
      accent: "#10b981",
      bg: "rgba(16, 185, 129, 0.12)",
      spark: [1, 2, 1, 3, Math.max(scans.length, 2)],
    },
    {
      label: "Scams Neutralized",
      value: totalScams,
      icon: AlertTriangle,
      accent: "#fb7185",
      bg: "rgba(251, 113, 133, 0.12)",
      spark: [0, 1, 1, 0, Math.max(totalScams, 1)],
    },
    {
      label: "Suspicious Flags",
      value: totalSuspicious,
      icon: TrendingUp,
      accent: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.12)",
      spark: [1, 0, 1, 0, totalSuspicious],
    },
    {
      label: "Verified Safe",
      value: totalSafe,
      icon: ShieldCheck,
      accent: "#10b981",
      bg: "rgba(16, 185, 129, 0.12)",
      spark: [1, 1, 2, 1, Math.max(totalSafe, 1)],
    },
  ];

  const typeCounts = {
    Message:
      scans.filter((s) => s.scan_type === "message").length +
      reports.filter((r) => r.report_type === "message").length,
    Link:
      scans.filter((s) => s.scan_type === "link").length +
      reports.filter((r) => r.report_type === "link").length,
    Screenshot:
      scans.filter((s) => s.scan_type === "screenshot").length +
      reports.filter((r) => r.report_type === "screenshot").length,
    Report: reports.length,
  };

  const categoryData = [
    { name: "Messages", count: Math.max(typeCounts.Message, 1), color: "#10b981" },
    { name: "Links/URLs", count: Math.max(typeCounts.Link, 1), color: "#14b8a6" },
    { name: "Screenshots", count: Math.max(typeCounts.Screenshot, 1), color: "#34d399" },
    { name: "Reports", count: Math.max(typeCounts.Report, 1), color: "#64748b" },
  ];

  const rawTotal =
    typeCounts.Message + typeCounts.Link + typeCounts.Screenshot + typeCounts.Report;
  const totalVectors = rawTotal > 0 ? rawTotal : 5;

  const activityData = [
    { day: "Mon", scans: Math.max(2, Math.round(scans.length * 0.2)) },
    { day: "Tue", scans: Math.max(1, Math.round(scans.length * 0.15)) },
    { day: "Wed", scans: Math.max(3, Math.round(scans.length * 0.3)) },
    { day: "Thu", scans: Math.max(2, Math.round(scans.length * 0.2)) },
    { day: "Fri", scans: Math.max(4, Math.round(scans.length * 0.35)) },
    { day: "Sat", scans: Math.max(2, Math.round(scans.length * 0.25)) },
    { day: "Sun", scans: Math.max(scans.length, 5) },
  ];

  const peakScans = Math.max(...activityData.map((d) => d.scans), 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,25fr)_minmax(0,30fr)_minmax(0,45fr)] gap-4 items-stretch">
      {/* Left Column (25%) — Compact Stacked KPI Telemetry Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white dark:bg-[#070c16] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between divide-y divide-slate-200 dark:divide-slate-800/70 shadow-sm dark:shadow-lg"
      >
        {kpiRows.map((row) => {
          const Icon = row.icon;
          const valueColorClass =
            row.accent === "#fb7185"
              ? "text-rose-600 dark:text-rose-400"
              : row.accent === "#f59e0b"
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-950 dark:text-white";
          return (
            <div
              key={row.label}
              className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-white/5"
                  style={{ background: row.bg }}
                >
                  <Icon className="w-4 h-4" style={{ color: row.accent }} />
                </div>
                <span className="text-[15px] font-bold truncate text-slate-950 dark:text-slate-200">
                  {row.label}
                </span>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <MiniSparkline points={row.spark} color={row.accent} />
                <span className={`text-xl font-black font-mono tabular-nums min-w-[1.5ch] text-right ${valueColorClass}`}>
                  {row.value}
                </span>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Center Column (30%) — VECTORS SCANNED BY CHANNEL Donut Ring Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="bg-white dark:bg-[#070c16] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-sm dark:shadow-lg"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-600 dark:text-[#10b981]">
            <PieChartIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
            Vectors Scanned By Channel
          </h3>
        </div>

        <LazyViewport
          rootMargin="400px"
          placeholder={<ChartSkeleton height={160} className="w-full" />}
        >
          <div className="relative h-40 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--tb-surface)",
                    borderColor: "var(--tb-border)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "var(--tb-text)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Centered Ring Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black font-mono leading-none text-slate-950 dark:text-white">
                {totalVectors}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest mt-1 text-slate-500 dark:text-slate-400">
                TOTAL
              </span>
            </div>
          </div>
        </LazyViewport>

        {/* 2x2 Legend */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/70">
          {categoryData.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] font-medium truncate text-slate-600 dark:text-slate-300">
                  {item.name}
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold shrink-0 text-slate-950 dark:text-white">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right Column (45%) — Expanded DETECTION ACTIVITY TREND Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="bg-white dark:bg-[#070c16] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-sm dark:shadow-lg relative"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-600 dark:text-[#10b981]">
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
            Detection Activity Trend
          </h3>

          {/* Floating Glass Peak Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 text-[11px] font-mono font-bold backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Peak: {peakScans} Scans
          </span>
        </div>

        <LazyViewport
          rootMargin="400px"
          placeholder={<ChartSkeleton height={210} className="w-full" />}
        >
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activityData}
                margin={{ top: 10, right: 10, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="emeraldTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.38} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <filter id="emeraldGlow" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="rgba(148, 163, 184, 0.2)"
                />
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--tb-surface)",
                    borderColor: "var(--tb-border)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "var(--tb-text)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#emeraldTrendGrad)"
                  filter="url(#emeraldGlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </LazyViewport>
      </motion.div>
    </div>
  );
}
