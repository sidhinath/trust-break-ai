import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquareWarning, Sparkles, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ScannerHeader from "../components/scanner/ScannerHeader";
import FraudScoreDisplay from "../components/scanner/FraudScoreDisplay";
import TinyFishInvestigationCard from "../components/scanner/TinyFishInvestigationCard";
import SeniorScanExplanation from "../components/SeniorScanExplanation";
import TrustedContactModal from "../components/TrustedContactModal";
import { useNotify } from "../components/useNotify";
import { createScanHistory } from "@/lib/data";
import { analyzeMessage, investigateWebsite, extractUrlFromText } from "@/lib/api";
import { SAMPLE_THREATS } from "@/lib/threatLibrary";
import { useLocation } from "react-router-dom";
import { SkeletonScannerResult } from "@/components/ui/skeleton";
import ScannerAnalysisProgress from "@/components/scanners/ScannerAnalysisProgress";
import { triggerHaptic } from "@/lib/haptics";

export default function MessageScanner() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [investigating, setInvestigating] = useState(false);
  const [tfResult, setTfResult] = useState(null);
  const [showTrustedContact, setShowTrustedContact] = useState(false);
  const [seniorModeActive, setSeniorModeActive] = useState(() => {
    try {
      return document.body.classList.contains("family-safety-mode") || localStorage.getItem("ghostnet_senior_mode") === "true";
    } catch {
      return false;
    }
  });

  const notify = useNotify();

  useEffect(() => {
    const syncSeniorMode = () => {
      setSeniorModeActive(document.body.classList.contains("family-safety-mode") || localStorage.getItem("ghostnet_senior_mode") === "true");
    };
    window.addEventListener("ghostnet_senior_mode_change", syncSeniorMode);
    return () => window.removeEventListener("ghostnet_senior_mode_change", syncSeniorMode);
  }, []);

  useEffect(() => {
    if (location.state?.sharedContent) {
      setMessage(location.state.sharedContent);
    } else if (location.state?.demoInput) {
      setMessage(location.state.demoInput);
    }
  }, [location.state]);

  const handleScan = async (textToScan = message) => {
    const text = (typeof textToScan === 'string' ? textToScan : message).trim();
    if (!text) return;
    
    setScanning(true);
    setResult(null);
    setTfResult(null);

    try {
      const res = await analyzeMessage(text);
      setResult(res);
      notify(res.risk_level, "message");

      await createScanHistory({
        scan_type: "message",
        input_content: text.substring(0, 240),
        fraud_score: res.fraud_score,
        risk_level: res.risk_level,
        ai_analysis: res.analysis || res.ai_analysis,
        reasons: res.reasons,
      });
      queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
    } catch (err) {
      console.error("Scan error:", err);
    } finally {
      setScanning(false);
    }
  };

  const handleTinyFishInvestigation = async (rawText = message) => {
    const targetUrl = extractUrlFromText(rawText);
    if (!targetUrl) return;

    setInvestigating(true);

    try {
      const res = await investigateWebsite(targetUrl);
      setTfResult(res?.tinyfishInvestigation || res);
      if (res?.fraud_score !== undefined) {
        setResult(res);
        notify(res.risk_level, "message");
      }

      await createScanHistory({
        scan_type: "message",
        input_content: `[TinyFish Live Agent] ${targetUrl.substring(0, 200)}`,
        fraud_score: res.fraud_score || 0,
        risk_level: res.risk_level || "safe",
        ai_analysis: res.analysis || res.tinyfishInvestigation?.summary || "TinyFish Live Browser Investigation",
        reasons: res.reasons || res.tinyfishInvestigation?.observations || [],
      });
      queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
    } catch (err) {
      console.error("TinyFish message URL investigation error:", err);
    } finally {
      setInvestigating(false);
    }
  };

  const handleSelectSample = (sampleText) => {
    setMessage(sampleText);
    handleScan(sampleText);
  };

  const messageThreats = SAMPLE_THREATS.filter(t => t.type === 'message');
  const extractedUrl = extractUrlFromText(message);

  return (
    <div className="space-y-6 pb-6">
      <ScannerHeader
        icon={MessageSquareWarning}
        title="Message & Social Engineering Scanner"
        description="Inspect SMS, WhatsApp, Telegram, or email text for urgency manipulation, credential harvesting, and fraudulent payment prompts"
        color="#00e5ff"
      />

      {/* Main Input Card */}
      <div className="ghost-card p-5 space-y-4">
        
        {/* Sample Quick Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: 'var(--ghost-text-dim)' }}>
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" /> Benchmark Test Scenarios
            </span>
            {message && (
              <button
                onClick={() => { setMessage(""); setResult(null); setTfResult(null); }}
                className="text-xs font-semibold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Clear Text
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {messageThreats.map((threat) => (
              <button
                key={threat.id}
                onClick={() => handleSelectSample(threat.sampleInput)}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg border hover:border-cyan-400/50 transition-all text-left cursor-pointer"
                style={{
                  background: 'var(--ghost-surface-2)',
                  borderColor: 'var(--ghost-border)',
                  color: 'var(--ghost-text)'
                }}>
                <span className="text-cyan-600 dark:text-cyan-400 font-mono mr-1">{threat.category}:</span>
                {threat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Area */}
        <div className="rounded-xl border focus-within:border-cyan-500/50 transition-colors p-2"
          style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste suspicious message text here... e.g. 'DEAR CUSTOMER, YOUR ACCOUNT IS BLOCKED DUE TO KYC...'"
            className="min-h-[130px] bg-transparent border-0 resize-none text-sm font-medium focus-visible:ring-0 placeholder:text-slate-400"
            style={{ color: 'var(--ghost-text)' }}
          />
        </div>

        {/* Action Buttons */}
        <div className={extractedUrl ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "w-full"}>
          <Button
            onClick={() => handleScan()}
            disabled={scanning || investigating || !message.trim()}
            className="h-12 rounded-xl font-bold transition-all shadow-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer">
            {scanning ? "Evaluating Threat Vectors..." : "Inspect & Reconstruct Threat"}
          </Button>

          {extractedUrl && (
            <Button
              onClick={() => handleTinyFishInvestigation(extractedUrl)}
              disabled={scanning || investigating || !message.trim()}
              variant="outline"
              className="h-12 rounded-xl font-bold border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400 transition-all cursor-pointer">
              {investigating ? "Live Agent Investigating..." : "🤖 TinyFish Live AI Agent"}
            </Button>
          )}
        </div>
      </div>

      {/* TinyFish Agent Standalone Investigation Display */}
      {(investigating || tfResult || result?.tinyfishInvestigation) && (
        <TinyFishInvestigationCard
          investigation={tfResult || result?.tinyfishInvestigation}
          isInvestigating={investigating}
          onInvestigate={() => handleTinyFishInvestigation(extractedUrl)}
          targetUrl={extractedUrl || message}
        />
      )}

      {/* Multi-stage scanning radar + Progressive Skeletal Loader */}
      {scanning && (
        <div className="space-y-4">
          <ScannerAnalysisProgress isAnalyzing={scanning} title="Multi-Signal Linguistic Inspection" />
          <SkeletonScannerResult />
        </div>
      )}

      {/* Result Display */}
      {result && !scanning && (
        <div className="space-y-6">
          {/* Senior Plain-Language Explanation */}
          <SeniorScanExplanation result={result} rawInput={message} scanType="message" />

          {/* Ask Trusted Contact Trigger Button */}
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

          {/* Detailed Technical Fraud Score Display */}
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
              scan_type: "message",
              input_content: message,
              fraud_score: result.fraud_score,
              analysis: result.analysis || result.ai_analysis,
              reasons: result.reasons,
            }}
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
