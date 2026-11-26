import React, { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Image, Upload, X, FileSearch, Info, QrCode, Users, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScannerHeader from "../components/scanner/ScannerHeader";
import ScannerQuickSwitcher from "../components/scanner/ScannerQuickSwitcher";
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
import ProtectedPage from '@/components/auth/ProtectedPage';

const VISION_REASON_LABELS = {
  'no-image-payload': 'The image never reached the server (upload or serialization failure).',
  'invalid-image-payload': 'The image data was rejected before it could be sent to Gemini.',
  'image-download-failed': 'The server could not download the screenshot URL.',
  'gemini-key-missing': 'No Gemini API key was found on the server or in this browser.',
  'gemini-timeout': 'Gemini did not answer before the request timeout.',
  'gemini-call-failed': 'Gemini rejected the request — invalid key, missing API access, quota, or unsupported model.',
  'vision-providers-failed': 'Gemini and Groq vision both rejected the request — check the keys and API access.',
  'vision-call-failed': 'The vision request failed before any verdict was returned.',
  'vision-unavailable': 'The vision engine was not reachable.',
}

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

  // Vision diagnostics state
  const [healthReport, setHealthReport] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const runVisionDiagnostics = async () => {
    setHealthLoading(true);
    setHealthReport(null);
    try {
      const res = await fetch("/api/vision-health?probe=1", { cache: "no-store" });
      const text = await res.text();
      try {
        setHealthReport(JSON.parse(text));
      } catch {
        setHealthReport({
          ok: false,
          error: `Endpoint did not return JSON (HTTP ${res.status}) — /api/vision-health is probably not deployed yet.`,
          body: text.slice(0, 300),
        });
      }
    } catch (err) {
      setHealthReport({ ok: false, error: err?.message || "Diagnostics request failed" });
    } finally {
      setHealthLoading(false);
    }
  };

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

      // Never record or alert on a scan that was not actually analyzed — the
      // old code logged a fake 65/100 "suspicious" verdict for every image.
      const unverified = Boolean(res?.unverified) || res?.analysis_status === 'vision_unavailable';
      if (unverified) {
        setScanError("");
        return;
      }

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
  const isUnverified = Boolean(result?.unverified) || result?.analysis_status === 'vision_unavailable';
  const unverifiedReason = result?.degraded_reason || 'vision-unavailable';
  const unverifiedDetail = VISION_REASON_LABELS[unverifiedReason] || 'The vision engine did not return a verdict.';

  return (
    <ProtectedPage feature="Vision Screenshot Scanner">
    <div className="space-y-6 pb-6">
      <ScannerHeader
        icon={Image}
        title="Vision & Screenshot OCR Inspector"
        description="Upload suspicious chat screenshots, payment QR codes, fake banking notices, or social media lures"
        color="#ec4899"
      />
      <ScannerQuickSwitcher activePage="ScreenshotScanner" />

      {/* Mode Navigation Tabs */}
      <div className="flex rounded-xl p-1 border gap-1"
        style={{ background: 'var(--tb-surface-2)', borderColor: 'var(--tb-border)' }}>
        <button
          onClick={() => { setActiveTab("screenshot"); setResult(null); setQrResult(null); }}
          className={`flex-1 py-2 touch-manipulation min-h-[44px] min-w-[44px] rounded-lg text-xs font-bold transition-transform duration-75 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "screenshot"
              ? "bg-pink-500 text-white shadow-sm font-extrabold"
              : "hover:text-pink-400 text-slate-400"
          }`}>
          <Image className="w-4 h-4" />
          <span>Screenshot & Chat Image OCR</span>
        </button>
        <button
          onClick={() => { setActiveTab("qr"); setResult(null); setQrResult(null); }}
          className={`flex-1 py-2 touch-manipulation min-h-[44px] min-w-[44px] rounded-lg text-xs font-bold transition-transform duration-75 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
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
            <div className="tb-card p-4 border-rose-500/30 text-xs text-rose-500 font-bold">
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
                  className="touch-manipulation min-h-[44px] min-w-[44px] h-11 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-bold text-xs flex items-center gap-2 transition-transform duration-75 active:scale-95 cursor-pointer">
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
          <div className="tb-card p-5 space-y-4">
            {!preview ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="touch-manipulation min-h-[44px] min-w-[44px] w-full h-52 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-transform duration-75 active:scale-95 hover:border-pink-500 hover:bg-pink-500/5 group cursor-pointer"
                style={{ borderColor: 'var(--tb-border)', background: 'var(--tb-surface-2)' }}>
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-pink-500" />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-sm font-bold block" style={{ color: 'var(--tb-text)' }}>
                    Tap or drag & drop a screenshot here
                  </span>
                  <span className="text-xs block" style={{ color: 'var(--tb-text-dim)' }}>
                    PNG, JPG, WebP up to 10MB • Auto-OCR & Vision Analysis
                  </span>
                </div>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border p-2"
                style={{ background: 'var(--tb-surface-2)', borderColor: 'var(--tb-border)' }}>
                <img
                  src={preview}
                  alt="Screenshot Preview"
                  className="w-full rounded-xl max-h-72 object-contain bg-black/20 mx-auto"
                />
                <button
                  onClick={clearFile}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-rose-500 text-white flex items-center justify-center touch-manipulation transition-transform duration-75 active:scale-95 transition-colors border border-white/20 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

            <Button
              onClick={handleScan}
              disabled={scanning || !file}
              className="w-full h-12 rounded-xl font-bold text-white transition-transform duration-75 active:scale-95 shadow-md bg-pink-600 hover:bg-pink-500 cursor-pointer">
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
            <div className="tb-card p-4 border-rose-500/30 flex items-start gap-3">
              <Info className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div className="text-xs" style={{ color: 'var(--tb-text-dim)' }}>
                <p className="font-bold text-rose-500">{scanError}</p>
                <p className="mt-1">No risk score is produced for an image that could not be read — nothing is guessed.</p>
              </div>
            </div>
          )}

          {result && !scanning && (
            <div className="space-y-6">
              {isUnverified ? (
                <div className="tb-card p-5 border-amber-500/40 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-amber-500">Image not analyzed — no risk score produced</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--tb-text-dim)' }}>
                        {unverifiedDetail} TrustBreak AI will not guess: there is no verdict because the image
                        itself was never evaluated. This is not a &quot;safe&quot; result and not a &quot;scam&quot; result.
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono rounded-lg border px-3 py-2 space-y-1"
                    style={{ borderColor: 'var(--tb-border)', background: 'var(--tb-surface-2)', color: 'var(--tb-text-dim)' }}>
                    <div>reason: {unverifiedReason}</div>
                    {result?.vision_diagnostics?.attempts?.length > 0 && (
                      <div>
                        attempts: {result.vision_diagnostics.attempts.map((a) => `${a.model}=${a.status ?? a.error ?? 'failed'}`).join(' • ')}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
                    <Button
                      onClick={handleScan}
                      disabled={scanning}
                      className="touch-manipulation min-h-[44px] min-w-[44px] h-10 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-500 transition-transform duration-75 active:scale-95 text-xs cursor-pointer">
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry analysis
                    </Button>
                    <Button
                      onClick={runVisionDiagnostics}
                      disabled={healthLoading}
                      variant="outline"
                      className="touch-manipulation min-h-[44px] min-w-[44px] h-10 rounded-xl font-bold text-xs border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 transition-transform duration-75 active:scale-95 cursor-pointer">
                      {healthLoading ? "Checking vision engine..." : "Run vision diagnostics"}
                    </Button>
                    <Link
                      to={createPageUrl("Settings")}
                      className="touch-manipulation min-h-[44px] min-w-[44px] h-10 px-4 rounded-xl border font-bold text-xs flex items-center justify-center transition-transform duration-75 active:scale-95 hover:border-emerald-400 hover:text-emerald-400"
                      style={{ borderColor: 'var(--tb-border)', color: 'var(--tb-text-dim)' }}>
                      Configure Gemini Vision key
                    </Link>
                  </div>

                  {result?.vision_diagnostics && (
                    <details className="text-[11px] rounded-lg border px-3 py-2"
                      style={{ borderColor: 'var(--tb-border)', background: 'var(--tb-surface-2)' }}>
                      <summary className="cursor-pointer font-bold" style={{ color: 'var(--tb-text-dim)' }}>
                        Scan diagnostics
                      </summary>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed" style={{ color: 'var(--tb-text-dim)' }}>
{JSON.stringify(result.vision_diagnostics, null, 2)}
                      </pre>
                    </details>
                  )}

                  {healthReport && (
                    <details open className="text-[11px] rounded-lg border border-emerald-500/30 px-3 py-2"
                      style={{ background: 'var(--tb-surface-2)' }}>
                      <summary className="cursor-pointer font-bold text-emerald-500">
                        Vision engine health: {healthReport.ok ? "reachable" : "not working"}
                      </summary>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed" style={{ color: 'var(--tb-text-dim)' }}>
{JSON.stringify(healthReport, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
              <>
              {/* Senior Plain-Language Explanation */}
              <SeniorScanExplanation result={result} rawInput={result.detected_text || "Screenshot scan"} scanType="screenshot" />

              {/* Ask Trusted Contact */}
              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    await triggerHaptic("light");
                    setShowTrustedContact(true);
                  }}
                  className="touch-manipulation min-h-[44px] min-w-[44px] h-11 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-bold text-xs flex items-center gap-2 transition-transform duration-75 active:scale-95 cursor-pointer">
                  <Users className="w-4 h-4" />
                  <span>Ask Trusted Contact / Family Member</span>
                </button>
              </div>

              {/* Extracted OCR text box */}
              {result.detected_text && (
                <div className="tb-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                      style={{ color: 'var(--tb-text-dim)' }}>
                      <FileSearch className="w-3.5 h-3.5 text-pink-500" /> Extracted OCR Text from Image
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                      {result.source === 'gemini' ? 'Gemini Vision OCR' : 'OCR Text'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border text-xs font-mono max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed"
                    style={{ background: 'var(--tb-surface-2)', borderColor: 'var(--tb-border)', color: 'var(--tb-text)' }}>
                    {result.detected_text}
                  </div>

                  {extractedUrl && (
                    <Button
                      onClick={() => handleTinyFishInvestigation(result.detected_text)}
                      disabled={investigating}
                      variant="outline"
                      className="touch-manipulation min-h-[44px] min-w-[44px] w-full h-10 rounded-xl font-bold border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400 transition-transform duration-75 active:scale-95 text-xs cursor-pointer">
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
              </>
              )}
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
    </ProtectedPage>
  );
}


