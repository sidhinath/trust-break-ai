import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, LogIn, UserPlus, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

/**
 * LoginRequiredModal
 * Shown whenever a guest user tries to access a protected feature.
 *
 * Props:
 *   isOpen   – boolean
 *   onClose  – () => void
 *   feature  – optional string describing the feature (e.g. "Message Scanner")
 *   onSignIn – optional () => void. When provided, the caller is responsible for
 *              closing the prompt and opening the sign-in modal (used to keep a
 *              pending navigation target).
 *   onSignUp – optional () => void, same contract as onSignIn.
 */
export default function LoginRequiredModal({ isOpen, onClose, feature, onSignIn, onSignUp }) {
  const { openSignIn, openSignUp } = useAuth();

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
      return;
    }
    onClose?.();
    openSignIn();
  };

  const handleSignUp = () => {
    if (onSignUp) {
      onSignUp();
      return;
    }
    onClose?.();
    openSignUp();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(3, 7, 18, 0.94)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ backgroundColor: "#0b1120", color: "#f8fafc" }}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 p-6 shadow-2xl my-auto"
          >
            {/* Close */}
            {onClose && (
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Icon */}
            <div className="mb-5 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                <ShieldAlert className="w-8 h-8 text-amber-400" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black tracking-tight text-white" style={{ color: "#ffffff" }}>
                  Sign In Required
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-[260px] mx-auto" style={{ color: "#94a3b8" }}>
                  {feature
                    ? `Please sign in to use the ${feature}.`
                    : "Please sign in to continue using this feature."}
                </p>
              </div>
            </div>

            {/* Feature badge */}
            {feature && (
              <div className="mb-5 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500" style={{ color: "#94a3b8" }}>Feature</span>
                <p className="text-sm font-bold text-white mt-0.5" style={{ color: "#ffffff" }}>{feature}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleSignIn}
                style={{ backgroundColor: "#10b981", color: "#ffffff" }}
                className="touch-manipulation min-h-[44px] min-w-[44px] w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.28)] transition-transform duration-75 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </button>

              <button
                type="button"
                onClick={handleSignUp}
                className="touch-manipulation min-h-[44px] min-w-[44px] w-full h-11 rounded-xl border border-emerald-500/30 bg-emerald-500/8 text-sm font-bold text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/15 transition-transform duration-75 active:scale-95 flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Create Free Account
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
              >
                Continue browsing as guest
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}


