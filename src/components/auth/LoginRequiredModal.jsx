import React from "react";
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-sm rounded-2xl border border-amber-500/30 bg-slate-950/98 p-6 shadow-[0_24px_64px_rgba(6,11,20,0.8)]"
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
                <h3 className="text-xl font-black tracking-tight text-white">
                  Sign In Required
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-[260px] mx-auto">
                  {feature
                    ? `Please sign in to use the ${feature}.`
                    : "Please sign in to continue using this feature."}
                </p>
              </div>
            </div>

            {/* Feature badge */}
            {feature && (
              <div className="mb-5 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Feature</span>
                <p className="text-sm font-bold text-white mt-0.5">{feature}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleSignIn}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </button>

              <button
                type="button"
                onClick={handleSignUp}
                className="w-full h-11 rounded-xl border border-cyan-500/30 bg-cyan-500/8 text-sm font-bold text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/15 transition-all flex items-center justify-center gap-2"
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
}
