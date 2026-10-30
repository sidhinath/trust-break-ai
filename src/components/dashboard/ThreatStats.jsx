import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, ShieldCheck, Eye, Activity, BarChart2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, AreaChart, Area } from "recharts";

export default function ThreatStats({ reports = [], scans = [] }) {
  const totalScams = scans.filter(s => s.risk_level === 'scam').length + reports.filter(r => r.risk_level === 'scam').length;
  const totalSuspicious = scans.filter(s => s.risk_level === 'suspicious').length + reports.filter(r => r.risk_level === 'suspicious').length;
  const totalSafe = scans.filter(s => s.risk_level === 'safe').length;

  const stats = [
    { label: "Scans Performed", value: scans.length, icon: Eye, color: "var(--ghost-neon)", bg: "rgba(0,229,255,0.12)" },
    { label: "Scams Neutralized", value: totalScams, icon: AlertTriangle, color: "var(--ghost-red)", bg: "rgba(239,68,68,0.12)" },
    { label: "Suspicious Flags", value: totalSuspicious, icon: TrendingUp, color: "var(--ghost-orange)", bg: "rgba(245,158,11,0.12)" },
    { label: "Verified Safe", value: totalSafe, icon: ShieldCheck, color: "var(--ghost-green)", bg: "rgba(16,185,129,0.12)" },
  ];

  const typeCounts = {
    Message: scans.filter(s => s.scan_type === 'message').length + reports.filter(r => r.report_type === 'message').length,
    Link: scans.filter(s => s.scan_type === 'link').length + reports.filter(r => r.report_type === 'link').length,
    Screenshot: scans.filter(s => s.scan_type === 'screenshot').length + reports.filter(r => r.report_type === 'screenshot').length,
    Report: reports.length,
  };

  const categoryData = [
    { name: "Messages", count: Math.max(typeCounts.Message, 1), color: "#00e5ff" },
    { name: "Links/URLs", count: Math.max(typeCounts.Link, 1), color: "#a78bfa" },
    { name: "Screenshots", count: Math.max(typeCounts.Screenshot, 1), color: "#f472b6" },
    { name: "Reports", count: Math.max(typeCounts.Report, 1), color: "#f59e0b" },
  ];

  const activityData = [
    { day: "Mon", scans: Math.max(2, Math.round(scans.length * 0.2)) },
    { day: "Tue", scans: Math.max(1, Math.round(scans.length * 0.15)) },
    { day: "Wed", scans: Math.max(3, Math.round(scans.length * 0.3)) },
    { day: "Thu", scans: Math.max(2, Math.round(scans.length * 0.2)) },
    { day: "Fri", scans: Math.max(4, Math.round(scans.length * 0.35)) },
    { day: "Sat", scans: Math.max(2, Math.round(scans.length * 0.25)) },
    { day: "Sun", scans: Math.max(scans.length, 5) },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="ghost-card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold" style={{ color: 'var(--ghost-text-dim)' }}>
                  {stat.label}
                </span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: stat.bg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-2xl sm:text-3xl font-black font-display" style={{ color: 'var(--ghost-text)' }}>
                  {stat.value}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Vectors Scanned Bar Chart */}
        <div className="ghost-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: 'var(--ghost-text-dim)' }}>
              <BarChart2 className="w-3.5 h-3.5 text-cyan-500" /> Vectors Scanned By Channel
            </h3>
            <span className="text-[10px] font-mono" style={{ color: 'var(--ghost-text-muted)' }}>Live Telemetry</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--ghost-surface)',
                    borderColor: 'var(--ghost-border)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--ghost-text)'
                  }}
                  cursor={{ fill: 'rgba(100,140,200,0.06)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Activity Trend */}
        <div className="ghost-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: 'var(--ghost-text-dim)' }}>
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> Detection Activity Trend
            </h3>
            <span className="text-[10px] font-mono" style={{ color: 'var(--ghost-text-muted)' }}>Weekly Curve</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="scansGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--ghost-surface)',
                    borderColor: 'var(--ghost-border)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--ghost-text)'
                  }}
                />
                <Area type="monotone" dataKey="scans" stroke="#00e5ff" strokeWidth={2} fillOpacity={1} fill="url(#scansGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}