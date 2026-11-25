import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Award,
  Users,
  ArrowRight,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { triggerHaptic } from "@/lib/haptics";
import { analyzeScreenshot } from "@/lib/api";
import { createScanHistory, uploadEvidenceFile } from "@/lib/data";
import { scoreToRisk } from "@/lib/scanner";
import SeniorModeToggleSwitch from "./SeniorModeToggleSwitch";
import VoiceAssistance from "./VoiceAssistance";
import EmergencyGuidanceModal from "./EmergencyGuidanceModal";
import ScamSimulationModal from "./ScamSimulationModal";
import TrustedContactModal from "./TrustedContactModal";

const HINDI_COPY = {
  scam: {
    headline: "⚠️ सावधान: यह धोखाधड़ी (स्कैम) हो सकता है",
    summary: "इस फोटो या QR कोड में धोखाधड़ी के स्पष्ट संकेत मिले हैं। कोई भी पैसा न भेजें।",
    bullets: [
      "इस फोटो में दिए गए किसी भी लिंक पर क्लिक न करें और न ही QR स्कैन करके भुगतान करें।",
      "अपना OTP, UPI पिन या बैंक पासवर्ड किसी के साथ साझा न करें।",
      "किसी भी तरह का पैसा कटने पर तुरंत 1930 पर कॉल करें या परिवार से बात करें।",
    ],
  },
  suspicious: {
    headline: "⚠️ सतर्क रहें: संदिग्ध जानकारी मिली है",
    summary: "इस फोटो की जानकारी पूरी तरह सुरक्षित नहीं लगती। आगे बढ़ने से पहले जांच करें।",
    bullets: [
      "भेजने वाले की पहचान आधिकारिक नंबर से दोबारा जांचें।",
      "जब तक पक्का न हो, कोई भुगतान न करें और न ही निजी जानकारी दें।",
      "संदेह होने पर किसी विश्वसनीय परिवार के सदस्य से सलाह लें।",
    ],
  },
  safe: {
    headline: "✅ सुरक्षित: कोई स्कैम खतरा नहीं मिला",
    summary: "इस फोटो में कोई खतरनाक लिंक, नकली बैंक नोटिस या OTP मांग नहीं मिली।",
    bullets: [
      "यह सामग्री सामान्य और सुरक्षित प्रतीत होती है।",
      "फिर भी हमेशा अपना OTP और बैंक पिन गुप्त रखें।",
    ],
  },
};

/**
 * SeniorHomeView Component
 * Dedicated Senior & Family Safety Mode Home Screen.
 * Full-width 60/40 Bento scanner + 3-step visual safety guide, inline Screenshot/QR upload & analysis,
 * and an aligned 3-column support row.
 */
