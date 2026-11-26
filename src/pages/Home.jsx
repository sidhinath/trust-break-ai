import React, { Suspense, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ProtectionStatus from "../components/dashboard/ProtectionStatus";
import QuickActions from "../components/dashboard/QuickActions";
import RecentScans from "../components/dashboard/RecentScans";
import ThreatStats from "../components/dashboard/ThreatStats";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  listScanHistory,
  listScamReports,
  countScanHistory,
  countScamReports,
} from "@/lib/data";
import { SkeletonCard, ThreatListSkeleton, MetricCardSkeleton } from "../components/ui/skeleton";

// React.lazy with stale-chunk recovery. Senior Mode is a secondary view — its
// translation strings and widgets must not be parsed on the Command Center path.
const SeniorHomeView = lazyWithRetry(() => import("../components/SeniorHomeView"));

export default function Home() {
  const [seniorModeActive, setSeniorModeActive] = useState(() => {
    try {
      return document.body.classList.contains("family-safety-mode") || localStorage.getItem("trustbreak_senior_mode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const syncMode = () => {
      const active = document.body.classList.contains("family-safety-mode") || localStorage.getItem("trustbreak_senior_mode") === "true";
      setSeniorModeActive(active);
    };
    syncMode();

    window.addEventListener("trustbreak_senior_mode_change", syncMode);
    window.addEventListener("storage", syncMode);
    return () => {
      window.removeEventListener("trustbreak_senior_mode_change", syncMode);
      window.removeEventListener("storage", syncMode);
    };
  }, []);

  const handleSwitchToNormalMode = () => {
    setSeniorModeActive(false);
    try {
      localStorage.setItem("trustbreak_senior_mode", "false");
    } catch {}
    document.body.classList.remove("family-safety-mode");
    window.dispatchEvent(new Event("trustbreak_senior_mode_change"));
  };

  const { data: scans = [], isLoading: loadingScans } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: () => listScanHistory(20),
  });

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['scamReports'],
    queryFn: () => listScamReports(50),
  });

  // Head-only counts: KPI totals stay accurate with millions of rows without
  // transferring or scanning the whole history table on every render.
  const { data: totalScans = 0 } = useQuery({
    queryKey: ['scanHistoryCount'],
    queryFn: () => countScanHistory(),
    staleTime: 60_000,
  });
  const { data: scamScans = 0 } = useQuery({
    queryKey: ['scanHistoryCount', 'scam'],
    queryFn: () => countScanHistory({ risk_level: 'scam' }),
    staleTime: 60_000,
  });
  const { data: suspiciousScans = 0 } = useQuery({
    queryKey: ['scanHistoryCount', 'suspicious'],
    queryFn: () => countScanHistory({ risk_level: 'suspicious' }),
    staleTime: 60_000,
  });
  const { data: totalReports = 0 } = useQuery({
    queryKey: ['scamReportsCount'],
    queryFn: () => countScamReports(),
    staleTime: 60_000,
  });
  const { data: scamReports = 0 } = useQuery({
    queryKey: ['scamReportsCount', 'scam'],
    queryFn: () => countScamReports({ risk_level: 'scam' }),
    staleTime: 60_000,
  });

  const isLoading = loadingScans || loadingReports;
  const totalScanCount = totalScans || scans.length;
  const recentScans = scans.slice(0, 4);
  const threatsBlocked = (scamScans + suspiciousScans) ||
    scans.filter(s => s.risk_level === 'scam' || s.risk_level === 'suspicious').length;
  const scamRatio = totalScanCount > 0 ? (scamScans / totalScanCount) : 0;
  const safetyScore = totalScanCount === 0 ? 100 : Math.max(10, Math.round(100 - (scamRatio * 80)));

  if (seniorModeActive) {
    return (
      <Suspense fallback={<SkeletonCard className="h-[560px]" />}>
        <SeniorHomeView onSwitchToNormalMode={handleSwitchToNormalMode} />
      </Suspense>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {isLoading ? (
        <SkeletonCard className="h-40" />
      ) : (
        <ProtectionStatus
          threatsBlocked={threatsBlocked}
          safetyScore={safetyScore}
          totalScans={totalScanCount}
        />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold uppercase tracking-wider" style={{ color: '#10b981' }}>
            Security Scanners & Tools
          </h2>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-mono font-semibold">Multi-Modal Protection Engines</span>
        </div>
        <QuickActions />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold uppercase tracking-wider" style={{ color: '#10b981' }}>
            Global & Local Intelligence
          </h2>
          <Link to={createPageUrl("Threats")} className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-500 hover:underline flex items-center gap-1">
            Open Threat Intelligence <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {isLoading ? (
          <MetricCardSkeleton count={4} />
        ) : (
          <ThreatStats
            reports={reports}
            scans={scans}
            totalScans={totalScans}
            totalScamScans={scamScans}
            totalSuspiciousScans={suspiciousScans}
            totalReports={totalReports}
            totalScamReports={scamReports}
          />
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold uppercase tracking-wider" style={{ color: '#10b981' }}>
            Recent Inspections
          </h2>
          <Link to={createPageUrl("Reports")} className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-500 hover:underline">
            View All History
          </Link>
        </div>
        {isLoading ? (
          <ThreatListSkeleton count={4} />
        ) : (
          <RecentScans scans={recentScans} />
        )}
        {!isLoading && totalScanCount > 4 && (
          <Link
            to={createPageUrl("Reports")}
            className="w-full py-3 mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-semibold text-sm flex items-center justify-center gap-2 touch-manipulation transition-colors"
          >
            View All History ({totalScanCount} Total) →
          </Link>
        )}
      </div>
    </div>
  );
}


