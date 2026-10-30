import React from "react";
import { MessageSquareWarning, Link2, Image, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const iconMap = {
  message: MessageSquareWarning,
  link: Link2,
  screenshot: Image,
};

export default function RecentScans({ scans = [] }) {
  if (!scans || scans.length === 0) {
    return (
      <div className="ghost-card p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto"
          style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)', color: 'var(--ghost-text-muted)' }}>
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold" style={{ color: 'var(--ghost-text)' }}>No Scan Activity Yet</h4>
          <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--ghost-text-dim)' }}>
            Your recent scans and security analyses will appear here. Try pasting a message or scanning a link above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {scans.slice(0, 6).map((scan, i) => {
        const Icon = iconMap[scan.scan_type] || MessageSquareWarning;
        const isScam = scan.risk_level === 'scam';
        const isSuspicious = scan.risk_level === 'suspicious';
        
        const badgeClass = isScam ? 'badge-scam' : isSuspicious ? 'badge-suspicious' : 'badge-safe';
        const iconColor = isScam ? 'var(--ghost-red)' : isSuspicious ? 'var(--ghost-orange)' : 'var(--ghost-green)';
        const iconBg = isScam ? 'rgba(239,68,68,0.12)' : isSuspicious ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';

        return (
          <motion.div
            key={scan.id || i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="ghost-card p-3.5 flex items-center justify-between gap-4 transition-all">
            
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: iconBg }}>
                <Icon className="w-4 h-4" style={{ color: iconColor }} />
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold capitalize" style={{ color: 'var(--ghost-text)' }}>
                    {scan.scan_type} Inspection
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full ${badgeClass}`}>
                    {scan.risk_level}
                  </span>
                </div>
                
                <p className="text-xs truncate max-w-md font-medium" style={{ color: 'var(--ghost-text-dim)' }}>
                  {scan.input_content || scan.ai_analysis || "Inspected payload"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-sm font-black font-display block" style={{ color: iconColor }}>
                  {scan.fraud_score}%
                </span>
                <span className="text-[10px] font-mono block" style={{ color: 'var(--ghost-text-muted)' }}>
                  {new Date(scan.created_date || scan.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}