export default function SeniorHomeView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const photoInputRef = useRef(null);

  const [seniorInput, setSeniorInput] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoResult, setPhotoResult] = useState(null);
  const [resultLang, setResultLang] = useState("en"); // 'en' | 'hi'

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [showTrustedContactModal, setShowTrustedContactModal] = useState(false);

  const homeSpeechText = `
    Welcome to TrustBreak AI Senior Mode.
    Paste any suspicious message or link into the big box, then tap Paste and Check.
    Or tap Check Screenshot or QR to pick a photo right here on this screen.
    If you already sent money or shared an OTP, tap Emergency Call 1930 right away.
  `.trim();

  const routeContentToScanner = (rawText) => {
    const trimmed = (rawText || "").trim();
    if (!trimmed) {
      navigate(createPageUrl("MessageScanner"));
      return;
    }
    const isUrl = /^(https?:\/\/|www\.)/i.test(trimmed);
    navigate(createPageUrl(isUrl ? "LinkScanner" : "MessageScanner"), {
      state: { sharedContent: trimmed },
    });
  };

  const handlePasteAndCheck = async () => {
    await triggerHaptic("medium");
    if (seniorInput.trim()) {
      routeContentToScanner(seniorInput);
      return;
    }
    try {
      if (navigator?.clipboard?.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && clipText.trim()) {
          setSeniorInput(clipText.trim());
          routeContentToScanner(clipText);
          return;
        }
      }
    } catch {
      // Clipboard permission denied or unavailable — fall back to MessageScanner
    }
    navigate(createPageUrl("MessageScanner"));
  };

  const acceptSelectedImage = (selected) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setPhotoError("Please select an image file (PNG, JPG, or WebP).");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setPhotoError("Image is larger than 10MB. Please choose a smaller photo.");
      return;
    }
    if (photoPreview) {
      try {
        URL.revokeObjectURL(photoPreview);
      } catch {}
    }
    setPhotoFile(selected);
    setPhotoPreview(URL.createObjectURL(selected));
    setPhotoResult(null);
    setPhotoError("");
  };

  const handlePhotoInputChange = (e) => {
    const selected = e.target.files?.[0];
    acceptSelectedImage(selected);
  };

  const handleTriggerPhotoPicker = async () => {
    await triggerHaptic("medium");
    photoInputRef.current?.click();
  };

  const handleClearPhoto = async () => {
    await triggerHaptic("light");
    if (photoPreview) {
      try {
        URL.revokeObjectURL(photoPreview);
      } catch {}
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoResult(null);
    setPhotoError("");
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!photoFile) return;
    await triggerHaptic("medium");
    setAnalyzingPhoto(true);
    setPhotoError("");
    setPhotoResult(null);

    try {
      let fileUrl = null;
      try {
        fileUrl = await uploadEvidenceFile(photoFile);
      } catch {
        // Evidence upload is optional
      }

      const res = await analyzeScreenshot(photoFile);
      if (res?.unverified || res?.analysis_status === "vision_unavailable") {
        setPhotoError(
          "Photo scanner could not connect right now. Please try again in a moment or ask a family member."
        );
        return;
      }

      setPhotoResult(res);

      try {
        await createScanHistory({
          scan_type: "screenshot",
          input_content: `Senior Mode Photo (${photoFile.name}, ${(photoFile.size / 1024).toFixed(1)}KB)`,
          fraud_score: res.fraud_score,
          risk_level: res.risk_level,
          ai_analysis: res.analysis || res.ai_analysis,
          reasons: res.reasons,
          evidence_url: fileUrl,
        });
        queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
      } catch {
        // Ignore history logging errors
      }
    } catch (err) {
      setPhotoError(err?.message || "Could not analyze the photo. Please try again.");
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) acceptSelectedImage(dropped);
  };

  const safetySteps = [
    {
      num: "1",
      title: "Copy or Screenshot",
      desc: "any suspicious SMS, WhatsApp message, or link.",
    },
    {
      num: "2",
      title: 'Tap "Paste & Check"',
      desc: "to let AI check for fraud in seconds.",
    },
    {
      num: "3",
      title: "Ask Family or Call 1930",
      desc: "before sending money or sharing an OTP.",
    },
  ];

  // Build senior-friendly English/Hindi result data
  const resolvedRisk = photoResult
    ? photoResult.risk_level || scoreToRisk(photoResult.fraud_score)
    : null;

  const getResultPresentation = () => {
    if (!photoResult || !resolvedRisk) return null;

    if (resultLang === "hi") {
      const hi = HINDI_COPY[resolvedRisk] || HINDI_COPY.suspicious;
      return {
        headline: hi.headline,
        summary: hi.summary,
        bullets: hi.bullets,
      };
    }

    const enHeadlines = {
      scam: "⚠️ WARNING: Possible Scam Detected",
      suspicious: "⚠️ CAUTION: Suspicious Content Found",
      safe: "✅ SAFE: No Scam Threats Found",
    };

    const rawReasons = Array.isArray(photoResult.reasons) ? photoResult.reasons.slice(0, 3) : [];
    const fallbackBullets =
      resolvedRisk === "scam"
        ? [
            "Do NOT click any links or scan any payment QR shown in this photo.",
            "Never share your OTP, UPI PIN, or bank password with anyone.",
            "If money was sent, call Helpline 1930 immediately.",
          ]
        : resolvedRisk === "suspicious"
        ? [
            "Verify the sender using an official bank or company phone number.",
            "Do not transfer money until a trusted family member confirms it.",
          ]
        : [
            "No scam links, fake bank notices, or urgent payment demands were found.",
            "Always keep your OTPs and passwords private.",
          ];

    return {
      headline: enHeadlines[resolvedRisk] || enHeadlines.suspicious,
      summary:
        photoResult.analysis ||
        photoResult.ai_analysis ||
        "TrustBreak AI finished checking your screenshot.",
      bullets: rawReasons.length > 0 ? rawReasons : fallbackBullets,
    };
  };

  const resultView = getResultPresentation();
  const resultSpeechText = resultView
    ? `${resultView.headline}. ${resultView.summary}. ${resultView.bullets.join(". ")}`
    : "";

  return (
    <div className="w-full space-y-6 pb-8 animate-in fade-in duration-300">
      {/* Hidden File Input for Direct Inline Screenshot / QR Upload */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoInputChange}
        className="hidden"
      />

      {/* Prominent Active Mode Large Toggle Switch Banner */}
      <SeniorModeToggleSwitch variant="large" className="w-full" />

      {/* Voice Assistance Bar */}
      <VoiceAssistance textToRead={homeSpeechText} title="🔊 Voice Guide for Home Screen" />

      {/* Top Full-Width 2-Column Bento Section (60% Left / 40% Right on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,60fr)_minmax(0,40fr)] gap-4 items-stretch w-full">
        {/* Left Column (60%) — Main Scanner Card (supports drag & drop) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-white dark:bg-[#0d1424] rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-sm transition-colors ${
            isDragging
              ? "border-2 border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
              : "border border-emerald-500/30 dark:shadow-[0_0_30px_rgba(16,185,129,0.08)]"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Easy Scam Checker
              </span>
              {isDragging && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Drop photo to check
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-950 dark:text-white leading-snug">
              Received a suspicious message, link, or photo?
            </h2>

            {!photoPreview ? (
              <textarea
                value={seniorInput}
                onChange={(e) => setSeniorInput(e.target.value)}
                placeholder="Paste anything here..."
                aria-label="Paste suspicious message or link here"
                rows={4}
                className="w-full min-h-[128px] rounded-xl border border-slate-300 bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/75 p-4 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none leading-relaxed"
              />
            ) : (
              /* Inline Selected Screenshot / QR Preview */
              <div className="rounded-xl border border-slate-300 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/75 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    Selected Photo: {photoFile?.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                    {photoFile ? `${(photoFile.size / 1024).toFixed(0)} KB` : ""}
                  </span>
                </div>
                <img
                  src={photoPreview}
                  alt="Selected screenshot or QR preview"
                  className="max-h-56 w-auto mx-auto rounded-xl border border-slate-200 dark:border-slate-700 object-contain shadow-sm"
                />
              </div>
            )}

            {photoError && (
              <div className="p-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 text-sm font-bold">
                {photoError}
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          {!photoPreview ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handlePasteAndCheck}
                className="touch-manipulation min-h-[56px] px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base shadow-[0_0_24px_rgba(16,185,129,0.28)] transition-transform duration-75 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>📋 Paste &amp; Check</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerPhotoPicker}
                className="touch-manipulation min-h-[56px] px-5 py-3 rounded-xl border-2 border-slate-300 bg-slate-100 hover:border-emerald-400 hover:bg-emerald-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-emerald-500/60 dark:hover:bg-slate-800/80 dark:text-white font-black text-sm sm:text-base transition-transform duration-75 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>📷 Check Screenshot / QR</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={analyzingPhoto}
                onClick={handleAnalyzePhoto}
                className="touch-manipulation min-h-[56px] px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-60 text-slate-950 font-black text-sm sm:text-base shadow-[0_0_24px_rgba(16,185,129,0.28)] transition-transform duration-75 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {analyzingPhoto ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Photo...</span>
                  </>
                ) : (
                  <span>🔍 Analyze Photo Now</span>
                )}
              </button>

              <button
                type="button"
                disabled={analyzingPhoto}
                onClick={handleClearPhoto}
                className="touch-manipulation min-h-[56px] px-5 py-3 rounded-xl border-2 border-slate-300 bg-slate-100 hover:border-rose-400 hover:bg-rose-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-rose-500/60 dark:hover:bg-slate-800/80 dark:text-white font-black text-sm sm:text-base transition-transform duration-75 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove / Choose Another</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column (40%) — 3-Step Visual Safety Guide Card */}
        <div className="bg-white dark:bg-[#0d1424]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-sm">
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-black font-display tracking-tight text-slate-950 dark:text-white">
              How to Stay Safe (3 Easy Steps)
            </h3>

            <div className="space-y-3.5">
              {safetySteps.map((step) => (
                <div
                  key={step.num}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-900/60"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-mono font-black text-base flex items-center justify-center shrink-0">
                    {step.num}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    <strong className="font-bold text-slate-950 dark:text-white">
                      {step.title}
                    </strong>{" "}
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 rounded-xl px-3.5 py-2.5">
            Never rush. Real banks and government officials never demand urgent UPI transfers or OTPs.
          </p>
        </div>
      </div>

      {/* Inline Senior-Friendly Photo Scan Result */}
      {resultView && (
        <div className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424] p-6 space-y-5 shadow-md animate-in fade-in duration-200">
          {/* Status Header + English / Hindi Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 flex-1 ${
                resolvedRisk === "scam"
                  ? "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-500/15 dark:border-rose-500/40 dark:text-rose-200"
                  : resolvedRisk === "suspicious"
                  ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-200"
                  : "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-200"
              }`}
            >
              {resolvedRisk === "scam" ? (
                <ShieldAlert className="w-7 h-7 text-rose-600 dark:text-rose-400 shrink-0" />
              ) : resolvedRisk === "suspicious" ? (
                <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <h3 className="text-lg sm:text-xl font-black font-display tracking-tight">
                {resultView.headline}
              </h3>
            </div>

            {/* Language Toggle (English / हिंदी) */}
            <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setResultLang("en")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer touch-manipulation ${
                  resultLang === "en"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-700 dark:text-slate-300 hover:text-emerald-600"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setResultLang("hi")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer touch-manipulation ${
                  resultLang === "hi"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-700 dark:text-slate-300 hover:text-emerald-600"
                }`}
              >
                हिंदी (Hindi)
              </button>
            </div>
          </div>

          {/* Voice Readout Control */}
          <VoiceAssistance textToRead={resultSpeechText} title="🔊 Read Result Aloud" />

          {/* Calm Summary & 2-3 Easy Bullet Points */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <p className="text-base font-bold text-slate-950 dark:text-white leading-relaxed">
              {resultView.summary}
            </p>
            <ul className="space-y-2.5">
              {resultView.bullets.map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 leading-relaxed"
                >
                  <span className="text-emerald-600 dark:text-emerald-400 font-black shrink-0">
                    •
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Aligned 3-Column Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {/* Card 1: Ask a Family Member */}
        <button
          type="button"
          onClick={async () => {
            await triggerHaptic("light");
            setShowTrustedContactModal(true);
          }}
          className="group p-5 rounded-2xl border border-emerald-500/35 bg-white dark:bg-[#0d1424]/90 hover:border-emerald-400 text-left shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] transition-all duration-150 active:scale-[0.98] cursor-pointer touch-manipulation flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between w-full pointer-events-none">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="pointer-events-none">
            <h3 className="text-base font-black font-display text-slate-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Ask a Family Member
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Share scan findings with your trusted guardian before taking action.
            </p>
          </div>
        </button>

        {/* Card 2: Emergency: Call 1930 */}
        <button
          type="button"
          onClick={async () => {
            await triggerHaptic("heavy");
            setShowEmergencyModal(true);
          }}
          className="group p-5 rounded-2xl border-2 border-rose-500/60 bg-rose-50/60 dark:bg-[#0d1424]/95 hover:border-rose-400 text-left shadow-sm hover:shadow-[0_0_24px_rgba(244,63,94,0.18)] transition-all duration-150 active:scale-[0.98] cursor-pointer touch-manipulation flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between w-full pointer-events-none">
            <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-600 dark:text-rose-400 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              24/7 Helpline
            </span>
          </div>
          <div className="pointer-events-none">
            <h3 className="text-base font-black font-display text-rose-700 dark:text-rose-400 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
              Emergency: Call 1930
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
              Lost money or shared an OTP? Open step-by-step recovery help now.
            </p>
          </div>
        </button>

        {/* Card 3: Simple Scam Quiz */}
        <button
          type="button"
          onClick={async () => {
            await triggerHaptic("light");
            setShowSimulationModal(true);
          }}
          className="group p-5 rounded-2xl border border-amber-500/35 bg-white dark:bg-[#0d1424]/90 hover:border-amber-400 text-left shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.12)] transition-all duration-150 active:scale-[0.98] cursor-pointer touch-manipulation flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between w-full pointer-events-none">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="pointer-events-none">
            <h3 className="text-base font-black font-display text-slate-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Simple Scam Quiz
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Practice spotting fake SMS and fraud calls with easy examples.
            </p>
          </div>
        </button>
      </div>

      {/* Modals */}
      <EmergencyGuidanceModal isOpen={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} />
      <ScamSimulationModal isOpen={showSimulationModal} onClose={() => setShowSimulationModal(false)} />
      <TrustedContactModal isOpen={showTrustedContactModal} onClose={() => setShowTrustedContactModal(false)} />
    </div>
  );
}
