import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ProtectionStatus from "../components/dashboard/ProtectionStatus";
import QuickActions from "../components/dashboard/QuickActions";
import RecentScans from "../components/dashboard/RecentScans";
import ThreatStats from "../components/dashboard/ThreatStats";
import SeniorHomeView from "../components/SeniorHomeView";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { listScanHistory, listScamReports } from "@/lib/data";
import { SkeletonCard, ThreatListSkeleton, MetricCardSkeleton } from "../components/ui/skeleton";

export default function Home() {
  const [seniorModeActive, setSeniorModeActive] = useState(() => {
    try {
      return document.body.classList.contains("family-safety-mode") || localStorage.getItem("ghostnet_senior_mode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const syncMode = () => {
      const active = document.body.classList.contains("family-safety-mode") || localStorage.getItem("ghostnet_senior_mode") === "true";
      setSeniorModeActive(active);
    };
    syncMode();

    window.addEventListener("ghostnet_senior_mode_change", syncMode);
    window.addEventListener("storage", syncMode);
    return () => {
      window.removeEventListener("ghostnet_senior_mode_change", syncMode);
      window.removeEventListener("storage", syncMode);
    };
  }, []);

  const handleSwitchToNormalMode = () => {
    setSeniorModeActive(false);
    try {
      localStorage.setItem("ghostnet_senior_mode", "false");
    } catch {}
    document.body.classList.remove("family-safety-mode");
    window.dispatchEvent(new Event("ghostnet_senior_mode_change"));
  };

  const { data: scans = [], isLoading: loadingScans } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: () => listScanHistory(20),
  });

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['scamReports'],
    queryFn: () => listScamReports(50),
  });

  const isLoading = loadingScans || loadingReports;
  const threatsBlocked = scans.filter(s => s.risk_level === 'scam' || s.risk_level === 'suspicious').length;
  const scamRatio = scans.length > 0 ? (scans.filter(s => s.risk_level === 'scam').length / scans.length) : 0;
  const safetyScore = scans.length === 0 ? 100 : Math.max(10, Math.round(100 - (scamRatio * 80)));

  // Render Senior Mode View when Senior Mode is active
  if (seniorModeActive) {
    return <SeniorHomeView onSwitchToNormalMode={handleSwitchToNormalMode} />;
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Main Security Posture Header */}
      {isLoading ? (
        <SkeletonCard className="h-40" />
      ) : (
        <ProtectionStatus
          threatsBlocked={threatsBlocked}
          safetyScore={safetyScore}
          totalScans={scans.length}
        />
      )}

      {/* Quick Launchpad for Scanners */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ghost-text-dim)' }}>
            Security Scanners & Tools
          </h2>
          <span className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400">Multi-Modal Protection Engines</span>
        </div>
        <QuickActions />
      </div>

      {/* Threat Statistics & Telemetry */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ghost-text-dim)' }}>
            Global & Local Intelligence
          </h2>
          <Link to={createPageUrl("Threats")} className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
            Open Threat Intelligence <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {isLoading ? (
          <MetricCardSkeleton count={4} />
        ) : (
          <ThreatStats reports={reports} scans={scans} />
        )}
      </div>

      {/* Recent Inspection Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ghost-text-dim)' }}>
            Recent Inspections
          </h2>
          <Link to={createPageUrl("Reports")} className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
            View All History
          </Link>
        </div>
        {isLoading ? (
          <ThreatListSkeleton count={4} />
        ) : (
          <RecentScans scans={scans} />
        )}
      </div>
    </div>
  );
}
