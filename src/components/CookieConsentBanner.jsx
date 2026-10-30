import React, { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CookieConsentBanner() {
  const [consentGiven, setConsentGiven] = useState(true); // Default hidden until checked

  useEffect(() => {
    const savedConsent = localStorage.getItem("ghostnet_cookie_consent");
    if (!savedConsent) {
      setConsentGiven(false);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("ghostnet_cookie_consent", "accepted");
    setConsentGiven(true);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem("ghostnet_cookie_consent", "essential_only");
    setConsentGiven(true);
  };

  if (consentGiven) return null;

  return (
    <aside
      role="dialog"
      aria-label="Cookie Consent Notice"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 p-4 sm:p-5 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all animate-in slide-in-from-bottom-5 duration-300"
      style={{
        background: 'var(--ghost-surface)',
        borderColor: 'var(--ghost-border)',
        color: 'var(--ghost-text)'
      }}>
      
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Cookie className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ghost-text)' }}>
                Cookie & Storage Preferences
              </h4>
              <p className="text-[10px] font-medium" style={{ color: 'var(--ghost-text-dim)' }}>
                DPDP Act 2023 & GDPR Notice
              </p>
            </div>
          </div>
          <button
            onClick={handleEssentialOnly}
            title="Dismiss notification with essential cookies only"
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--ghost-text-dim)' }}>
          GhostNet uses essential functional storage tokens (session auth, theme preferences) to operate securely. We do <strong>NOT</strong> use third-party advertising or cross-site tracking cookies.
        </p>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Link
            to={createPageUrl("CookiePolicy")}
            className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
            Read Cookie Policy
          </Link>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleEssentialOnly}
              className="text-xs font-bold px-3 h-8 rounded-lg"
              style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)', color: 'var(--ghost-text)' }}>
              Essential Only
            </Button>
            <Button
              type="button"
              onClick={handleAcceptAll}
              className="text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3.5 h-8 rounded-lg shadow">
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
