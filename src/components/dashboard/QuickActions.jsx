import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageSquareWarning, Link2, Image, AlertTriangle, ArrowRight, QrCode, Mic, Shield } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  {
    title: "Scan Message",
    subtitle: "SMS, WhatsApp, Email smishing",
    page: "MessageScanner",
    icon: MessageSquareWarning,
    color: "#00e5ff",
    bg: "rgba(0, 229, 255, 0.12)",
  },
  {
    title: "Scan Link / URL",
    subtitle: "Domain inspection & typosquatting",
    page: "LinkScanner",
    icon: Link2,
    color: "#a78bfa",
    bg: "rgba(167, 139, 250, 0.12)",
  },
  {
    title: "Scan Screenshot",
    subtitle: "Multi-modal vision OCR & logos",
    page: "ScreenshotScanner",
    icon: Image,
    color: "#f472b6",
    bg: "rgba(244, 114, 182, 0.12)",
  },
  {
    title: "QR Code Inspector",
    subtitle: "Decode & inspect suspicious QRs",
    page: "QRScanner",
    icon: QrCode,
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.12)",
  },
  {
    title: "Voice & Audio Scam",
    subtitle: "Deepfakes, vocoders & fraud calls",
    page: "VoiceScanner",
    icon: Mic,
    color: "#06b6d4",
    bg: "rgba(6, 182, 212, 0.12)",
  },
  {
    title: "Browser Shield & Ext",
    subtitle: "Real-time navigation & pre-click block",
    page: "BrowserShield",
    icon: Shield,
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
  },
  {
    title: "Global Threat Intelligence",
    subtitle: "Live community threat telemetry",
    page: "ScamHeatmap",
    icon: AlertTriangle,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
  },
  {
    title: "Report Scam Threat",
    subtitle: "Syndicate indicators to database",
    page: "ReportScam",
    icon: AlertTriangle,
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
  }
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.page}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}>
            <Link
              to={createPageUrl(action.page)}
              className="ghost-card p-4 flex items-center justify-between group transition-all block h-full">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: action.bg }}>
                  <Icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold transition-colors group-hover:text-cyan-500"
                    style={{ color: 'var(--ghost-text)' }}>
                    {action.title}
                  </h3>
                  <p className="text-[11px] font-medium mt-0.5"
                    style={{ color: 'var(--ghost-text-dim)' }}>
                    {action.subtitle}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}