import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link2, Globe, Lock, Clock, Users, Eye, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ScannerHeader from "../components/scanner/ScannerHeader";
import FraudScoreDisplay from "../components/scanner/FraudScoreDisplay";
import ClickSimulationModal from "../components/scanner/ClickSimulationModal";
import SeniorScanExplanation from "../components/SeniorScanExplanation";
import TrustedContactModal from "../components/TrustedContactModal";
import { useNotify } from "../components/useNotify";
import { motion } from "framer-motion";
import { createScanHistory } from "@/lib/data";
import { analyzeLink, investigateWebsite } from "@/lib/api";
import { useLocation } from "react-router-dom";
import { SkeletonScannerResult } from "@/components/ui/skeleton";
import ScannerAnalysisProgress from "@/components/scanners/ScannerAnalysisProgress";
import TinyFishInvestigationCard from "../components/scanner/TinyFishInvestigationCard";
import { triggerHaptic } from "@/lib/haptics";

export default function LinkScanner() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [showSimModal, setShowSimModal] = useState(false);
  const [showTrustedContact, setShowTrustedContact] = useState(false);
  const [investigating, setInvestigating] = useState(false);
  const [tfResult, setTfResult] = useState(null);
  const notify = useNotify();

  useEffect(() => {
    if (location.state?.sharedContent) {
      setUrl(location.state.sharedContent);
    } else if (location.state?.demoInput) {
      setUrl(location.state.demoInput);
    }
  }, [location.state]);

  const handleScan = async (urlToScan = url) => {
    const targetUrl = (typeof urlToScan === 'string' ? urlToScan : url).trim();
    if (!targetUrl) return;

    setScanning(true);
    setResult(null);
    setTfResult(null);

    try {
      const res = await analyzeLink(targetUrl);
      setResult(res);
      notify(res.risk_level, "link");

      await createScanHistory({
        scan_type: "link",
        input_content: targetUrl.substring(0, 240),
        fraud_score: res.fraud_score,
        risk_level: res.risk_level,
        ai_analysis: res.analysis || res.ai_analysis,
        reasons: res.reasons,
      });
      queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
    } catch (err) {
      console.error("Link scan error:", err);
    } finally {
      setScanning(false);
    }
  };

  const handleTinyFishInvestigation = async (urlToInvestigate = url) => {
    const targetUrl = (typeof urlToInvestigate === 'string' ? urlToInvestigate : url).trim();
    if (!targetUrl) return;

    setInvestigating(true);

    try {
      const res = await investigateWebsite(targetUrl);
      setTfResult(res?.tinyfishInvestigation || res);
      if (res?.fraud_score !== undefined) {
        setResult(res);
        notify(res.risk_level, "link");
      }

      await createScanHistory({
        scan_type: "link",
        input_content: `[TinyFish Live Agent] ${targetUrl.substring(0, 200)}`,
        fraud_score: res.fraud_score || 0,
        risk_level: res.risk_level || "safe",
        ai_analysis: res.analysis || res.tinyfishInvestigation?.summary || "TinyFish Live Browser Investigation",
        reasons: res.reasons || res.tinyfishInvestigation?.observations || [],
      });
      queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
    } catch (err) {
      console.error("TinyFish investigation error:", err);
    } finally {
      setInvestigating(false);
    }
  };

  const sampleLinks = [
    { name: "PayPal Phishing Clone", url: "https://paypal-security-verification.com/webscr/login?cmd=_login_run" },
    { name: "SBI KYC Phishing Portal", url: "https://sbi-kyc-update-portal.online/auth" },
    { name: "Obfuscated Shortener", url: "https://bit.ly/3xFakeRewardClaim" }
  ];

  return (
    <div className="space-y-6 pb-6">
      <ScannerHeader
        icon={Link2}
        title="URL & Deep Link Inspector"
        description="Verify domain reputation, check for typosquatting, homograph attacks, and shortener redirection traps"
        color="#00e5ff"
      />

      {/* Main Input Card */}
      <div className="ghost-card p-5 space-y-4">
        {/* Sample Links Quick Select */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: 'var(--ghost-text-dim)' }}>
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" /> Benchmark Test Targets
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleLinks.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => { setUrl(sample.url); handleScan(sample.url); }}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg border hover:border-cyan-400/50 transition-all text-left cursor-pointer"
                style={{
                  background: 'var(--ghost-surface-2)',
                  borderColor: 'var(--ghost-border)',
                  color: 'var(--ghost-text)'
                }}>
                <span className="text-cyan-600 dark:text-cyan-400 font-mono mr-1">Target:</span>
                {sample.name}
              </button>
            ))}
          </div>
        </div>

        {/* Input Field */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter web address or URL... e.g. https://sbi-kyc-update-portal.online"
            className="h-12 bg-transparent text-sm font-mono font-medium focus-visible:ring-1 focus-visible:ring-cyan-500/50"
            style={{ color: 'var(--ghost-text)', borderColor: 'var(--ghost-border)' }}
          />
          <Button
            onClick={() => handleScan()}
            disabled={scanning || investigating || !url.trim()}
            className="h-12 px-6 rounded-xl font-bold transition-all shadow-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 shrink-0 cursor-pointer">
            {scanning ? "Analyzing..." : "Inspect Link"}
          </Button>

          <Button
            onClick={() => handleTinyFishInvestigation()}
            disabled={scanning || investigating || !url.trim()}
            variant="outline"
            className="h-12 px-4 rounded-xl font-bold border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400 transition-all shrink-0 cursor-pointer">
            {investigating ? "Investigating..." : "🤖 TinyFish AI"}
          </Button>
        </div>
      </div>

      {/* TinyFish Display */}
      {(investigating || tfResult || result?.tinyfishInvestigation) && (
        <TinyFishInvestigationCard
          investigation={tfResult || result?.tinyfishInvestigation}
          isInvestigating={investigating}
          onInvestigate={() => handleTinyFishInvestigation()}
          targetUrl={url}
        />
      )}

      {/* Scanning Loader */}
      {scanning && (
        <div className="space-y-4">
          <ScannerAnalysisProgress isAnalyzing={scanning} title="Deep Domain Reputation & SSL Analysis" />
          <SkeletonScannerResult />
        </div>
      )}

      {/* Results */}
      {result && !scanning && (
        <div className="space-y-6">
          {/* Senior Plain-Language Explanation */}
          <SeniorScanExplanation result={result} rawInput={url} scanType="url" />

          {/* Ask Trusted Contact Button */}
          <div className="flex justify-end">
            <button
              onClick={async () => {
                await triggerHaptic("light");
                setShowTrustedContact(true);
              }}
              className="h-11 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer">
              <Users className="w-4 h-4" />
              <span>Ask Trusted Contact / Family Member</span>
            </button>
          </div>

          {/* Interactive Simulation Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
            result.risk_level === 'safe'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                result.risk_level === 'safe' ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-amber-500/15 border-amber-500/30'
              }`}>
                {result.risk_level === 'safe' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Eye className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--ghost-text)' }}>
                  {result.risk_level === 'safe' ? "Safe Domain Security Walkthrough" : "Safe Threat Simulation Sandbox"}
                </h4>
                <p className="text-xs" style={{ color: 'var(--ghost-text-dim)' }}>
                  {result.risk_level === 'safe'
                    ? "Explore how standard HTTPS encryption and authentic domain identity protect your connection."
                    : "Curious what would happen if you opened this link? Walk through a safe educational simulation."}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowSimModal(true)}
              className={`text-xs font-bold text-slate-950 shrink-0 h-9 px-4 rounded-lg cursor-pointer ${
                result.risk_level === 'safe' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-amber-500 hover:bg-amber-400'
              }`}>
              {result.risk_level === 'safe' ? "Launch Walkthrough" : "Launch Simulation"}
            </Button>
          </div>

          {/* Technical Fraud Score Display */}
          <FraudScoreDisplay
            score={result.fraud_score}
            riskLevel={result.risk_level}
            confidence={result.confidence || "high"}
            reasons={result.reasons}
            analysis={result.analysis || result.ai_analysis}
            attackIntent={result.attack_intent}
            signals={result.signals}
            threatReconstruction={result.threat_reconstruction}
            similarPatterns={result.similar_patterns}
            reasonCodes={result.reasonCodes || []}
            source={result.source}
            rawScanData={{
              scan_type: "link",
              input_content: url,
              fraud_score: result.fraud_score,
              analysis: result.analysis || result.ai_analysis,
              reasons: result.reasons,
              impersonated_brand: result.impersonated_brand
            }}
          />

          <ClickSimulationModal
            isOpen={showSimModal}
            onClose={() => setShowSimModal(false)}
            url={url}
            steps={result.simulation_steps}
            riskLevel={result.risk_level}
          />
        </div>
      )}

      <TrustedContactModal
        isOpen={showTrustedContact}
        onClose={() => setShowTrustedContact(false)}
        scanSummary={result}
      />
    </div>
  );
}
