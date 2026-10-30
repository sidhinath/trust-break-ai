import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquareWarning, Link2, QrCode, Image as ImageIcon, Mic, ShieldAlert, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScannerHeader from "@/components/scanner/ScannerHeader";
import MessageScanner from "@/pages/MessageScanner";
import LinkScanner from "@/pages/LinkScanner";
import QRScannerPage from "@/pages/QRScannerPage";
import ScreenshotScanner from "@/pages/ScreenshotScanner";
import VoiceScanner from "@/pages/VoiceScanner";

const SCANNERS = [
  {
    id: "message",
    label: "Message",
    title: "SMS & Chat Phishing",
    description: "Analyze suspicious messages before you respond.",
    icon: MessageSquareWarning,
    color: "#00e5ff",
    component: MessageScanner,
  },
  {
    id: "url",
    label: "URL / Link",
    title: "Link & Typosquatting",
    description: "Check a website before you open or enter credentials.",
    icon: Link2,
    color: "#a78bfa",
    component: LinkScanner,
  },
  {
    id: "qr",
    label: "QR Code",
    title: "QR Phishing Inspector",
    description: "Inspect QR codes before scanning or paying.",
    icon: QrCode,
    color: "#8b5cf6",
    component: QRScannerPage,
  },
  {
    id: "screenshot",
    label: "Screenshot",
    title: "Vision OCR Inspector",
    description: "Detect suspicious visual content and scam pages.",
    icon: ImageIcon,
    color: "#f472b6",
    component: ScreenshotScanner,
  },
  {
    id: "voice",
    label: "Voice",
    title: "Voice & Audio Scam Radar",
    description: "Analyze suspicious voice recordings for scam indicators.",
    icon: Mic,
    color: "#06b6d4",
    component: VoiceScanner,
  },
];

export default function ScanHub() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.activeTab || "message";
  });

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const activeScanner = SCANNERS.find((s) => s.id === activeTab) || SCANNERS[0];
  const ActiveComponent = activeScanner.component;

  return (
    <div className="space-y-6 pb-6">
      {/* Universal Scanner Header */}
      <ScannerHeader
        icon={ShieldAlert}
        title="SCAN BEFORE YOU TRUST"
        description="Verify messages, links, QR codes, screenshots, and audio calls before you click, scan, pay, or respond."
        color="#00e5ff"
      />

      {/* Vector Selector Pills / Cards */}
      <div className="ghost-card p-3 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--ghost-text-dim)" }}>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Select Scan Vector
          </span>
          <span className="text-[11px] font-mono font-medium text-cyan-500">
            5 Multi-Modal Engines Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SCANNERS.map((s) => {
            const Icon = s.icon;
            const isSelected = activeTab === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between group relative overflow-hidden ${
                  isSelected
                    ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,229,255,0.15)]"
                    : "hover:border-cyan-500/30"
                }`}
                style={{
                  background: isSelected ? undefined : "var(--ghost-surface-2)",
                  borderColor: isSelected ? undefined : "var(--ghost-border)",
                }}>
                {isSelected && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 border-2 border-cyan-400 rounded-xl pointer-events-none"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <div className="flex items-center justify-between w-full mb-1">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: isSelected ? "rgba(0,229,255,0.2)" : "var(--ghost-surface)" }}>
                    <Icon className="w-4 h-4" style={{ color: isSelected ? "#00e5ff" : "var(--ghost-text-dim)" }} />
                  </div>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                </div>
                <div>
                  <span className="text-xs font-bold block" style={{ color: isSelected ? "#00e5ff" : "var(--ghost-text)" }}>
                    {s.label}
                  </span>
                  <span className="text-[10px] line-clamp-1 mt-0.5 block" style={{ color: "var(--ghost-text-dim)" }}>
                    {s.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Scanner Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}>
          <ActiveComponent />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
