import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  MessageSquareWarning,
  Link2,
  Image,
  AlertTriangle,
  ArrowRight,
  QrCode,
  Mic,
  Shield,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";

const primaryScanners = [
  {
    title: "Scan Message",
    subtitle: "SMS, WhatsApp, Email smishing",
    page: "MessageScanner",
    icon: MessageSquareWarning,
    tag: "NLP",
  },
  {
    title: "Scan Link / URL",
    subtitle: "Domain inspection & typosquatting",
    page: "LinkScanner",
    icon: Link2,
    tag: "DNS",
  },
  {
    title: "Scan Screenshot",
    subtitle: "Multi-modal vision OCR & logos",
    page: "ScreenshotScanner",
    icon: Image,
    tag: "VISION",
  },
  {
    title: "QR Code Inspector",
    subtitle: "Decode & inspect suspicious QRs",
    page: "QRScanner",
    icon: QrCode,
    tag: "QR",
  },
];

const utilityActions = [
  {
    title: "Voice & Audio Scam",
    page: "VoiceScanner",
    icon: Mic,
  },
  {
    title: "Browser Shield & Ext",
    page: "BrowserShield",
    icon: Shield,
  },
  {
    title: "Global Threat Intelligence",
    page: "ScamHeatmap",
    icon: Globe,
  },
  {
    title: "Report Scam Threat",
    page: "ReportScam",
    icon: AlertTriangle,
  },
];

export default function QuickActions() {
  return (
    <div className="space-y-3.5">
      {/* Top Tier — 4 Primary Scanner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {primaryScanners.map((scanner) => {
          const Icon = scanner.icon;
          return (
            <motion.div
              key={scanner.page}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <Link
                to={createPageUrl(scanner.page)}
                className="touch-manipulation min-h-[44px] h-full bg-white dark:bg-[#0d1424]/90 border border-slate-200 dark:border-slate-800/80 shadow-sm rounded-2xl p-5 flex flex-col justify-between gap-4 group transition-all duration-200 hover:border-emerald-500/50 hover:shadow-[0_0_24px_rgba(16,185,129,0.12)] active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/25 transition-transform duration-200 group-hover:scale-105"
                    style={{ background: "rgba(16, 185, 129, 0.12)" }}
                  >
                    <Icon className="w-5 h-5 text-emerald-600 dark:text-[#10b981]" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25 shrink-0">
                    {scanner.tag}
                  </span>
                </div>

                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                      {scanner.title}
                    </h3>
                    <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                      {scanner.subtitle}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-150 shrink-0 mb-0.5" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Tier — Compact Utility Action Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {utilityActions.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className="touch-manipulation min-h-[44px] py-3 px-4 rounded-xl bg-white dark:bg-[#0d1424]/80 border border-slate-200 dark:border-slate-800/80 shadow-sm hover:border-emerald-500/45 hover:shadow-[0_0_16px_rgba(16,185,129,0.1)] flex items-center justify-between gap-2.5 group transition-all duration-150 active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-emerald-500/20"
                  style={{ background: "rgba(16, 185, 129, 0.1)" }}
                >
                  <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-[#10b981]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  {item.title}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-150 shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
