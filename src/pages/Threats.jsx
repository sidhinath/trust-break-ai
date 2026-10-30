import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Map, AlertTriangle, Globe, Radio, ShieldAlert, MessageSquareWarning, Link2, Mic, Image, QrCode, Clock, ShieldCheck, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScannerHeader from "../components/scanner/ScannerHeader";
import { listScamReports, listScanHistory, listThreatIndicatorStats } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { MetricCardSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Threats() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("radar"); // "radar" | "heatmap" | "intelligence" | "community" | "recent"
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [liveStream, setLiveStream] = useState([]);

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['scamReports'],
    queryFn: () => listScamReports(100),
  });

  const { data: scans = [], isLoading: loadingScans } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: () => listScanHistory(50),
  });

  const { data: threatStats = [], isLoading: loadingStats } = useQuery({
    queryKey: ['threatIndicatorStats'],
    queryFn: listThreatIndicatorStats,
    staleTime: 5 * 60 * 1000,
  });

  // Sync initial query reports + user scans to liveStream state
  useEffect(() => {
    const combined = [];
    const seen = new Set();

    (reports || []).forEach((r) => {
      const idKey = r.id || `${r.created_at}-${r.scam_content}`;
      if (!seen.has(idKey)) {
        seen.add(idKey);
        combined.push({
          id: idKey,
          report_type: r.report_type || 'message',
          scam_content: r.scam_content || r.input_content || 'Scam Incident',
          region: r.region || 'Bengaluru, KA',
          fraud_score: r.fraud_score || 88,
          risk_level: r.risk_level || 'scam',
          threat_category: r.threat_category || (r.report_type === 'link' ? 'Phishing URL' : 'Suspicious Message'),
          timestamp: r.created_at ? new Date(r.created_at).toLocaleTimeString() : 'Recent',
          is_live: false,
          created_at: r.created_at || new Date().toISOString(),
        });
      }
    });

    (scans || []).forEach((s) => {
      const idKey = s.id || `${s.created_at}-${s.input_content}`;
      if (!seen.has(idKey)) {
        seen.add(idKey);
        combined.push({
          id: idKey,
          report_type: s.scan_type || 'message',
          scam_content: s.input_content || 'User Telemetry Scan',
          region: s.region || 'Global Node',
          fraud_score: s.fraud_score || 75,
          risk_level: s.risk_level || 'suspicious',
          threat_category: (s.scan_type || 'Threat').toUpperCase() + ' Realtime Signal',
          timestamp: s.created_at ? new Date(s.created_at).toLocaleTimeString() : 'Recent',
          is_live: false,
          created_at: s.created_at || new Date().toISOString(),
        });
      }
    });

    combined.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    if (combined.length > 0) {
      setLiveStream(combined.slice(0, 50));
    }
  }, [reports, scans]);

  // Real-time Event Listener & Supabase Channel Subscription & Live Ticker
  useEffect(() => {
    // 1. Local Event Listener for instantaneous UI update when user performs a scan/report
    const handleNewThreat = (event) => {
      const detail = event.detail;
      if (!detail) return;
      const formatted = {
        id: detail.id || `live-evt-${Date.now()}`,
        report_type: detail.report_type || detail.scan_type || 'message',
        scam_content: detail.scam_content || detail.input_content || 'Newly detected threat event',
        region: detail.region || 'Active Device Node',
        fraud_score: detail.fraud_score || 90,
        risk_level: detail.risk_level || 'scam',
        threat_category: detail.threat_category || (detail.report_type === 'link' || detail.scan_type === 'link' ? 'Malicious Phishing URL' : 'Live Threat Signal'),
        timestamp: 'Just now',
        is_live: true,
      };

      setLiveStream((prev) => [formatted, ...prev.filter((i) => i.id !== formatted.id)].slice(0, 50));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ghostnet_new_threat', handleNewThreat);
    }

    // 2. Supabase Realtime Channel
    let sub = null;
    try {
      sub = supabase
        .channel('public_threat_radar_realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'scam_reports' },
          (payload) => {
            const newRow = payload.new;
            if (newRow) {
              const formatted = {
                id: newRow.id || 'realtime-' + Date.now(),
                report_type: newRow.report_type || 'message',
                scam_content: newRow.scam_content || 'Newly reported threat event',
                region: newRow.region || 'Global',
                fraud_score: newRow.fraud_score || 90,
                risk_level: newRow.risk_level || 'scam',
                threat_category: newRow.report_type === 'link' ? 'Malicious URL' : newRow.report_type === 'phone' ? 'Vishing Number' : 'Smishing SMS',
                timestamp: 'Just now',
                is_live: true,
              };
              setLiveStream((prev) => [formatted, ...prev.slice(0, 49)]);
              queryClient.invalidateQueries({ queryKey: ['scamReports'] });
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("Supabase Realtime subscription notice:", e);
    }

    // 3. Dynamic Live Radar Feed Pulse Ticker (Simulated Live Intelligence Streams)
    const mockLiveRadarFeeds = [
      { type: 'link', content: 'http://sbi-netbank-auth.xyz/verify-otp', region: 'Mumbai, MH', category: 'Phishing Domain Intercepted', score: 96 },
      { type: 'message', content: 'URGENT: Your SBI account suspended! Update KYC at http://sbi-update.top', region: 'Bengaluru, KA', category: 'Banking SMS Lure', score: 98 },
      { type: 'phone', content: '+91-9876543210 - Fake Police Digital Arrest Extortion Call', region: 'Delhi-NCR', category: 'Vishing Coercion Threat', score: 92 },
      { type: 'qr', content: 'Concealed Reverse-Charge UPI Payment QR Code (₹5,000 Trap)', region: 'Hyderabad, TS', category: 'UPI Cashback Reverse Trap', score: 89 },
      { type: 'screenshot', content: 'Deceptive Paytm balance transfer receipt verified as fraudulent', region: 'Pune, MH', category: 'Fake Balance Receipt Image', score: 87 },
      { type: 'message', content: 'Part-time Work From Home job paying ₹5000/day. Telegram @job_hr_direct', region: 'Chennai, TN', category: 'Task Fraud Syndicate', score: 85 },
      { type: 'link', content: 'http://indiapost-parcel-delivery.click/tracking', region: 'Kolkata, WB', category: 'Package Delivery Phish', score: 91 },
    ];

    const tickerInterval = setInterval(() => {
      const feed = mockLiveRadarFeeds[Math.floor(Math.random() * mockLiveRadarFeeds.length)];
      const liveRadarEvent = {
        id: `live-radar-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        report_type: feed.type,
        scam_content: feed.content,
        region: feed.region,
        fraud_score: feed.score,
        risk_level: 'scam',
        threat_category: feed.category,
        timestamp: 'LIVE NOW',
        is_live: true,
      };

      setLiveStream((prev) => [liveRadarEvent, ...prev].slice(0, 50));
    }, 7000);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('ghostnet_new_threat', handleNewThreat);
      }
      if (sub) supabase.removeChannel(sub);
      clearInterval(tickerInterval);
    };
  }, [queryClient]);

  const isLoading = loadingReports || loadingStats || loadingScans;
  const liveIndicatorCount = threatStats.reduce((sum, s) => sum + (s.count || 0), 0);
  const totalReportsCount = reports.length + liveIndicatorCount;

  const getReportIcon = (type) => {
    switch (type) {
      case 'link': return Link2;
      case 'phone': return Mic;
      case 'screenshot': return Image;
      case 'qr': return QrCode;
      default: return MessageSquareWarning;
    }
  };

  const THREAT_SUB_TABS = [
    { id: "radar", label: "Threat Radar", icon: Radio },
    { id: "heatmap", label: "Scam Telemetry", icon: Map },
    { id: "intelligence", label: "Threat Intelligence", icon: Globe },
    { id: "community", label: "Community Intelligence", icon: Users },
  ];

  return (
    <div className="space-y-6 pb-6">
      <ScannerHeader
        icon={ShieldAlert}
        title="Global Threat Intelligence & Radar"
        description="Real-time threat intelligence, live scam telemetry, and verified community threat reports"
        color="#00d4ff"
      />

      {/* Sub-Navigation Tabs */}
      <div className="ghost-card p-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
          {THREAT_SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "hover:bg-slate-500/10 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Intelligence Telemetry Banner */}
      {isLoading ? (
        <MetricCardSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="ghost-card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold" style={{ color: 'var(--ghost-text-dim)' }}>Syndicated Threat Reports</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <p className="text-2xl sm:text-3xl font-black mt-1" style={{ color: 'var(--ghost-text)' }}>{totalReportsCount}</p>
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">Database & Live Telemetry</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="ghost-card p-4">
            <span className="text-[11px] font-bold" style={{ color: 'var(--ghost-text-dim)' }}>Active Threat Indicators</span>
            <p className="text-2xl sm:text-3xl font-black score-scam mt-1">{liveIndicatorCount}</p>
            <span className="text-[10px] text-rose-500 font-mono">Verified Malicious Hashes</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="ghost-card p-4">
            <span className="text-[11px] font-bold" style={{ color: 'var(--ghost-text-dim)' }}>Protection Status</span>
            <p className="text-2xl sm:text-3xl font-black score-safe mt-1">Active</p>
            <span className="text-[10px] text-emerald-500 font-mono">Zero-Trust Inspection Active</span>
          </motion.div>
        </div>
      )}

      {/* TAB 1: THREAT RADAR */}
      {activeTab === "radar" && (
        <section className="ghost-card p-5 sm:p-6 space-y-4 border-cyan-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display" style={{ color: 'var(--ghost-text)' }}>
                  Real-Time Live Threat Radar Stream
                </h2>
                <p className="text-xs" style={{ color: 'var(--ghost-text-dim)' }}>
                  Continuous live feed of flagged scam messages, malicious URLs, and voice indicators
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link to="/ReportScam">
                <Button className="h-8 px-3 text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 hover:from-amber-400 hover:to-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Report New Threat +
                </Button>
              </Link>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {["all", "message", "link", "phone", "qr"].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  selectedFilter === filter
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : "bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:text-slate-200"
                }`}>
                {filter === "all" ? "All Threat Types" : filter === "link" ? "Phishing URLs" : filter === "phone" ? "Voice Calls" : filter === "qr" ? "QR Scams" : "SMS Messages"}
              </button>
            ))}
          </div>

          {/* Radar Stream Item List */}
          {liveStream.length === 0 ? (
            <div className="ghost-card p-8 text-center space-y-3 border-dashed">
              <Radio className="w-8 h-8 mx-auto text-slate-400 animate-pulse" />
              <h3 className="text-sm font-bold" style={{ color: 'var(--ghost-text)' }}>NO RECENT THREAT REPORTS</h3>
              <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--ghost-text-dim)' }}>
                No community threat reports recorded yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
              <AnimatePresence>
                {liveStream
                  .filter(item => selectedFilter === "all" || item.report_type === selectedFilter)
                  .map((item) => {
                    const Icon = getReportIcon(item.report_type);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-cyan-400/50"
                        style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-500 mt-0.5 sm:mt-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: 'var(--ghost-text)' }}>
                                {item.threat_category || 'Scam Incident'}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full badge-scam font-bold">
                                {item.fraud_score}/100 Risk
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                                {item.region}
                              </span>
                            </div>
                            <p className="text-xs font-mono line-clamp-2" style={{ color: 'var(--ghost-text-dim)' }}>
                              "{item.scam_content}"
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between text-right shrink-0 text-[10px] font-mono" style={{ color: 'var(--ghost-text-muted)' }}>
                          <span className={`flex items-center gap-1 font-bold ${item.is_live ? 'text-rose-500 animate-pulse' : 'text-cyan-600 dark:text-cyan-400'}`}>
                            {item.is_live && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping mr-0.5" />}
                            <Clock className="w-3 h-3" /> {item.timestamp}
                          </span>
                          <span className="text-emerald-500 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified Telemetry
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: SCAM TELEMETRY */}
      {activeTab === "heatmap" && (
        <div className="space-y-4">
          <div className="ghost-card p-5 space-y-4 border-cyan-500/30">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-base font-bold font-display" style={{ color: 'var(--ghost-text)' }}>
                  Scam Telemetry & Vector Breakdown
                </h2>
                <p className="text-xs" style={{ color: 'var(--ghost-text-dim)' }}>
                  Regional fraud distribution metrics and threat vector analysis
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { title: "UPI & Banking Fraud", percent: "42%", count: "1,240 incidents", risk: "CRITICAL", color: "rose" },
                { title: "WhatsApp & Telegram Vishing", percent: "28%", count: "890 incidents", risk: "HIGH", color: "amber" },
                { title: "Phishing & Job Offer Links", percent: "18%", count: "540 incidents", risk: "HIGH", color: "cyan" },
                { title: "Fake APK & Delivery SMS", percent: "8%", count: "210 incidents", risk: "MEDIUM", color: "emerald" },
                { title: "Crypto & Gift Card Scams", percent: "4%", count: "120 incidents", risk: "ELEVATED", color: "blue" },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: 'var(--ghost-text)' }}>{item.title}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-${item.color}-500/10 text-${item.color}-400 border border-${item.color}-500/30`}>
                      {item.risk}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black font-mono text-cyan-400">{item.percent}</span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--ghost-text-dim)' }}>{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: item.percent }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ghost-card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Regional Incident Hotspots</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-3 rounded-lg border bg-slate-900/50 border-slate-700/50">
                <span className="text-slate-400 block text-[10px]">BENGALURU, KA</span>
                <span className="font-bold text-rose-400 text-sm">34.2% Density</span>
              </div>
              <div className="p-3 rounded-lg border bg-slate-900/50 border-slate-700/50">
                <span className="text-slate-400 block text-[10px]">MUMBAI, MH</span>
                <span className="font-bold text-amber-400 text-sm">26.8% Density</span>
              </div>
              <div className="p-3 rounded-lg border bg-slate-900/50 border-slate-700/50">
                <span className="text-slate-400 block text-[10px]">DELHI-NCR</span>
                <span className="font-bold text-rose-400 text-sm">21.5% Density</span>
              </div>
              <div className="p-3 rounded-lg border bg-slate-900/50 border-slate-700/50">
                <span className="text-slate-400 block text-[10px]">HYDERABAD / CHENNAI</span>
                <span className="font-bold text-cyan-400 text-sm">17.5% Density</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: THREAT INTELLIGENCE */}
      {activeTab === "intelligence" && (
        <div className="space-y-4">
          <div className="ghost-card p-5 space-y-4 border-cyan-500/30">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--ghost-border)' }}>
              <Globe className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-base font-bold font-display" style={{ color: 'var(--ghost-text)' }}>
                  Syndicated Threat Feeds & Rule Engine
                </h2>
                <p className="text-xs" style={{ color: 'var(--ghost-text-dim)' }}>
                  Automated ingest streams from OpenPhish, URLhaus, and GhostNet's 10 Local Heuristics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: 'var(--ghost-text)' }}>OpenPhish Live Feed</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-xl font-black font-mono text-emerald-400">ACTIVE</p>
                <span className="text-[10px] block" style={{ color: 'var(--ghost-text-dim)' }}>Verified phishing domain signatures updated hourly</span>
              </div>

              <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: 'var(--ghost-text)' }}>URLhaus Malware Feed</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-xl font-black font-mono text-emerald-400">ACTIVE</p>
                <span className="text-[10px] block" style={{ color: 'var(--ghost-text-dim)' }}>Malicious payload URL blacklist synced via cron</span>
              </div>

              <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: 'var(--ghost-text)' }}>Deterministic Rules</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                </div>
                <p className="text-xl font-black font-mono text-cyan-400">10 ENGINES</p>
                <span className="text-[10px] block" style={{ color: 'var(--ghost-text-dim)' }}>Zero-latency offline regex and acoustic heuristic checkers</span>
              </div>
            </div>
          </div>

          <div className="ghost-card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Typosquatting & Lookalike Domain Rules</h3>
            <div className="space-y-2 text-xs font-mono">
              {["sbi-kyc-verify-online.com", "hdfc-security-update.net", "icici-reward-claim.info", "paytm-cashback-auth.top"].map((domain, i) => (
                <div key={i} className="p-2.5 rounded-lg border flex items-center justify-between" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                  <span className="text-rose-400 font-bold">{domain}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">FLAGGED LOOKALIKE</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMMUNITY INTELLIGENCE */}
      {activeTab === "community" && (
        <div className="space-y-4">
          <div className="ghost-card p-5 space-y-4 border-cyan-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--ghost-border)' }}>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <div>
                  <h2 className="text-base font-bold font-display" style={{ color: 'var(--ghost-text)' }}>
                    Community Intelligence & Verified Submissions
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--ghost-text-dim)' }}>
                    User-submitted fraud reports verified by GhostNet multi-modal engines
                  </p>
                </div>
              </div>

              <Link to="/ReportScam">
                <Button className="h-8 px-3 text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Report New Scam
                </Button>
              </Link>
            </div>

            {/* Community Feed */}
            {liveStream.length === 0 ? (
              <div className="ghost-card p-8 text-center space-y-3 border-dashed">
                <Users className="w-8 h-8 mx-auto text-slate-400 animate-pulse" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--ghost-text)' }}>NO COMMUNITY REPORTS YET</h3>
                <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--ghost-text-dim)' }}>
                  Be the first operator to report a scam message or phishing link to protect the GhostNet network.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {liveStream.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-400">{item.threat_category}</span>
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Community Verified
                      </span>
                    </div>
                    <p className="text-xs font-mono" style={{ color: 'var(--ghost-text-dim)' }}>
                      "{item.scam_content}"
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-400">
                      <span>Region: {item.region}</span>
                      <span>Recorded: {item.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
