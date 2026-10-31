import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, ShieldCheck, UserRound, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

export default function SignInModal({ isOpen, onClose, onSuccess, initialMode }) {
  const { signIn, signUp, continueAsGuest } = useAuth();
  const [mode, setMode] = useState(initialMode || "signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync mode when modal opens or initialMode changes (e.g. nav Sign Up vs Sign In)
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || "signin");
      setError("");
      setInfo("");
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setError("");
    setInfo("");
  };

  const handleModeSwitch = (m) => {
    setMode(m);
    setError("");
    setInfo("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password.trim()) { setError("Please enter your password."); return; }
    if (mode === "signup" && password.length < 6) { setError("Password must be at least 6 characters."); return; }

    try {
      setLoading(true);
      const user = mode === "signup"
        ? await signUp(email.trim(), password, fullName.trim())
        : await signIn(email.trim(), password);

      if (mode === "signup" && !user?.email_confirmed_at) {
        setInfo("Account created! Check your email inbox for a confirmation link before signing in.");
        setLoading(false);
        return;
      }

      resetForm();
      onClose?.();
      onSuccess?.(user);
    } catch (err) {
      const msg = err?.message || "";
      // Friendly Supabase error messages
      if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
        setError("Incorrect email or password. Please try again.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Please confirm your email address before signing in.");
      } else if (msg.includes("User already registered") || msg.includes("already been registered")) {
        setError("An account with this email already exists. Sign in instead.");
      } else if (msg.includes("Password should be at least")) {
        setError("Password must be at least 6 characters.");
      } else {
        setError(msg || `Unable to ${mode === "signup" ? "create account" : "sign in"}. Please try again.`);
      }
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
      onClose?.();
      onSuccess?.(user);
    } catch (err) {
      setError(err?.message || "Guest access is unavailable right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-950/98 p-6 shadow-[0_24px_64px_rgba(6,11,20,0.7)]"
          >
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg overflow-hidden border border-cyan-500/40 bg-slate-950 flex items-center justify-center">
                    <img src="/logo-icon.svg" alt="TrustBreak AI" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">TrustBreak AI</p>
                </div>
                <h3 className="text-2xl font-black tracking-[-0.04em] text-white">
                  {mode === "signup" ? "Create account" : "Welcome back"}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {mode === "signup"
                    ? "Set up your free TrustBreak AI workspace"
                    : "Sign in to access all security features"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => { resetForm(); onClose?.(); }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-cyan-400 hover:text-white shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="mb-5 flex rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleModeSwitch("signin")}
                className={`flex-1 rounded-lg px-3 py-2 transition-all ${mode === "signin" ? "bg-slate-900 text-cyan-300 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch("signup")}
                className={`flex-1 rounded-lg px-3 py-2 transition-all ${mode === "signup" ? "bg-slate-900 text-cyan-300 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
              >
                Create Account
              </button>
            </div>

            {/* Trust badge */}
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3 text-sm text-emerald-300">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span className="text-xs">
                {mode === "signup"
                  ? "Your data is encrypted and stored securely with Supabase."
                  : "Secure session with end-to-end encryption via Supabase Auth."}
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400" htmlFor="auth-name">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400" htmlFor="auth-email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400" htmlFor="auth-password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Create a strong password (6+ chars)" : "Enter your password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error / Info */}
              {error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {error}
                </div>
              )}
              {info && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {info}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-sm font-bold text-slate-950 shadow-[0_0_26px_rgba(34,211,238,0.3)] hover:brightness-110 disabled:opacity-60 transition-all"
                disabled={loading}
              >
                {loading
                  ? (mode === "signup" ? "Creating account..." : "Signing in...")
                  : (mode === "signup" ? "Create Account" : "Sign In")}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
              <div className="h-px flex-1 bg-slate-800" />
              <span>or</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {/* Guest */}
            <button
              type="button"
              onClick={handleGuest}
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:border-slate-500 hover:text-white disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-slate-400" />
              Continue as Guest
            </button>

            <p className="mt-3 text-center text-[11px] text-slate-600">
              By continuing, you agree to our{" "}
              <a href="#/Terms" className="text-cyan-600 hover:underline">Terms of Service</a>{" "}
              &amp;{" "}
              <a href="#/PrivacyPolicy" className="text-cyan-600 hover:underline">Privacy Policy</a>.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
