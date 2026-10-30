import React, { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Image, Upload, X, FileSearch, Info, QrCode, Bot, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScannerHeader from "../components/scanner/ScannerHeader";
import FraudScoreDisplay from "../components/scanner/FraudScoreDisplay";
import TinyFishInvestigationCard from "../components/scanner/TinyFishInvestigationCard";
import SeniorScanExplanation from "../components/SeniorScanExplanation";
import TrustedContactModal from "../components/TrustedContactModal";
import QRScanner from "../components/QRScanner";
import { useNotify } from "../components/useNotify";
import { createScanHistory, uploadEvidenceFile } from "@/lib/data";
import { analyzeScreenshot, analyzeLink, analyzeMessage, investigateWebsite, extractUrlFromText } from "@/lib/api";
import { SkeletonScannerResult } from "@/components/ui/skeleton";
import ScannerAnalysisProgress from "@/components/scanners/ScannerAnalysisProgress";
import { triggerHaptic } from "@/lib/haptics";

export default function ScreenshotScanner() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("screenshot");

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [showTrustedContact, setShowTrustedContact] = useState(false);
  const fileRef = useRef(null);
  const notify = useNotify();

  // TinyFish Agent state
  const [investigating, setInvestigating] = useState(false);
  const [tfResult, setTfResult] = useState(null);

  // QR scanner state
  const [qrResult, setQrResult] = useState(null);
  const [qrError, setQrError] = useState("");
  const [qrScanning, setQrScanning] = useState(false);

  const handleQrDecoded = async (payload) => {
    setQrResult(null);
    setQrError("");
    setQrScanning(true);
    setTfResult(null);
    try {
      let res;
      if (/^https?:\/\//i.test(payload)) {
        res = await analyzeLink(payload);
      } else {
        res = await analyzeMessage(payload);
      }
      setQrResult({ ...res, _qrPayload: payload });
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
      setQrError(err?.message || "QR analysis failed. Please try again.");
    } finally {
      setQrScanning(false);
    }
  };

  const handleTinyFishInvestigation = async (rawText = "") => {
    const targetUrl = extractUrlFromText(rawText);
    if (!targetUrl) return;

    setInvestigating(true);

    try {
      const res = await investigateWebsite(targetUrl);
      setTfResult(res?.tinyfishInvestigation || res);
      if (res?.fraud_score !== undefined) {
        setResult(res);
        notify(res.risk_level, "screenshot");
      }

      await createScanHistory({
        scan_type: "screenshot",
        input_content: `[TinyFish Live Agent] ${targetUrl.substring(0, 200)}`,
        fraud_score: res.fraud_score || 0,
        risk_level: res.risk_level || "safe",
        ai_analysis: res.analysis || res.tinyfishInvestigation?.summary || "TinyFish Live Browser Investigation",
        reasons: res.reasons || res.tinyfishInvestigation?.observations || [],
      });
      queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
    } catch (err) {
      console.error("TinyFish OCR investigation error:", err);
    } finally {
      setInvestigating(false);
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    if (!selected.type.startsWith('image/')) {
      setScanError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setScanError("Image exceeds 10MB limit. Please upload a smaller screenshot.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setTfResult(null);
    setScanError("");
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setScanError("");
    setTfResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleScan = async () => {
    if (!file) return;

    setScanning(true);
    setResult(null);
    setScanError("");
    setTfResult(null);

    try {
      let fileUrl = null;
      try {
        fileUrl = await uploadEvidenceFile(file);
      } catch (e) {
        console.warn("Evidence upload skipped/failed:", e.message);
      }

      const res = await analyzeScreenshot(file);
      setResult(res);
      notify(res.risk_level, "screenshot");

      await createScanHistory({
        scan_type: "screenshot",
        input_content: `Screenshot scan (${file.name}, ${(file.size / 1024).toFixed(1)}KB)`,
        fraud_score: res.fraud_score,
        risk_level: res.risk_level,
        ai_analysis: res.analysis || res.ai_analysis,
        reasons: res.reasons,
        evidence_url: fileUrl,
      });
      queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
    } catch (err) {
      console.error("Screenshot scan error:", err);
      setScanError(err.message || "Failed to analyze screenshot. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const extractedUrl = extractUrlFromText(result?.detected_text || "");

  return (
    <div className="space-y-6 pb-6">
      <ScannerHeader
        icon={Image}
        title="Vision & Screenshot OCR Inspector"
        description="Upload suspicious chat screenshots, payment QR codes, fake banking notices, or social media lures"
        color="#ec4899"
      />

      {/* Mode Navigation Tabs */}
      <div className="flex rounded-xl p-1 border gap-1"
        style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
        <button
          onClick={() => { setActiveTab("screenshot"); setResult(null); setQrResult(null); }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "screenshot"
              ? "bg-pink-500 text-white shadow-sm font-extrabold"
              : "hover:text-pink-400 text-slate-400"
          }`}>
          <Image className="w-4 h-4" />
          <span>Screenshot & Chat Image OCR</span>
        </button>
        <button
          onClick={() => { setActiveTab("qr"); setResult(null); setQrResult(null); }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "qr"
              ? "bg-purple-500 text-white shadow-sm font-extrabold"
              : "hover:text-purple-400 text-slate-400"
          }`}>
          <QrCode className="w-4 h-4" />
          <span>Live Payment QR Scanner</span>
        </button>
      </div>

      {/* Live QR Scanner Tab */}
      {activeTab === "qr" && (
        <div className="space-y-6">
          <QRScanner onDecoded={handleQrDecoded} />

          {qrScanning && (
            <div className="space-y-4">
              <ScannerAnalysisProgress isAnalyzing={qrScanning} title="QR Code Payload Analysis" />
              <SkeletonScannerResult />
            </div>
          )}

          {qrError && (
            <div className="ghost-card p-4 border-rose-500/30 text-xs text-rose-500 font-bold">
              {qrError}
            </div>
          )}

          {qrResult && !qrScanning && (
            <div className="space-y-6">
              <SeniorScanExplanation result={qrResult} rawInput={qrResult._qrPayload} scanType="screenshot" />

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

              <FraudScoreDisplay
                score={qrResult.fraud_score}
                riskLevel={qrResult.risk_level}
                confidence={qrResult.confidence || "high"}
                reasons={qrResult.reasons}
                analysis={qrResult.analysis || qrResult.ai_analysis}
                attackIntent={qrResult.attack_intent}
                signals={qrResult.signals}
                threatReconstruction={qrResult.threat_reconstruction}
                similarPatterns={qrResult.similar_patterns}
                reasonCodes={qrResult.reasonCodes || []}
                source={qrResult.source}
                rawScanData={{
                  scan_type: "qr",
                  input_content: qrResult._qrPayload,
                  fraud_score: qrResult.fraud_score,
                  analysis: qrResult.analysis || qrResult.ai_analysis,
                  reasons: qrResult.reasons,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Screenshot Analysis Tab */}
      {activeTab === "screenshot" && (
        <>
          <div className="ghost-card p-5 space-y-4">
            {!preview ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-52 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all hover:border-pink-500 hover:bg-pink-500/5 group cursor-pointer"
                style={{ borderColor: 'var(--ghost-border)', background: 'var(--ghost-surface-2)' }}>
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-pink-500" />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-sm font-bold block" style={{ color: 'var(--ghost-text)' }}>
                    Tap or drag & drop a screenshot here
                  </span>
                  <span className="text-xs block" style={{ color: 'var(--ghost-text-dim)' }}>
                    PNG, JPG, WebP up to 10MB • Auto-OCR & Vision Analysis
                  </span>
                </div>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border p-2"
                style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <img
                  src={preview}
                  alt="Screenshot Preview"
                  className="w-full rounded-xl max-h-72 object-contain bg-black/20 mx-auto"
                />
                <button
                  onClick={clearFile}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-rose-500 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

            <Button
              onClick={handleScan}
              disabled={scanning || !file}
              className="w-full h-12 rounded-xl font-bold text-white transition-all shadow-md bg-pink-600 hover:bg-pink-500 cursor-pointer">
              {scanning ? "Processing Visual Evidence..." : "Analyze Screenshot with Vision Engine"}
            </Button>
          </div>

          {(investigating || tfResult || result?.tinyfishInvestigation) && (
            <TinyFishInvestigationCard
              investigation={tfResult || result?.tinyfishInvestigation}
              isInvestigating={investigating}
              onInvestigate={() => handleTinyFishInvestigation(result?.detected_text)}
              targetUrl={extractedUrl || result?.detected_text}
            />
          )}

          {scanning && (
            <div className="space-y-4">
              <ScannerAnalysisProgress isAnalyzing={scanning} title="Vision & OCR Feature Extraction" />
              <SkeletonScannerResult />
            </div>
          )}

          {scanError && (
            <div className="ghost-card p-4 border-rose-500/30 flex items-start gap-3">
              <Info className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div className="text-xs" style={{ color: 'var(--ghost-text-dim)' }}>
                <p className="font-bold text-rose-500">{scanError}</p>
                <p className="mt-1">Fallback analysis will evaluate extracted signals automatically.</p>
              </div>
            </div>
          )}

          {result && !scanning && (
            <div className="space-y-6">
              {/* Senior Plain-Language Explanation */}
              <SeniorScanExplanation result={result} rawInput={result.detected_text || "Screenshot scan"} scanType="screenshot" />

              {/* Ask Trusted Contact */}
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

              {/* Extracted OCR text box */}
              {result.detected_text && (
                <div className="ghost-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                      style={{ color: 'var(--ghost-text-dim)' }}>
                      <FileSearch className="w-3.5 h-3.5 text-pink-500" /> Extracted OCR Text from Image
                    </span>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">Gemini Vision OCR</span>
                  </div>
                  <div className="p-3 rounded-xl border text-xs font-mono max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed"
                    style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)', color: 'var(--ghost-text)' }}>
                    {result.detected_text}
                  </div>

                  {extractedUrl && (
                    <Button
                      onClick={() => handleTinyFishInvestigation(result.detected_text)}
                      disabled={investigating}
                      variant="outline"
                      className="w-full h-10 rounded-xl font-bold border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400 transition-all text-xs cursor-pointer">
                      {investigating ? "Live Agent Investigating Domain..." : `🤖 TinyFish Live AI Agent: Inspect ${extractedUrl}`}
                    </Button>
                  )}
                </div>
              )}

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
                  scan_type: "screenshot",
                  input_content: result.detected_text || "Screenshot analysis",
                  fraud_score: result.fraud_score,
                  analysis: result.analysis || result.ai_analysis,
                  reasons: result.reasons,
                }}
              />
            </div>
          )}
        </>
      )}

      <TrustedContactModal
        isOpen={showTrustedContact}
        onClose={() => setShowTrustedContact(false)}
        scanSummary={result || qrResult}
      />
    </div>
  );
}
