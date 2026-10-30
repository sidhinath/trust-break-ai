import React, { useState, useEffect } from "react";
import { HeartHandshake, ShieldCheck } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";

/**
 * SeniorModeToggleSwitch Component
 * Highly accessible, large touch-target physical sliding toggle switch for Senior Mode.
 * Designed specifically for elderly users with clear visual ON/OFF states.
 * Guarantees 100% surface touch target registration on Android WebViews and mobile devices.
 */
export default function SeniorModeToggleSwitch({ variant = "default", className = "" }) {
  const [active, setActive] = useState(() => {
    try {
      return (
        document.body.classList.contains("family-safety-mode") ||
        localStorage.getItem("ghostnet_senior_mode") === "true"
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const syncState = () => {
      const isSenior =
        document.body.classList.contains("family-safety-mode") ||
        localStorage.getItem("ghostnet_senior_mode") === "true";
      setActive(isSenior);
    };
    syncState();

    window.addEventListener("ghostnet_senior_mode_change", syncState);
    window.addEventListener("storage", syncState);
    return () => {
      window.removeEventListener("ghostnet_senior_mode_change", syncState);
      window.removeEventListener("storage", syncState);
    };
  }, []);

  const handleToggle = async (e) => {
    if (e) {
      e.stopPropagation();
    }
    await triggerHaptic("medium");
    const nextState = !active;
    setActive(nextState);

    try {
      localStorage.setItem("ghostnet_senior_mode", nextState ? "true" : "false");
    } catch {}

    if (nextState) {
      document.body.classList.add("family-safety-mode");
    } else {
      document.body.classList.remove("family-safety-mode");
    }

    window.dispatchEvent(new Event("ghostnet_senior_mode_change"));
  };

  // Header Compact Switch Variant
  if (variant === "header") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label="Toggle Senior & Family Safety Mode"
        onClick={handleToggle}
        className={`h-10 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-black transition-all cursor-pointer select-none active:scale-95 shrink-0 touch-manipulation relative overflow-hidden ${
          active
            ? "bg-emerald-500/20 border-emerald-400 text-emerald-700 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
            : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
        } ${className}`}
      >
        <HeartHandshake className={`w-4 h-4 shrink-0 pointer-events-none ${active ? "text-emerald-500" : "text-slate-400"}`} />
        
        <span className="hidden sm:inline font-extrabold tracking-tight pointer-events-none">
          {active ? "Senior Mode: ON" : "Senior Mode"}
        </span>

        {/* Sliding Switch Pill Track */}
        <div className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center pointer-events-none ${active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}>
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ease-out transform pointer-events-none ${
              active ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </div>
      </button>
    );
  }

  // Banner / Home Prominent Large Switch Variant
  if (variant === "large") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label="Toggle Senior & Family Safety Mode"
        onClick={handleToggle}
        className={`group p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer select-none active:scale-98 flex items-center justify-between gap-4 shadow-lg touch-manipulation relative overflow-hidden ${
          active
            ? "border-emerald-400 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-emerald-500/20"
            : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white hover:border-emerald-500"
        } ${className}`}
      >
        <div className="flex items-center gap-3.5 pointer-events-none">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner pointer-events-none ${
            active ? "bg-white/20 border-white/30 text-white" : "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
          }`}>
            <HeartHandshake className="w-7 h-7 pointer-events-none" />
          </div>
          <div className="text-left pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-none">
              <span className={`text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-md border pointer-events-none ${
                active ? "bg-white/20 text-white border-white/30" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              }`}>
                {active ? "ACTIVE PROTECTION" : "ACCESSIBLE MODE"}
              </span>
              {active && <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping pointer-events-none" />}
            </div>
            <h2 className="text-lg sm:text-xl font-black font-display tracking-tight mt-0.5 pointer-events-none">
              SENIOR & FAMILY SAFETY MODE
            </h2>
          </div>
        </div>

        {/* Large Sliding Switch Control */}
        <div className="flex items-center gap-3 shrink-0 pointer-events-none">
          <span className={`text-xs sm:text-sm font-mono font-black tracking-wider uppercase hidden sm:inline pointer-events-none ${
            active ? "text-emerald-100" : "text-slate-600 dark:text-slate-400"
          }`}>
            {active ? "MODE ON" : "MODE OFF"}
          </span>

          <div className={`w-14 h-8 sm:w-16 sm:h-9 rounded-full p-1 transition-colors flex items-center shadow-inner pointer-events-none ${
            active ? "bg-slate-950 border border-emerald-400/60" : "bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-600"
          }`}>
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-md transition-transform duration-200 ease-out transform flex items-center justify-center pointer-events-none ${
                active ? "translate-x-6 sm:translate-x-7 bg-emerald-400 text-slate-950" : "translate-x-0 bg-white text-slate-400"
              }`}
            >
              <ShieldCheck className="w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Default Standard Toggle Switch
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label="Toggle Senior & Family Safety Mode"
      onClick={handleToggle}
      className={`h-11 px-4 rounded-2xl border flex items-center justify-between gap-3 font-bold text-xs sm:text-sm transition-all cursor-pointer select-none active:scale-95 shrink-0 touch-manipulation relative overflow-hidden ${
        active
          ? "bg-emerald-500/20 border-emerald-400 text-emerald-700 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400"
      } ${className}`}
    >
      <div className="flex items-center gap-2 pointer-events-none">
        <HeartHandshake className={`w-4 h-4 pointer-events-none ${active ? "text-emerald-500" : "text-slate-400"}`} />
        <span className="pointer-events-none">{active ? "Senior Mode: ON" : "Senior Mode: OFF"}</span>
      </div>

      <div className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center pointer-events-none ${active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}>
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-out transform pointer-events-none ${
            active ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}
