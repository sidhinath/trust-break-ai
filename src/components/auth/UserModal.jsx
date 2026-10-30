import React from "react";
import { motion } from "framer-motion";
import { X, User, Mail, Calendar, Key, Lock, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UserModal({ isOpen, onClose, user }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

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

  const createdDate = user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : "Active Session";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="ghost-card w-full max-w-md p-6 relative overflow-hidden space-y-5 border-cyan-500/30">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--ghost-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <User className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Operator Account Details
              </h3>
              <p className="text-xs" style={{ color: "var(--ghost-text-dim)" }}>
                Verified GhostNet Security Session
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Identity Box */}
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
                <p className="text-xs font-bold text-white truncate">
                  {user?.email || "Guest Analyst"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Key className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--ghost-text-dim)" }}>
                  Cryptographic User ID
                </span>
                <p className="text-[11px] font-mono text-slate-300 truncate">
                  {user?.id || "Local Ephemeral Session"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--ghost-text-dim)" }}>
                  Account Established
                </span>
                <p className="text-xs font-medium text-slate-200">
                  {createdDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            onClick={handleGoToProfile}
            className="w-full text-xs font-bold border-slate-700 hover:border-cyan-400 hover:bg-cyan-500/10">
            <Shield className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Full Profile
          </Button>
          <Button
            variant="outline"
            onClick={handleGoToPrivacy}
            className="w-full text-xs font-bold border-slate-700 hover:border-emerald-400 hover:bg-emerald-500/10">
            <Lock className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Privacy Data
          </Button>
        </div>

        {/* Sign Out CTA */}
        <Button
          onClick={handleSignOut}
          className="w-full h-10 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white text-xs transition-colors">
          <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out of GhostNet Console
        </Button>
      </motion.div>
    </div>
  );
}
