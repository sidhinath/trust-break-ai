import React, { useMemo, useState } from "react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  listScanHistory,
  deleteScanHistory,
  countScanHistory,
  SCAN_HISTORY_PAGE_SIZE,
} from "@/lib/data";
import { 
  FileText, Search, Filter, ShieldAlert, AlertTriangle, 
  X, MessageSquareWarning, Link2, QrCode, Image as ImageIcon, Mic, Clock, ChevronRight, Trash2
} from "lucide-react";
import ScannerHeader from "@/components/scanner/ScannerHeader";
import SourceBadge from "@/components/scanner/SourceBadge";
import { ThreatListSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ProtectedPage from '@/components/auth/ProtectedPage';
import { scoreToRisk } from '@/lib/scanner';

const TYPE_ICONS = {
  message: MessageSquareWarning,
  url: Link2,
  link: Link2,
  qr: QrCode,
  screenshot: ImageIcon,
  vision: ImageIcon,
  voice: Mic,
  audio: Mic,
};

export default function Reports() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const queryClient = useQueryClient();

  const handleDelete = async (id) => {
    try {
      await deleteScanHistory(id);
    } catch (err) {
      console.warn('[Reports] Delete failed:', err);
    }
    // Prefix invalidation refreshes both the paginated list and the sidebar/home
    // copies that share the `scanHistory` key.
    queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
    queryClient.invalidateQueries({ queryKey: ["scanHistoryCount"] });
  };

  const { data: historyCount = 0 } = useQuery({
    queryKey: ["scanHistoryCount"],
    queryFn: () => countScanHistory(),
    staleTime: 60_000,
  });

  const {
    data: historyPages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["scanHistory", "paginated"],
    queryFn: ({ pageParam }) => listScanHistory(SCAN_HISTORY_PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((total, page) => total + page.length, 0);
      if (historyCount > 0 && loaded >= historyCount) return undefined;
      if (lastPage.length < SCAN_HISTORY_PAGE_SIZE) return undefined;
      return allPages.length * SCAN_HISTORY_PAGE_SIZE;
    },
  });

  const scans = useMemo(
    () => (historyPages?.pages || []).flat(),
    [historyPages]
  );

  const filteredScans = scans.filter((s) => {
    const matchesSearch =
      !search ||
      (s.input_content && s.input_content.toLowerCase().includes(search.toLowerCase())) ||
      (s.analysis && s.analysis.toLowerCase().includes(search.toLowerCase())) ||
      (s.threat_category && s.threat_category.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === "high_risk") {
      return s.risk_level === "scam" || scoreToRisk(s.fraud_score) === "scam";
    }
    if (filterType !== "all") {
      return (s.scan_type || "").toLowerCase().includes(filterType.toLowerCase());
    }
    return true;
  });

  return (
    <ProtectedPage feature="Scan History Reports">
    <div className="space-y-6 pb-6">
      <ScannerHeader
        icon={FileText}
        title="Scan History & Threat Reports"
        description="Review historical threat telemetry, audit logs, and evidence details."
        color="#00e5ff"
      />

      {/* Filter & Search Bar */}
      <div className="tb-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by URL, keyword, or threat type..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none transition-colors focus:border-emerald-500"
              style={{
                background: "var(--tb-surface-2)",
                borderColor: "var(--tb-border)",
                color: "var(--tb-text)",
              }}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
            <Filter className="w-3.5 h-3.5 text-emerald-400 mr-1 shrink-0" />
            {[
              { id: "all", label: "All Logs" },
              { id: "high_risk", label: "High Risk" },
              { id: "message", label: "Messages" },
              { id: "url", label: "Links" },
              { id: "qr", label: "QR Codes" },
              { id: "screenshot", label: "Screenshot" },
              { id: "voice", label: "Voice" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`touch-manipulation min-h-[44px] min-w-[44px] shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-sm font-medium border transition-transform duration-75 active:scale-95 ${
                  filterType === f.id
                    ? "bg-emerald-500/15 border-emerald-400 text-emerald-400 font-bold"
                    : "hover:border-slate-500 text-slate-400"
                }`}
                style={{
                  background: filterType === f.id ? undefined : "var(--tb-surface-2)",
                  borderColor: filterType === f.id ? undefined : "var(--tb-border)",
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <ThreatListSkeleton count={6} />
      ) : filteredScans.length === 0 ? (
        <div className="tb-card p-12 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-emerald-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold" style={{ color: "var(--tb-text)" }}>
            No Scan Records Found
          </h3>
          <p className="text-xs max-w-sm mx-auto" style={{ color: "var(--tb-text-dim)" }}>
            {search || filterType !== "all"
              ? "No scan logs match your search filter criteria."
              : "Perform a scan using any of TrustBreak AI's 5 scanners to populate your history log."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredScans.map((scan, idx) => {
            const Icon = TYPE_ICONS[scan.scan_type] || MessageSquareWarning;
            const isScam = scan.risk_level === "scam" || scoreToRisk(scan.fraud_score) === "scam";
            const isSuspicious = scan.risk_level === "suspicious" || scoreToRisk(scan.fraud_score) === "suspicious";

            const badgeClass = isScam
              ? "badge-scam"
              : isSuspicious
              ? "badge-suspicious"
              : "badge-safe";

            const badgeText = isScam ? "High Risk / Scam" : isSuspicious ? "Suspicious" : "Safe";

            return (
              <div
                key={scan.id || idx}
                onClick={() => setSelectedReport(scan)}
                role="button"
                className="touch-manipulation min-h-[44px] min-w-[44px] tb-card flex flex-col gap-3 p-4 rounded-2xl hover:border-emerald-500/40 transition-transform duration-75 active:scale-95 cursor-pointer group md:flex-row md:items-center md:justify-between">
                <div className="flex items-start justify-between gap-3 w-full min-w-0 md:flex-1">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isScam ? "bg-rose-500/10 border-rose-500/30 text-rose-500" :
                      isSuspicious ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                      "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-bold truncate group-hover:text-emerald-400 transition-colors" style={{ color: "var(--tb-text)" }}>
                        {scan.input_content || scan.analysis || "Scan Report Entry"}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="whitespace-nowrap">{new Date(scan.created_at || scan.timestamp || Date.now()).toLocaleString()}</span>
                        {scan.threat_category && (
                          <>
                            <span className="whitespace-nowrap">•</span>
                            <span className="text-emerald-400 whitespace-nowrap">{scan.threat_category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" className="h-8 text-xs gap-1 text-emerald-400 hover:text-emerald-300">
                      Details <ChevronRight className="w-4 h-4" />
                    </Button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(scan.id)
                      }}
                      className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-rose-400 transition-colors active:scale-95"
                      aria-label="Delete inspection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 whitespace-nowrap md:pl-[52px]">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                    {badgeText}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-700 text-slate-400">
                    Score: {scan.fraud_score || 0}/100
                  </span>
                  {scan.source && <SourceBadge source={scan.source} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batched history: only 20 rows are read per page. */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="min-h-[44px] px-5 text-sm font-semibold"
          >
            {isFetchingNextPage
              ? "Loading more..."
              : `Load More (${SCAN_HISTORY_PAGE_SIZE} at a time)`}
          </Button>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-xl w-full tb-card p-6 space-y-4 max-h-[85vh] overflow-y-auto relative border-emerald-500/40">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  selectedReport.risk_level === "scam" || scoreToRisk(selectedReport.fraud_score) === "scam" ? "badge-scam" : "badge-safe"
                }`}>
                  Score: {selectedReport.fraud_score || 0}/100 Risk Rating
                </span>
                {selectedReport.source && <SourceBadge source={selectedReport.source} />}
              </div>
              <h3 className="text-lg font-bold font-display pt-1" style={{ color: "var(--tb-text)" }}>
                Inspection Audit Report
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Logged at: {new Date(selectedReport.created_at || selectedReport.timestamp || Date.now()).toLocaleString()}
              </p>
            </div>

            <div className="p-3 rounded-xl border space-y-1" style={{ background: "var(--tb-surface-2)", borderColor: "var(--tb-border)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">Inspected Content Payload</span>
              <p className="text-xs font-mono break-all" style={{ color: "var(--tb-text)" }}>
                "{selectedReport.input_content || "N/A"}"
              </p>
            </div>

            {selectedReport.analysis && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Threat Verdict & Analysis</h4>
                <p className="text-xs leading-relaxed" style={{ color: "var(--tb-text-dim)" }}>
                  {selectedReport.analysis}
                </p>
              </div>
            )}

            {selectedReport.reasons && selectedReport.reasons.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Flagged Security Indicators</h4>
                <div className="space-y-1.5">
                  {selectedReport.reasons.map((r, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs text-rose-300 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setSelectedReport(null)} className="h-9 px-4 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950">
                Close Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedPage>
  );
}


