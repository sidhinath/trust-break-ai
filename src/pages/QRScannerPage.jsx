import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QrCode, AlertCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScannerHeader from "../components/scanner/ScannerHeader";
import QRScanner from "../components/QRScanner";
import FraudScoreDisplay from "../components/scanner/FraudScoreDisplay";
import TinyFishInvestigationCard from "../components/scanner/TinyFishInvestigationCard";
import { useNotify } from "../components/useNotify";
import { analyzeLink, analyzeMessage, investigateWebsite, extractUrlFromText } from "@/lib/api";
import { createScanHistory } from "@/lib/data";

export default function QRScannerPage() {
  const queryClient = useQueryClient();
  const [result, setResult] = useState(null);
  const [qrPayload, setQrPayload] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [investigating, setInvestigating] = useState(false);
  const [tfResult, setTfResult] = useState(null);
  const notify = useNotify();

  const handleDecoded = async (payload) => {
    setQrPayload(payload);
    setResult(null);
    setTfResult(null);
    setScanError("");
    setScanning(true);

    try {
      const isUrl = Boolean(extractUrlFromText(payload));
      const res = isUrl ? await analyzeLink(payload) : await analyzeMessage(payload);

      setResult(res);
      notify(res.risk_level, "qr");

      await createScanHistory({
        scan_type: "qr",
        input_content: payload.substring(0, 200),
        fraud_score: res.fraud_score,
        risk_level: res.risk_level,
        ai_analysis: res.analysis || res.ai_analysis,
        reasons: res.reasons,
      });
      queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
    } catch (err) {
      console.error("QR analysis failed:", err);
      setScanError(err.message || "Failed to analyze decoded QR payload.");
    } finally {
      setScanning(false);
    }
  };

  const handleTinyFishInvestigation = async (rawUrl = qrPayload) => {
    const targetUrl = extractUrlFromText(rawUrl);
    if (!targetUrl) return;

    setInvestigating(true);

    try {
      const res = await investigateWebsite(targetUrl);
      setTfResult(res?.tinyfishInvestigation || res);
      if (res?.fraud_score !== undefined) {
        setResult(res);
        notify(res.risk_level, "qr");
      }

      await createScanHistory({
        scan_type: "qr",
        input_content: `[TinyFish Live Agent] ${targetUrl.substring(0, 200)}`,
        fraud_score: res.fraud_score || 0,
        risk_level: res.risk_level || "safe",
        ai_analysis: res.analysis || res.tinyfishInvestigation?.summary || "TinyFish Live Browser Investigation",
        reasons: res.reasons || res.tinyfishInvestigation?.observations || [],
      });
      queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
    } catch (err) {
      console.error("TinyFish QR investigation error:", err);
    } finally {
      setInvestigating(false);
    }
  };

  const extractedUrl = extractUrlFromText(qrPayload);

  return (
    <div className="space-y-6">
      <ScannerHeader
        icon={QrCode}
        title="QR Code Threat Inspector"
        description="Decode and inspect physical or digital QR codes for concealed phishing URLs, reverse-charge UPI traps, and deceptive redirection chains"
        color="#8b5cf6"
      />

      {/* Main Upload / Decoder */}
      <div className="ghost-card p-5">
        <QRScanner onDecoded={handleDecoded} onError={(msg) => setScanError(msg)} />
      </div>

      {scanning && (
        <div className="ghost-card p-4 flex items-center gap-3">
          <QrCode className="w-5 h-5 text-violet-400 animate-pulse" />
          <span className="text-xs font-medium" style={{ color: "var(--ghost-text-dim)" }}>
            Analyzing decoded QR destination with neural threat pipeline...
          </span>
        </div>
      )}

      {scanError && !scanning && (
        <div className="ghost-card p-4 border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <span className="text-xs font-medium" style={{ color: "var(--ghost-text-dim)" }}>
            {scanError}
          </span>
        </div>
      )}

      {/* TinyFish Agent Standalone Investigation Display */}
      {(investigating || tfResult || result?.tinyfishInvestigation) && (
        <TinyFishInvestigationCard
          investigation={tfResult || result?.tinyfishInvestigation}
          isInvestigating={investigating}
          onInvestigate={() => handleTinyFishInvestigation(extractedUrl)}
          targetUrl={extractedUrl || qrPayload}
        />
      )}

      {result && !scanning && (
        <div className="space-y-4">
          <div className="ghost-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: "var(--ghost-text-dim)" }}>
                Decoded Raw QR Content
              </span>
              {extractedUrl && (
                <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 font-semibold">
                  <Bot className="w-3.5 h-3.5" /> URL Detected
                </span>
              )}
            </div>
            <p className="text-xs font-mono break-all p-2.5 rounded-lg border leading-relaxed"
              style={{ background: "var(--ghost-surface-2)", borderColor: "var(--ghost-border)", color: "var(--ghost-text)" }}>
              {qrPayload}
            </p>

            {extractedUrl && (
              <Button
                onClick={() => handleTinyFishInvestigation(extractedUrl)}
                disabled={scanning || investigating}
                variant="outline"
                className="w-full h-10 rounded-xl font-bold border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400 transition-all text-xs">
                {investigating ? "Live Agent Investigating Domain..." : `🤖 TinyFish Live AI Agent: Inspect ${extractedUrl}`}
              </Button>
            )}
          </div>

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
              scan_type: "qr",
              input_content: qrPayload,
              fraud_score: result.fraud_score,
              analysis: result.analysis || result.ai_analysis,
              reasons: result.reasons,
            }}
          />
        </div>
      )}
    </div>
  );
}
