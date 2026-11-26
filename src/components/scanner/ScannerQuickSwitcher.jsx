import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { triggerHaptic } from "@/lib/haptics";
import { SCAN_TOOLS } from "./scanTools";

/**
 * Mobile-only tool strip shown directly under a scanner page header.
 * Horizontal scrolling keeps all five tools reachable on narrow viewports.
 */
export default function ScannerQuickSwitcher({ activePage }) {
  const navigate = useNavigate();

  const openTool = (page) => {
    if (page === activePage) return;
    triggerHaptic("light").catch(() => {});
    navigate(createPageUrl(page));
  };

  return (
    <div className="md:hidden -mt-1 mb-4 -mx-4 px-4">
      <div
        role="tablist"
        aria-label="Scanner tools"
        className="flex gap-2 overflow-x-auto overscroll-x-contain no-scrollbar pb-1"
      >
        {SCAN_TOOLS.map(({ page, shortLabel, icon: Icon }) => {
          const active = page === activePage;

          return (
            <button
              key={page}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => openTool(page)}
              className={`shrink-0 touch-manipulation min-h-[44px] rounded-full border px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 transition-transform duration-75 active:scale-95 cursor-pointer whitespace-nowrap ${
                active ? "shadow-sm" : "hover:border-emerald-400/60"
              }`}
              style={{
                background: active ? "#10b981" : "var(--tb-surface-2)",
                borderColor: active ? "#10b981" : "var(--tb-border)",
                color: active ? "#04120d" : "var(--tb-text-dim)",
              }}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? "#04120d" : undefined }} />
              <span>{shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
