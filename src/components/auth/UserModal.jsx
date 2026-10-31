import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Calendar, Key, Lock, LogOut, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Generate initials avatar from email or name
function getInitials(user) {
  const name = user?.user_metadata?.full_name || user?.email || "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return "?";
}

function getAvatarColor(user) {
  const str = user?.email || user?.id || "guest";
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = [
    "from-cyan-500 to-blue-500",
    "from-purple-500 to-pink-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-indigo-500 to-violet-500",
  ];
  return colors[Math.abs(hash) % colors.length];
}

export default function UserModal({ isOpen, onClose, user }) {
  const navigate = useNavigate();
  const { signOut, isGuest, openSignIn, openSignUp } = useAuth();

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate(createPageUrl("Home"));
  };

  const handleGoToProfile = () => {
    onClose();
    navigate(createPageUrl("Profile"));
  };

  const handleGoToPrivacy = () => {
    onClose();
    navigate(createPageUrl("PrivacyCenter"));
  };

  const handleSignIn = () => {
    onClose();
    openSignIn();
  };

  const handleSignUp = () => {
    onClose();
    openSignUp();
  };

  const createdDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "Active Session";

  const initials = getInitials(user);
  const avatarGradient = getAvatarColor(user);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="ghost-card w-full max-w-md p-6 relative overflow-hidden space-y-5 border-cyan-500/30"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--ghost-border)" }}>
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-black text-base shadow-lg shrink-0`}>
                  {isGuest ? <Sparkles className="w-5 h-5" /> : initials}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {isGuest ? "Guest Session" : (user?.user_metadata?.full_name || "TrustBreak Operator")}
                  </h3>
                  <p className="text-xs" style={{ color: "var(--ghost-text-dim)" }}>
                    {isGuest ? "Limited access · Sign in for full features" : "Verified TrustBreak AI Security Session"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Guest CTA */}
            {isGuest && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white">You're browsing as a guest</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--ghost-text-dim)" }}>
                      Sign in or create a free account to unlock all scanners, reports, and threat intelligence.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSignIn}
                    className="h-9 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-xs font-bold text-slate-950 hover:brightness-110 transition-all"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleSignUp}
                    className="h-9 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-xs font-bold text-cyan-300 hover:border-cyan-400 transition-all"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}

            {/* Authenticated user details */}
            {!isGuest && (
              <>
                <div className="p-4 rounded-xl border space-y-3" style={{ background: "var(--ghost-surface-2)", borderColor: "var(--ghost-border)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ghost-text-dim)" }}>
                      Authenticated User
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-safe uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Operator
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--ghost-text-dim)" }}>
                          Email Address
                        </span>
                        <p className="text-xs font-bold text-white truncate">{user?.email || "—"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Key className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--ghost-text-dim)" }}>
                          User ID
                        </span>
                        <p className="text-[11px] font-mono text-slate-300 truncate">{user?.id || "—"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--ghost-text-dim)" }}>
                          Account Created
                        </span>
                        <p className="text-xs font-medium text-slate-200">{createdDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleGoToProfile}
                    className="w-full text-xs font-bold border-slate-700 hover:border-cyan-400 hover:bg-cyan-500/10"
                  >
                    <Shield className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Full Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGoToPrivacy}
                    className="w-full text-xs font-bold border-slate-700 hover:border-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Privacy Data
                  </Button>
                </div>

                {/* Sign Out */}
                <Button
                  onClick={handleSignOut}
                  className="w-full h-10 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white text-xs transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out of TrustBreak AI Console
                </Button>
              </>
            )}

            {/* Guest sign out / end session */}
            {isGuest && (
              <button
                onClick={handleSignOut}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-rose-400 transition-colors"
              >
                End guest session
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
