import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Mail, Lock, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

export default function SignInModal({ isOpen, onClose, onSuccess }) {
  const { signIn, signUp, continueAsGuest } = useAuth();
  const [mode, setMode] = useState("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      const user = mode === "signup"
        ? await signUp(email, password, fullName)
        : await signIn(email, password);

      resetForm();
      onClose();
      if (onSuccess) onSuccess(user);
    } catch (err) {
      setError(err?.message || `Unable to ${mode === "signup" ? "create account" : "sign in"}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError("");
    try {
      setLoading(true);
      const user = await continueAsGuest();
      resetForm();
      onClose();
      if (onSuccess) onSuccess(user);
    } catch (err) {
      setError(err?.message || "Guest access is unavailable right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-950/95 p-6 shadow-[0_18px_52px_rgba(6,11,20,0.6)]"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              {mode === "signup" ? "Create Account" : "Secure Sign In"}
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">
              {mode === "signup" ? "Set up your workspace" : "Access your workspace"}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close sign in dialog"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-cyan-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-5 flex rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-1 text-xs font-semibold text-slate-200">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-lg px-3 py-2 transition-colors ${mode === "signin" ? "bg-slate-950 text-cyan-300" : "text-slate-300"}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-lg px-3 py-2 transition-colors ${mode === "signup" ? "bg-slate-950 text-cyan-300" : "text-slate-300"}`}
          >
            Create Account
          </button>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
          {mode === "signup"
            ? "Create a local workspace account with your email and password."
            : "Local workspace sign-in is enabled for email and password access."}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400" htmlFor="signup-name">
                Full Name
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="signup-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400" htmlFor="signin-email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400" htmlFor="signin-password">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Create a secure password" : "Enter your password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-sm font-bold text-slate-950 shadow-[0_0_26px_rgba(34,211,238,0.35)] hover:brightness-110 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? (mode === "signup" ? "Creating account..." : "Signing in...") : (mode === "signup" ? "Create Account" : "Sign In")}
          </Button>
        </form>

        <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-700" />
          <span>or</span>
          <div className="h-px flex-1 bg-slate-700" />
        </div>

        <button
          type="button"
          onClick={handleGuest}
          disabled={loading}
          className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400 hover:text-white disabled:opacity-60"
        >
          Continue as Guest
        </button>
      </motion.div>
    </div>
  );
}
