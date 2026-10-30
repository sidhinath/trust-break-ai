import React from "react";
import { CreditCard, RefreshCw, ShieldCheck, Mail } from "lucide-react";
import ScannerHeader from "../components/scanner/ScannerHeader";

export default function RefundPolicy() {
  return (
    <div className="space-y-6">
      <ScannerHeader
        icon={CreditCard}
        title="Refund & Subscription Cancellation Policy"
        description="Transparent refund terms, 14-day money-back guarantee for Enterprise API tiers, and self-service cancellation rules"
        color="#3b82f6"
      />

      <div className="ghost-card p-6 sm:p-8 space-y-6 text-xs leading-relaxed" style={{ color: 'var(--ghost-text)' }}>
        
        {/* Effective Date & Entity Header */}
        <div className="p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
          <div>
            <span className="font-bold text-sm block" style={{ color: 'var(--ghost-text)' }}>
              Consumer Guarantee & Subscription Terms
            </span>
            <span style={{ color: 'var(--ghost-text-dim)' }}>
              Effective Date: September 26, 2026 | Version 1.2
            </span>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            Fair Play Guarantee
          </span>
        </div>

        {/* Section 1: Free Tier & Hackathon Scope */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            1. Free Tier & Evaluation Plan
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            GhostNet.ai provides a 100% free community tier for individual consumers, senior citizens, and hackathon evaluation. No credit card is required, and zero charges will ever be applied to free evaluation accounts.
          </p>
        </section>

        {/* Section 2: Pro & Enterprise API Tiers */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            2. 14-Day Money-Back Guarantee for Paid API & Enterprise Tiers
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            For commercial organizations and enterprise developers subscribing to GhostNet Pro or Enterprise API credit allocations:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
              <span className="font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <RefreshCw className="w-4 h-4 text-blue-500" /> 14-Day Full Refund Window
              </span>
              <p style={{ color: 'var(--ghost-text-dim)' }}>
                If you are dissatisfied with GhostNet API accuracy or integration performance within 14 calendar days of your initial purchase, you are eligible for a 100% full refund with no questions asked.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
              <span className="font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-4 h-4 text-blue-500" /> Pro-Rata Unused Credit Refunds
              </span>
              <p style={{ color: 'var(--ghost-text-dim)' }}>
                After 14 days, cancellation of annual enterprise agreements entitles you to a pro-rata refund for all unused API credit balances remaining in your billing cycle.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Instant Cancellation */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            3. Self-Service Cancellation
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            Subscriptions can be canceled at any time via your account billing dashboard. Upon cancellation, your paid plan features will remain active until the conclusion of the current billing cycle.
          </p>
        </section>

        {/* Section 4: Refund Process & Contact */}
        <section className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <Mail className="w-4 h-4" /> How to Request a Refund
          </h2>
          <p style={{ color: 'var(--ghost-text-dim)' }}>
            To initiate a refund request, email our billing support team with your account email address and transaction reference:
          </p>
          <div className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
            Email: billing@ghostnet.ai / support@ghostnet.ai
          </div>
          <p className="text-[11px]" style={{ color: 'var(--ghost-text-dim)' }}>
            Refund requests are processed within 2 to 5 business days to the original payment method (UPI, Netbanking, Credit Card, or Wire Transfer).
          </p>
        </section>

      </div>
    </div>
  );
}
