import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listScanHistory } from "@/lib/data";
import { 
  FileText, Search, Filter, ShieldAlert, AlertTriangle, 
  X, MessageSquareWarning, Link2, QrCode, Image as ImageIcon, Mic, Clock, ChevronRight
} from "lucide-react";
import ScannerHeader from "@/components/scanner/ScannerHeader";
import SourceBadge from "@/components/scanner/SourceBadge";
import { ThreatListSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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

  const { data: scans = [], isLoading } = useQuery({
    queryKey: ["scanHistory"],
    queryFn: () => listScanHistory(100),
  });

  const filteredScans = scans.filter((s) => {
    const matchesSearch =
      !search ||
      (s.input_content && s.input_content.toLowerCase().includes(search.toLowerCase())) ||
      (s.analysis && s.analysis.toLowerCase().includes(search.toLowerCase())) ||
      (s.threat_category && s.threat_category.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === "high_risk") {
      return s.risk_level === "scam" || s.fraud_score >= 70;
    }
    if (filterType !== "all") {
      return (s.scan_type || "").toLowerCase().includes(filterType.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-6">
      <ScannerHeader
        icon={FileText}
        title="Scan History & Threat Reports"
        description="Review historical threat telemetry, audit logs, and evidence details."
        color="#00e5ff"
      />

      {/* Filter & Search Bar */}
      <div className="ghost-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by URL, keyword, or threat type..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none transition-colors focus:border-cyan-500"
              style={{
                background: "var(--ghost-surface-2)",
                borderColor: "var(--ghost-border)",
                color: "var(--ghost-text)",
              }}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
            <Filter className="w-3.5 h-3.5 text-cyan-400 mr-1" />
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
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                  filterType === f.id
                    ? "bg-cyan-500/15 border-cyan-400 text-cyan-400 font-bold"
                    : "hover:border-slate-500 text-slate-400"
                }`}
                style={{
                  background: filterType === f.id ? undefined : "var(--ghost-surface-2)",
                  borderColor: filterType === f.id ? undefined : "var(--ghost-border)",
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
        <div className="ghost-card p-12 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-cyan-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold" style={{ color: "var(--ghost-text)" }}>
            No Scan Records Found
          </h3>
          <p className="text-xs max-w-sm mx-auto" style={{ color: "var(--ghost-text-dim)" }}>
            {search || filterType !== "all"
              ? "No scan logs match your search filter criteria."
              : "Perform a scan using any of GhostNet's 5 scanners to populate your history log."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredScans.map((scan, idx) => {
            const Icon = TYPE_ICONS[scan.scan_type] || MessageSquareWarning;
            const isScam = scan.risk_level === "scam" || scan.fraud_score >= 70;
            const isSuspicious = scan.risk_level === "suspicious" || (scan.fraud_score >= 35 && scan.fraud_score < 70);

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
                className="ghost-card p-4 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isScam ? "bg-rose-500/10 border-rose-500/30 text-rose-500" :
                    isSuspicious ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                    "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                        {badgeText}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-700 text-slate-400">
                        Score: {scan.fraud_score || 0}/100
                      </span>
                      {scan.source && <SourceBadge source={scan.source} />}
                    </div>

                    <p className="text-xs font-bold truncate group-hover:text-cyan-400 transition-colors" style={{ color: "var(--ghost-text)" }}>
                      {scan.input_content || scan.analysis || "Scan Report Entry"}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3 text-cyan-500" />
                      <span>{new Date(scan.created_at || scan.timestamp || Date.now()).toLocaleString()}</span>
                      {scan.threat_category && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-400">{scan.threat_category}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" className="h-8 text-xs gap-1 text-cyan-400 hover:text-cyan-300">
                    Details <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-xl w-full ghost-card p-6 space-y-4 max-h-[85vh] overflow-y-auto relative border-cyan-500/40">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  selectedReport.risk_level === "scam" || selectedReport.fraud_score >= 70 ? "badge-scam" : "badge-safe"
                }`}>
                  Score: {selectedReport.fraud_score || 0}/100 Risk Rating
                </span>
                {selectedReport.source && <SourceBadge source={selectedReport.source} />}
              </div>
              <h3 className="text-lg font-bold font-display pt-1" style={{ color: "var(--ghost-text)" }}>
                Inspection Audit Report
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Logged at: {new Date(selectedReport.created_at || selectedReport.timestamp || Date.now()).toLocaleString()}
              </p>
            </div>

            <div className="p-3 rounded-xl border space-y-1" style={{ background: "var(--ghost-surface-2)", borderColor: "var(--ghost-border)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">Inspected Content Payload</span>
              <p className="text-xs font-mono break-all" style={{ color: "var(--ghost-text)" }}>
                "{selectedReport.input_content || "N/A"}"
              </p>
            </div>

            {selectedReport.analysis && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Threat Verdict & Analysis</h4>
                <p className="text-xs leading-relaxed" style={{ color: "var(--ghost-text-dim)" }}>
                  {selectedReport.analysis}
                </p>
              </div>
            )}

            {selectedReport.reasons && selectedReport.reasons.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Flagged Security Indicators</h4>
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
              <Button onClick={() => setSelectedReport(null)} className="h-9 px-4 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950">
                Close Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
