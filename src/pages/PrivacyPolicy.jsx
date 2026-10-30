import React from "react";
import { Lock, ShieldCheck, Mail, Building, MapPin, UserCheck, AlertCircle } from "lucide-react";
import ScannerHeader from "../components/scanner/ScannerHeader";

export default function PrivacyPolicy() {
  return (
    <div className="space-y-6">
      <ScannerHeader
        icon={Lock}
        title="Privacy Policy & Data Protection Notice"
        description="Comprehensive compliance breakdown under India's Digital Personal Data Protection (DPDP) Act 2023 and EU GDPR regulations"
        color="#10b981"
      />

      <div className="ghost-card p-6 sm:p-8 space-y-6 text-xs leading-relaxed" style={{ color: 'var(--ghost-text)' }}>
        
        {/* Effective Date & Entity Header */}
        <div className="p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
          <div>
            <span className="font-bold text-sm block" style={{ color: 'var(--ghost-text)' }}>
              Data Fiduciary: GhostNet Cyber Defense Systems
            </span>
            <span style={{ color: 'var(--ghost-text-dim)' }}>
              Effective Date: September 26, 2026 | Version 2.4 (DPDP Act 2023 Compliant)
            </span>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Verified Compliant
          </span>
        </div>

        {/* Section 1: Overview */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
            1. Data Minimization & Collection Principles
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            GhostNet.ai operates under strict data minimization principles. We only collect and process personal data that is strictly necessary to deliver multi-modal cybersecurity inspection services, user authentication, and community threat telemetry.
          </p>
          <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--ghost-text-dim)' }}>
            <li><strong className="text-slate-900 dark:text-slate-100">Account Credentials:</strong> Email address and password hash for user authentication via Supabase Auth.</li>
            <li><strong className="text-slate-900 dark:text-slate-100">Inspection Telemetry:</strong> User-submitted text messages, URLs, screenshots, and audio samples evaluated transiently by our serverless threat engines.</li>
            <li><strong className="text-slate-900 dark:text-slate-100">Functional Storage:</strong> Theme selection, active layout configurations, and cookie consent preferences stored locally in your browser’s `localStorage`.</li>
          </ul>
        </section>

        {/* Section 2: India DPDP Act 2023 Disclosures */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
            2. Compliance with India’s Digital Personal Data Protection (DPDP) Act 2023
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            Under the provisions of India’s Digital Personal Data Protection Act 2023, GhostNet.ai acts as a <strong>Data Fiduciary</strong>. Data Principal rights guaranteed under Section 6 through Section 13 include:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl border space-y-1" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
              <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--ghost-text)' }}>
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Right to Access & Summary
              </span>
              <p style={{ color: 'var(--ghost-text-dim)' }}>Request a clear summary of personal data being processed and identity of data processors.</p>
            </div>
            <div className="p-3 rounded-xl border space-y-1" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
              <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--ghost-text)' }}>
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" /> Right to Erasure / Instant Wipe
              </span>
              <p style={{ color: 'var(--ghost-text-dim)' }}>Instantly purge all historical scan logs via our self-service Privacy Center.</p>
            </div>
            <div className="p-3 rounded-xl border space-y-1" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
              <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--ghost-text)' }}>
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Right to Grievance Redressal
              </span>
              <p style={{ color: 'var(--ghost-text-dim)' }}>Direct access to our dedicated Data Protection Officer (DPO) for dispute resolution.</p>
            </div>
            <div className="p-3 rounded-xl border space-y-1" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
              <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--ghost-text)' }}>
                <Lock className="w-3.5 h-3.5 text-purple-500" /> Right to Nominate
              </span>
              <p style={{ color: 'var(--ghost-text-dim)' }}>Nominate an individual to exercise rights in the event of incapacity.</p>
            </div>
          </div>
        </section>

        {/* Section 3: Data Protection of Children */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            3. Data Protection of Children & Minors
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            In accordance with DPDP Act Section 9, GhostNet.ai does not knowingly track, profile, or process personal data of minors under 18 years of age without verifiable parental or guardian consent. If you suspect minor data has been submitted, notify `dpo@ghostnet.ai` for immediate deletion.
          </p>
        </section>

        {/* Section 4: Data Processors & Infrastructure */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            4. Infrastructure & Third-Party Processors
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            We utilize secure, audited sub-processors bound by strict confidentiality and data protection agreements:
          </p>
          <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--ghost-text-dim)' }}>
            <li><strong>Supabase Inc.</strong> — Managed PostgreSQL database with Row-Level Security (RLS) enforcement.</li>
            <li><strong>Vercel Inc.</strong> — Ephemeral serverless execution environment for scan requests.</li>
            <li><strong>Google Cloud (Gemini Vision & LLM APIs)</strong> — Transient multimodal evaluation without persistent model training on user payloads.</li>
          </ul>
        </section>

        {/* Section 5: Grievance Officer & Legal Contact */}
        <section className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
            <Mail className="w-4 h-4" /> Data Protection & Grievance Redressal Officer
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            Under Section 13 of the DPDP Act 2023, for any privacy inquiries, consent revocations, or grievance redressal, contact our designated Data Protection Officer:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-cyan-500" />
              <span>GhostNet Cyber Defense Systems</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-cyan-500" />
              <span>dpo@ghostnet.ai / privacy@ghostnet.ai</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-500" />
              <span>Outer Ring Road, Bengaluru, KA 560103, India</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
