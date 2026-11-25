import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, LogOut, UserCheck, ChevronDown } from "lucide-react";
import { createPageUrl } from "@/utils";
import { triggerHaptic } from "@/lib/haptics";

function getInitials(user) {
  const name = user?.user_metadata?.full_name || user?.email || "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return "?";
}

export default function ProfileMenu({
  user,
  onOpenModal,
  onSignOut,
  labelMode = "email",
  currentPageName,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsOpen(false);
  }, [currentPageName]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    triggerHaptic("light").catch(() => {});
    setIsOpen((prev) => !prev);
  };

  const handleNavigate = (page) => {
    triggerHaptic("light").catch(() => {});
    setIsOpen(false);
    navigate(createPageUrl(page));
  };

  const handleOpenDetails = () => {
    triggerHaptic("light").catch(() => {});
    setIsOpen(false);
    onOpenModal?.();
  };

  const handleSignOutClick = async () => {
    triggerHaptic("light").catch(() => {});
    setIsOpen(false);
    await onSignOut?.();
    navigate(createPageUrl("Home"));
  };

  const initials = getInitials(user);
  const displayName = user?.user_metadata?.full_name || "TrustBreak Operator";
  const labelText =
    labelMode === "name"
      ? user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Account"
      : user?.email || "Account";

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title="View account menu"
        style={{ touchAction: "manipulation" }}
        className="touch-manipulation min-h-[44px] min-w-[44px] flex items-center gap-2 h-9 px-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-400 transition-transform duration-75 active:scale-95 cursor-pointer shrink-0"
      >
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-[10px] font-black text-slate-950 shrink-0 pointer-events-none">
          {initials}
        </div>
        <span
          className={`${
            labelMode === "name"
              ? "hidden sm:inline text-xs font-bold text-emerald-300 max-w-[120px]"
              : "hidden lg:inline text-xs font-mono text-slate-300 max-w-[140px]"
          } truncate pointer-events-none`}
        >
          {labelText}
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 pointer-events-none" />
        <ChevronDown
          className={`w-3.5 h-3.5 text-emerald-400/80 transition-transform duration-150 shrink-0 pointer-events-none ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-24px)] rounded-2xl border p-3 shadow-2xl backdrop-blur-xl space-y-2.5"
          style={{
            background: "var(--tb-surface)",
            borderColor: "var(--tb-border)",
          }}
        >
          {/* User Summary */}
          <div
            className="flex items-center gap-3 pb-2.5 border-b"
            style={{ borderColor: "var(--tb-border)" }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-xs font-black text-slate-950 shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-bold truncate"
                style={{ color: "var(--tb-text)" }}
              >
                {displayName}
              </p>
              <p
                className="text-xs font-mono truncate"
                style={{ color: "var(--tb-text-dim)" }}
              >
                {user?.email || "Active Session"}
              </p>
            </div>
          </div>

          {/* Menu Actions */}
          <div className="grid gap-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleOpenDetails}
              style={{ touchAction: "manipulation", color: "var(--tb-text)" }}
              className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors cursor-pointer touch-manipulation"
            >
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 pointer-events-none" />
              <span className="pointer-events-none">Account Details</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleNavigate("Profile")}
              style={{ touchAction: "manipulation", color: "var(--tb-text)" }}
              className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors cursor-pointer touch-manipulation"
            >
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 pointer-events-none" />
              <span className="pointer-events-none">Full Profile</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleNavigate("PrivacyCenter")}
              style={{ touchAction: "manipulation", color: "var(--tb-text)" }}
              className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors cursor-pointer touch-manipulation"
            >
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 pointer-events-none" />
              <span className="pointer-events-none">Privacy & Data Sovereignty</span>
            </button>
          </div>

          <div className="h-px w-full" style={{ background: "var(--tb-border)" }} />

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOutClick}
            style={{ touchAction: "manipulation" }}
            className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer touch-manipulation"
          >
            <LogOut className="w-4 h-4 shrink-0 pointer-events-none" />
            <span className="pointer-events-none">Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
