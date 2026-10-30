import React, { useState } from "react";
import { 
  Building2, Zap, Cpu, CheckCircle2, 
  DollarSign, Layers, BarChart3, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BusinessModel() {
  const [activeTab, setActiveTab] = useState("pricing");
  const [billingCycle, setBillingCycle] = useState("monthly");

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display" style={{ color: 'var(--ghost-text)' }}>
            Business Model & Monetization
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--ghost-text-dim)' }}>
            Product-Led Growth (PLG) architecture, ultra-low infrastructure unit economics (~90.7% gross margin), and multi-tier B2C/B2B monetization engine.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="ghost-card p-4 space-y-1" style={{ background: 'var(--ghost-surface)' }}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ghost-text-dim)' }}>
            Blended COGS / Scan
            <Cpu className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">$0.000125</div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Groq LPU + On-device DSP</p>
        </div>

        <div className="ghost-card p-4 space-y-1" style={{ background: 'var(--ghost-surface)' }}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ghost-text-dim)' }}>
            Gross Margin
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">90.7%</div>
          <p className="text-[11px]" style={{ color: 'var(--ghost-text-dim)' }}>$4.53 net on $4.99 Pro tier</p>
        </div>

        <div className="ghost-card p-4 space-y-1" style={{ background: 'var(--ghost-surface)' }}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ghost-text-dim)' }}>
            B2B API Price
            <Zap className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black font-mono" style={{ color: 'var(--ghost-text)' }}>$0.005</div>
          <p className="text-[11px]" style={{ color: 'var(--ghost-text-dim)' }}>Per FinTech verification call</p>
        </div>

        <div className="ghost-card p-4 space-y-1" style={{ background: 'var(--ghost-surface)' }}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ghost-text-dim)' }}>
            Year 3 ARR Target
            <BarChart3 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">$13.4M</div>
          <p className="text-[11px]" style={{ color: 'var(--ghost-text-dim)' }}>3.2M registered active users</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1.5 ghost-card border" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
        <button
          onClick={() => setActiveTab("pricing")}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "pricing" 
              ? "bg-cyan-500 text-slate-950 font-black shadow-md" 
              : "hover:bg-slate-500/10"
          }`}
          style={{ color: activeTab === "pricing" ? undefined : 'var(--ghost-text-dim)' }}
        >
          <DollarSign className="w-4 h-4" /> Pricing & Subscription Tiers
        </button>
        <button
          onClick={() => setActiveTab("unit-economics")}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "unit-economics" 
              ? "bg-cyan-500 text-slate-950 font-black shadow-md" 
              : "hover:bg-slate-500/10"
          }`}
          style={{ color: activeTab === "unit-economics" ? undefined : 'var(--ghost-text-dim)' }}
        >
          <Cpu className="w-4 h-4" /> Unit Economics & COGS
        </button>
        <button
          onClick={() => setActiveTab("flywheel")}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "flywheel" 
              ? "bg-cyan-500 text-slate-950 font-black shadow-md" 
              : "hover:bg-slate-500/10"
          }`}
          style={{ color: activeTab === "flywheel" ? undefined : 'var(--ghost-text-dim)' }}
        >
          <Layers className="w-4 h-4" /> Growth Flywheel & Projections
        </button>
      </div>

      {/* Tab 1: Pricing */}
      {activeTab === "pricing" && (
        <div className="space-y-6">
          <div className="flex justify-center items-center gap-3">
            <span className="text-xs font-bold" style={{ color: billingCycle === "monthly" ? "var(--ghost-neon)" : "var(--ghost-text-dim)" }}>
              Monthly Billing
            </span>
            <button
              onClick={() => setBillingCycle(prev => prev === "monthly" ? "annual" : "monthly")}
              className="w-12 h-6 rounded-full border p-0.5 relative transition-colors"
              style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-cyan-500 transition-transform ${billingCycle === "annual" ? "translate-x-6" : "translate-x-0"}`} />
            </button>
            <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: billingCycle === "annual" ? "var(--ghost-neon)" : "var(--ghost-text-dim)" }}>
              Annual Billing <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Save 20%</span>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Free */}
            <div className="ghost-card p-5 flex flex-col justify-between space-y-4" style={{ background: 'var(--ghost-surface)' }}>
              <div className="space-y-3">
                <span className="badge-safe text-xs font-bold px-2.5 py-1 rounded-full inline-block">Community Shield</span>
                <h3 className="text-lg font-bold font-display" style={{ color: 'var(--ghost-text)' }}>GhostNet Free</h3>
                <p className="text-xs" style={{ color: 'var(--ghost-text-dim)' }}>Product-Led Growth top-of-funnel consumer shield.</p>
                <div className="py-2">
                  <span className="text-3xl font-extrabold font-mono" style={{ color: 'var(--ghost-text)' }}>$0</span>
                  <span className="text-xs" style={{ color: 'var(--ghost-text-dim)' }}> / forever</span>
                </div>
                <ul className="space-y-2 text-xs" style={{ color: 'var(--ghost-text-dim)' }}>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited Text & Link Inspections</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Manifest V3 Browser Shield</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Global Threat Intelligence Radar</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Deterministic Heuristic Engine</li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="w-full font-bold text-xs h-10 rounded-xl border"
                style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)', color: 'var(--ghost-text)' }}>
                Active Plan
              </Button>
            </div>

            {/* Pro */}
            <div className="ghost-card p-5 flex flex-col justify-between space-y-4 border-cyan-500/50 relative shadow-[0_0_25px_rgba(0,229,255,0.12)]" style={{ background: 'var(--ghost-surface)' }}>
              <div className="absolute -top-3 right-4 bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                Most Popular
              </div>
              <div className="space-y-3">
                <span className="badge-suspicious text-xs font-bold px-2.5 py-1 rounded-full inline-block">Individual Pro</span>
                <h3 className="text-lg font-bold font-display" style={{ color: 'var(--ghost-text)' }}>GhostNet Pro</h3>
                <p className="text-xs" style={{ color: 'var(--ghost-text-dim)' }}>Full multi-modal protection across all 5 vectors.</p>
                <div className="py-2">
                  <span className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 font-mono">
                    {billingCycle === "annual" ? "$4.08" : "$4.99"}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--ghost-text-dim)' }}> / month</span>
                </div>
                <ul className="space-y-2 text-xs" style={{ color: 'var(--ghost-text-dim)' }}>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" /> Everything in Free Tier</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" /> Voice Deepfake & Audio Analyzer</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" /> Real-Time Live Camera QR HUD</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" /> Gemini 2.5 Flash Vision Screenshot OCR</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" /> Sub-Second Groq LPU Inference</li>
                </ul>
              </div>
              <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold h-10 rounded-xl shadow-md">Upgrade to Pro</Button>
            </div>

            {/* Enterprise API */}
            <div className="ghost-card p-5 flex flex-col justify-between space-y-4" style={{ background: 'var(--ghost-surface)' }}>
              <div className="space-y-3">
                <span className="badge-scam text-xs font-bold px-2.5 py-1 rounded-full inline-block">B2B Fraud-as-a-Service</span>
                <h3 className="text-lg font-bold font-display" style={{ color: 'var(--ghost-text)' }}>FinTech & Enterprise API</h3>
                <p className="text-xs" style={{ color: 'var(--ghost-text-dim)' }}>Pre-transaction fraud scanning for banks & neobanks.</p>
                <div className="py-2">
                  <span className="text-3xl font-extrabold font-mono" style={{ color: 'var(--ghost-text)' }}>$0.005</span>
                  <span className="text-xs" style={{ color: 'var(--ghost-text-dim)' }}> / verification call</span>
                </div>
                <ul className="space-y-2 text-xs" style={{ color: 'var(--ghost-text-dim)' }}>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" /> Low-Latency Edge API (&lt;25ms)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" /> Pre-Payment Beneficiary Verification</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" /> Corporate Browser Shield Deployment</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" /> Custom Threat Telemetry Webhooks</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" /> 99.95% SLA & Dedicated Support</li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="w-full font-bold text-xs h-10 rounded-xl border"
                style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)', color: 'var(--ghost-text)' }}>
                Contact Enterprise Sales
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: COGS */}
      {activeTab === "unit-economics" && (
        <div className="ghost-card p-5 space-y-4" style={{ background: 'var(--ghost-surface)' }}>
          <h3 className="text-base font-bold font-display" style={{ color: 'var(--ghost-text)' }}>Cost of Goods Sold (COGS) Breakdown</h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--ghost-text-dim)' }}>
            By combining client-side digital signal processing (Web Audio API Wiener Flatness) with ultra-fast Groq LPUs, GhostNet achieves an industry-leading ~90.7% gross margin.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] font-bold uppercase tracking-wider border-b" style={{ borderColor: 'var(--ghost-border)', color: 'var(--ghost-text-dim)' }}>
                <tr>
                  <th className="py-2.5 px-3">Modality</th>
                  <th className="py-2.5 px-3">Primary Engine</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Average Latency</th>
                  <th className="py-2.5 px-3">Cost / 1,000 Scans</th>
                  <th className="py-2.5 px-3 text-right">Cost / Single Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--ghost-border)', color: 'var(--ghost-text-dim)' }}>
                <tr>
                  <td className="py-3 px-3 font-semibold" style={{ color: 'var(--ghost-text)' }}>SMS / Text Message</td>
                  <td className="py-3 px-3">Groq LPU (llama-3.3-70b)</td>
                  <td className="py-3 px-3">Groq Inc.</td>
                  <td className="py-3 px-3">620 ms</td>
                  <td className="py-3 px-3">$0.10</td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-600 dark:text-cyan-400 font-bold">$0.000100</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold" style={{ color: 'var(--ghost-text)' }}>URL / Typosquatting</td>
                  <td className="py-3 px-3">Client Entropy + Supabase DB</td>
                  <td className="py-3 px-3">Supabase Edge</td>
                  <td className="py-3 px-3">120 ms</td>
                  <td className="py-3 px-3">$0.02</td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-600 dark:text-cyan-400 font-bold">$0.000020</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold" style={{ color: 'var(--ghost-text)' }}>Screenshot OCR</td>
                  <td className="py-3 px-3">Gemini 2.5 Flash Vision</td>
                  <td className="py-3 px-3">Google Cloud</td>
                  <td className="py-3 px-3">950 ms</td>
                  <td className="py-3 px-3">$0.25</td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-600 dark:text-cyan-400 font-bold">$0.000250</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold" style={{ color: 'var(--ghost-text)' }}>Live Camera QR</td>
                  <td className="py-3 px-3">jsQR Canvas Decoder</td>
                  <td className="py-3 px-3">Client Device ($0)</td>
                  <td className="py-3 px-3">40 ms</td>
                  <td className="py-3 px-3">$0.02</td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-600 dark:text-cyan-400 font-bold">$0.000020</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold" style={{ color: 'var(--ghost-text)' }}>Voice Deepfake Audio</td>
                  <td className="py-3 px-3">Acoustic FFT + Groq Whisper</td>
                  <td className="py-3 px-3">Client DSP + Groq</td>
                  <td className="py-3 px-3">1100 ms</td>
                  <td className="py-3 px-3">$0.15</td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-600 dark:text-cyan-400 font-bold">$0.000150</td>
                </tr>
                <tr className="font-bold border-t" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)', color: 'var(--ghost-text)' }}>
                  <td className="py-3 px-3" colSpan={4}>Blended Average Cost per User Scan</td>
                  <td className="py-3 px-3">$0.125</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 text-sm">$0.000125</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Flywheel */}
      {activeTab === "flywheel" && (
        <div className="space-y-6">
          <div className="ghost-card p-5 space-y-4" style={{ background: 'var(--ghost-surface)' }}>
            <h3 className="text-base font-bold font-display" style={{ color: 'var(--ghost-text)' }}>Growth & Telemetry Flywheel</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ghost-text-dim)' }}>
              How consumer adoption generates real-time threat intelligence data, creating an unbeatable moat for enterprise B2B sales.
            </p>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border space-y-1" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block">Step 1</span>
                <h4 className="text-xs font-bold" style={{ color: 'var(--ghost-text)' }}>Viral Consumer PLG</h4>
                <p className="text-[11px]" style={{ color: 'var(--ghost-text-dim)' }}>Free scanner drives rapid adoption across SMS, web, and mobile.</p>
              </div>

              <div className="p-4 rounded-xl border space-y-1" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">Step 2</span>
                <h4 className="text-xs font-bold" style={{ color: 'var(--ghost-text)' }}>Crowd Telemetry</h4>
                <p className="text-[11px]" style={{ color: 'var(--ghost-text-dim)' }}>User scans generate SHA-256 indicator hashes in Supabase RLS.</p>
              </div>

              <div className="p-4 rounded-xl border space-y-1" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Step 3</span>
                <h4 className="text-xs font-bold" style={{ color: 'var(--ghost-text)' }}>Defensive Data Moat</h4>
                <p className="text-[11px]" style={{ color: 'var(--ghost-text-dim)' }}>Expanding active threat list improves accuracy for all users.</p>
              </div>

              <div className="p-4 rounded-xl border space-y-1" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Step 4</span>
                <h4 className="text-xs font-bold" style={{ color: 'var(--ghost-text)' }}>B2B API Conversion</h4>
                <p className="text-[11px]" style={{ color: 'var(--ghost-text-dim)' }}>FinTechs buy API access to scan transactions against our database.</p>
              </div>
            </div>
          </div>

          <div className="ghost-card p-5 space-y-3" style={{ background: 'var(--ghost-surface)' }}>
            <h3 className="text-base font-bold font-display" style={{ color: 'var(--ghost-text)' }}>3-Year Financial Projections</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] font-bold uppercase tracking-wider border-b" style={{ borderColor: 'var(--ghost-border)', color: 'var(--ghost-text-dim)' }}>
                  <tr>
                    <th className="py-2.5 px-3">Metric</th>
                    <th className="py-2.5 px-3">Year 1</th>
                    <th className="py-2.5 px-3">Year 2</th>
                    <th className="py-2.5 px-3 text-right">Year 3</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--ghost-border)', color: 'var(--ghost-text-dim)' }}>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--ghost-text)' }}>Registered Active Users</td>
                    <td className="py-2.5 px-3">120,000</td>
                    <td className="py-2.5 px-3">850,000</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: 'var(--ghost-text)' }}>3,200,000</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--ghost-text)' }}>B2C Pro Subscribers (4% conv.)</td>
                    <td className="py-2.5 px-3">4,800</td>
                    <td className="py-2.5 px-3">38,250</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: 'var(--ghost-text)' }}>160,000</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--ghost-text)' }}>B2C Subscription ARR</td>
                    <td className="py-2.5 px-3">$235,000</td>
                    <td className="py-2.5 px-3">$1,874,000</td>
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-600 dark:text-cyan-400">$7,840,000</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--ghost-text)' }}>B2B API & Enterprise ARR</td>
                    <td className="py-2.5 px-3">$180,000</td>
                    <td className="py-2.5 px-3">$1,250,000</td>
                    <td className="py-2.5 px-3 text-right font-bold text-sky-600 dark:text-sky-400">$5,600,000</td>
                  </tr>
                  <tr className="font-bold text-emerald-600 dark:text-emerald-400 border-t" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                    <td className="py-3 px-3">Total Annual Recurring Revenue (ARR)</td>
                    <td className="py-3 px-3">$415,000</td>
                    <td className="py-3 px-3">$3,124,000</td>
                    <td className="py-3 px-3 text-right font-mono text-sm">$13,440,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
