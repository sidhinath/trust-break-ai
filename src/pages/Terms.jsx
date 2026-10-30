import React from "react";
import { FileText, Scale, AlertTriangle } from "lucide-react";
import ScannerHeader from "../components/scanner/ScannerHeader";

export default function Terms() {
  return (
    <div className="space-y-6">
      <ScannerHeader
        icon={FileText}
        title="Terms & Conditions of Service"
        description="Legal terms of use, probabilistic threat risk disclaimers, acceptable telemetry guidelines, and liability boundaries"
        color="#06b6d4"
      />

      <div className="ghost-card p-6 sm:p-8 space-y-6 text-xs leading-relaxed" style={{ color: 'var(--ghost-text)' }}>
        
        {/* Effective Date & Entity Header */}
        <div className="p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
          <div>
            <span className="font-bold text-sm block" style={{ color: 'var(--ghost-text)' }}>
              GhostNet Cyber Defense Platform Terms of Use
            </span>
            <span style={{ color: 'var(--ghost-text-dim)' }}>
              Effective Date: September 26, 2026 | Version 2.1
            </span>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            Official Document
          </span>
        </div>

        {/* Section 1: Acceptance */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            1. Acceptance of Terms
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            By accessing, browsing, or utilizing the GhostNet application, APIs, or browser extensions, you agree to be bound by these Terms & Conditions. If you do not agree to all terms, you must immediately cease accessing the platform.
          </p>
        </section>

        {/* Section 2: Probabilistic Risk Disclaimer */}
        <section className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> 2. Probabilistic Risk Scoring Disclaimer
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            GhostNet provides probabilistic threat assessments powered by deep neural heuristics, pattern recognition, and community threat intelligence. 
          </p>
          <ul className="list-disc pl-5 space-y-1 font-medium" style={{ color: 'var(--ghost-text-dim)' }}>
            <li>Threat scores reflect statistical risk probabilities (0% to 100%) rather than deterministic legal or mathematical absolutes.</li>
            <li>No threat scanner guarantees zero false positives or false negatives. Users must exercise independent judgment when inspecting URLs, audio calls, or financial requests.</li>
            <li>GhostNet shall not be held liable for security decisions, transactions, or actions taken based on automated threat ratings.</li>
          </ul>
        </section>

        {/* Section 3: Acceptable Use Policy */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            3. Acceptable Use Policy
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            You agree to use GhostNet.ai strictly for legitimate cybersecurity inspection, educational research, and threat prevention. You MUST NOT:
          </p>
          <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--ghost-text-dim)' }}>
            <li>Submit illegal, defamatory, or harmful content unrelated to scam detection.</li>
            <li>Attempt to reverse-engineer, exploit, or disrupt GhostNet’s serverless infrastructure.</li>
            <li>Automate mass scanning for malicious domain validation or evasion tuning.</li>
          </ul>
        </section>

        {/* Section 4: Intellectual Property */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            4. Intellectual Property Rights
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            All platform visual designs, underlying code, heuristic logic, logo branding, and user interface components are the exclusive property of GhostNet Cyber Defense Systems.
          </p>
        </section>

        {/* Section 5: Limitation of Liability */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
            <Scale className="w-4 h-4" /> 5. Limitation of Liability
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            To the maximum extent permitted by applicable law in India and international jurisdictions, GhostNet Cyber Defense Systems and its officers, developers, and affiliates shall not be liable for any indirect, incidental, or consequential damages resulting from platform use.
          </p>
        </section>

        {/* Section 6: Governance & Jurisdiction */}
        <section className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--ghost-border)' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            6. Governing Law & Jurisdiction
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            These Terms shall be governed by and construed in accordance with the laws of India. Any legal disputes arising out of these terms shall be subject to the exclusive jurisdiction of courts located in Bengaluru, Karnataka, India.
          </p>
        </section>

      </div>
    </div>
  );
}
