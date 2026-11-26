import { Image, Link2, MessageSquareWarning, Mic, QrCode } from "lucide-react";

/**
 * Single source of truth for the five mobile quick-scan destinations.
 * Used by the bottom-nav picker and the in-page mobile tool switcher.
 */
export const SCAN_TOOLS = [
  {
    page: "MessageScanner",
    label: "Message Scanner",
    shortLabel: "Message",
    description: "SMS, WhatsApp, Email",
    icon: MessageSquareWarning,
  },
  {
    page: "LinkScanner",
    label: "Link / URL Inspector",
    shortLabel: "Link",
    description: "Check suspicious websites",
    icon: Link2,
  },
  {
    page: "ScreenshotScanner",
    label: "Screenshot Vision OCR",
    shortLabel: "Screenshot",
    description: "Upload image or chat screenshot",
    icon: Image,
  },
  {
    page: "QRScanner",
    label: "QR Code Inspector",
    shortLabel: "QR",
    description: "Scan payment or login QR",
    icon: QrCode,
  },
  {
    page: "VoiceScanner",
    label: "Voice & Audio Scam",
    shortLabel: "Voice",
    description: "Analyze call recordings",
    icon: Mic,
  },
];

export const SCANNER_PAGES = new Set(SCAN_TOOLS.map((tool) => tool.page));
