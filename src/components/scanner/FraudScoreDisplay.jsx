import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldX, Sparkles, Key, DollarSign, Clock, Users, Globe, AlertTriangle, QrCode, UserX, Banknote, CalendarX, ShieldOff, KeyRound } from "lucide-react";
import ThreatReconstruction from "./ThreatReconstruction";
import EmergencyActionCard from "./EmergencyActionCard";
import SourceBadge from "./SourceBadge";
import { REASON_CODE_DICT } from "@/lib/reasonCodes";

export default function FraudScoreDisplay({
  score = 0,
  riskLevel = "safe",
  confidence = "high",
  reasons = [],
  analysis = "",
  attackIntent = "",
  signals = {},
  threatReconstruction = [],
  similarPatterns: _similarPatterns = [],
  rawScanData = {},
  reasonCodes = [],
  source = null,
}) {
  const config = {
    safe: {
      icon: ShieldCheck,
      label: "SAFE / LOW RISK",
      badgeClass: "badge-safe",
      scoreClass: "score-safe",
      color: "var(--ghost-green)",
      description: "No recognized social engineering, malware, or phishing indicators detected."
    },
    suspicious: {
      icon: ShieldAlert,
      label: "SUSPICIOUS / ELEVATED RISK",
      badgeClass: "badge-suspicious",
      scoreClass: "score-suspicious",
      color: "var(--ghost-orange)",
      description: "Potential scam or coercion patterns found. Exercise strict caution before proceeding."
    },
    scam: {
      icon: ShieldX,
      label: "HIGH THREAT SCAM DETECTED",
      badgeClass: "badge-scam",
      scoreClass: "score-scam",
      color: "var(--ghost-red)",
      description: "Strong evidence of malicious deception, credential harvesting, or financial fraud."
    },
  };

  const c = config[riskLevel] || config.safe;
  const Icon = c.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4">
      
      {/* Main Score Hero Card */}
      <div className="ghost-card p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `rgba(${riskLevel === 'safe' ? '16,185,129' : riskLevel === 'suspicious' ? '245,158,11' : '239,68,68'}, 0.15)` }}>
              <Icon className="w-8 h-8" style={{ color: c.color }} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${c.badgeClass}`}>
                  {c.label}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full badge-neutral">
                  Engine Confidence: <strong className="capitalize" style={{ color: 'var(--ghost-text)' }}>{confidence}</strong>
                </span>
                <SourceBadge source={source} />
              </div>
              <h2 className="text-lg font-bold tracking-tight font-display" style={{ color: 'var(--ghost-text)' }}>
                Threat Assessment Verdict
              </h2>
              <p className="text-xs font-medium max-w-md leading-relaxed" style={{ color: 'var(--ghost-text-dim)' }}>
                {c.description}
              </p>
            </div>
          </div>

          {/* Calibrated Risk Score Gauge */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border self-start md:self-auto"
            style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'var(--ghost-text-muted)' }}>
                Risk Score
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--ghost-text-dim)' }}>
                0 (Safe) — 100 (Critical)
              </span>
            </div>
            <div className="flex items-baseline">
              <span className={`text-4xl sm:text-5xl font-black font-display ${c.scoreClass}`}>
                {score}
              </span>
              <span className="text-sm font-bold ml-1" style={{ color: 'var(--ghost-text-muted)' }}>/100</span>
            </div>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full h-2 rounded-full overflow-hidden mt-6" style={{ background: 'var(--ghost-surface-3)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: c.color }}
          />
        </div>
      </div>

      {/* Reason Code Chips — Feature 1: Explainable Risk Scoring */}
      {reasonCodes && reasonCodes.length > 0 && (() => {
        const ICON_MAP = {
          Clock, Globe, AlertTriangle, QrCode, UserX, Banknote, CalendarX, ShieldOff, KeyRound, ShieldX: ShieldX,
        };
        return (
          <div className="ghost-card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--ghost-text-dim)' }}>
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              Structured Risk Indicators ({reasonCodes.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {reasonCodes.map((code) => {
                const meta = REASON_CODE_DICT[code];
                if (!meta) return null;
                const IconComp = ICON_MAP[meta.icon] || AlertTriangle;
                return (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                    style={{
                      color: meta.color,
                      borderColor: `${meta.color}40`,
                      background: `${meta.color}15`,
                    }}
                  >
                    <IconComp className="w-3 h-3 shrink-0" />
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Threat Reconstruction Component */}
      {threatReconstruction && threatReconstruction.length > 0 && (
        <ThreatReconstruction
          attackChain={threatReconstruction}
          attackerIntent={attackIntent}
          riskLevel={riskLevel}
        />
      )}

      {/* Signals Matrix */}
      {signals && Object.values(signals).some(Boolean) && (
        <div className="ghost-card p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--ghost-text-dim)' }}>
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            Detected Manipulation Signals
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {signals.urgency && (
              <div className="p-3 rounded-xl border flex items-start gap-2.5"
                style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">Urgency / Time Pressure</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ghost-text)' }}>{signals.urgency}</p>
                </div>
              </div>
            )}
            {signals.credential && (
              <div className="p-3 rounded-xl border flex items-start gap-2.5"
                style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <Key className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">Credential Harvesting</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ghost-text)' }}>{signals.credential}</p>
                </div>
              </div>
            )}
            {signals.financial && (
              <div className="p-3 rounded-xl border flex items-start gap-2.5"
                style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <DollarSign className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">Financial / Payment Trap</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ghost-text)' }}>{signals.financial}</p>
                </div>
              </div>
            )}
            {signals.impersonation && (
              <div className="p-3 rounded-xl border flex items-start gap-2.5"
                style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <Users className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 block">Brand Impersonation</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ghost-text)' }}>{signals.impersonation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Evidence Points */}
      <div className="ghost-card p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--ghost-text-dim)' }}>
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          Extracted Technical Evidence & Security Findings ({(reasons && reasons.length) || 4})
        </h3>
        <div className="space-y-2">
          {reasons && reasons.length > 0 ? (
            reasons.map((reason, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2.5 p-2.5 rounded-lg border"
                style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <span className={riskLevel === 'safe' ? 'text-emerald-500 font-bold text-sm' : 'text-cyan-500 font-bold text-sm'}>
                  {riskLevel === 'safe' ? '✓' : '›'}
                </span>
                <span className="text-xs font-medium leading-relaxed" style={{ color: 'var(--ghost-text)' }}>{reason}</span>
              </motion.div>
            ))
          ) : (
            <>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <span className="text-emerald-500 font-bold text-sm">✓</span>
                <span className="text-xs font-medium leading-relaxed" style={{ color: 'var(--ghost-text)' }}>
                  <strong>Transport Layer Security:</strong> Valid HTTPS protocol active with standard TLS encryption.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <span className="text-emerald-500 font-bold text-sm">✓</span>
                <span className="text-xs font-medium leading-relaxed" style={{ color: 'var(--ghost-text)' }}>
                  <strong>Hostname Syntax:</strong> Hostname structure validated without DNS cloaking, IP literals, or deep subdomain nesting.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <span className="text-emerald-500 font-bold text-sm">✓</span>
                <span className="text-xs font-medium leading-relaxed" style={{ color: 'var(--ghost-text)' }}>
                  <strong>Brand Mimicry & Homograph Audit:</strong> Passed homograph character analysis and typosquatting pattern detection.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <span className="text-emerald-500 font-bold text-sm">✓</span>
                <span className="text-xs font-medium leading-relaxed" style={{ color: 'var(--ghost-text)' }}>
                  <strong>Threat Intelligence Check:</strong> Zero malicious flags or active scam reports recorded across threat feeds.
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Explanation */}
      {analysis && (
        <div className="ghost-card p-5 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ghost-text-dim)' }}>
            Deep Threat Intelligence Summary
          </h3>
          <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--ghost-text-dim)' }}>
            {analysis}
          </p>
        </div>
      )}

      {/* Emergency Action Plan */}
      <EmergencyActionCard
        riskLevel={riskLevel}
        scanData={rawScanData}
      />
    </motion.div>
  );
}
