import React from "react";
import { CheckCircle, ShieldCheck } from "lucide-react";

/**
 * SourceBadge — shows which engine produced the verdict.
 * "groq" | "gemini" | "openai" → green AI Online badge
 * "ghostnet-heuristics"        → cyan/green GhostNet Threat Engine Online badge
 * "community-threat-feed"       → blue Community Feed badge
 * "public-feed:*"               → red Public Blocklist badge
 */
export default function SourceBadge({ source }) {
  if (!source) return null;

  const isCommunity = source === "community-threat-feed";
  const isPublicFeed = source?.startsWith("public-feed:");
  const feedName = isPublicFeed ? source.split(":")[1] : null;

  if (isCommunity) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono border border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400">
        <CheckCircle className="w-3 h-3" />
        Community Threat Feed
      </span>
    );
  }

  if (isPublicFeed) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400">
        <CheckCircle className="w-3 h-3" />
        Public Blocklist: {feedName}
      </span>
    );
  }

  if (source === "ghostnet-heuristics" || source === "offline-heuristic") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono border border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
        <ShieldCheck className="w-3 h-3" />
        GhostNet Threat Engine Online
      </span>
    );
  }

  // AI engine online
  const label =
    source === "gemini" ? "Gemini Vision Engine" :
    source === "openai" ? "OpenAI Vision Engine" :
    "Groq Threat Engine";

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
      <CheckCircle className="w-3 h-3" />
      {label} Online
    </span>
  );
}
