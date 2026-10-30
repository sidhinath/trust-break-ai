import React from "react";
import { Cpu, ShieldCheck, Zap, Layers, Sparkles } from "lucide-react";
import ScannerHeader from "../components/scanner/ScannerHeader";

const ARCHITECTURE_STEPS = [
  {
    layer: "Client Layer",
    title: "Cross-Platform React 18 + Capacitor 8",
    description: "Responsive web application & native Android package running with zero-latency hot module evaluation and offline caching.",
    color: "#00e5ff"
  },
  {
    layer: "API Gateway",
    title: "Vercel Edge Serverless Function (/api/analyze)",
    description: "Stateless security gateway enforcing secure CORS, request validation, rate-limiting, and server-side secret isolation.",
    color: "#a78bfa"
  },
  {
    layer: "Multi-Modal Routing",
    title: "Groq LPU + Google Gemini Vision + OpenAI",
    description: "Sub-second LPU inference for NLP/links (`openai/gpt-oss-120b`, `qwen3.8-27b`) paired with Gemini Vision multi-model fallback chain for screenshots.",
    color: "#f472b6"
  },
  {
    layer: "Heuristic Fallback",
    title: "Local Pattern & Social Engineering Engine",
    description: "Client/Server rule-based engine providing instant offline resilience and guaranteed uptime during quota exhaustion.",
    color: "#f59e0b"
  },
  {
    layer: "Data & Storage",
    title: "Supabase PostgreSQL + Storage + RLS",
    description: "Encrypted evidence storage and user isolation strictly enforced via PostgreSQL Row-Level Security policies.",
    color: "#10b981"
  }
];

const DIFFERENTIATION = [
  {
    title: "Threat Reconstruction™",
    description: "Unlike generic scam checkers that output a single percentage, GhostNet visually maps the attacker's step-by-step kill-chain.",
    icon: Sparkles
  },
  {
    title: "Multi-Modal Vision Inspection",
    description: "Reads, extracts OCR, and examines fake logos and payment QR codes from uploaded screenshots.",
    icon: Layers
  },
  {
    title: "Safe Threat Simulator Sandbox",
    description: "Allows users to safely learn 'What Happens If I Click?' without executing any dangerous code.",
    icon: ShieldCheck
  },
  {
    title: "Autonomous Multi-Model Fallbacks",
    description: "Seamless failover between Groq, Gemini Flash, OpenAI, and local heuristics ensures 99.9% uptime during hackathon traffic.",
    icon: Zap
  }
];

export default function Technology() {
  return (
    <div className="space-y-6">
      <ScannerHeader
        icon={Cpu}
        title="Technical Architecture & Defense Engine"
        description="Deep dive into GhostNet's multi-modal pipeline, serverless routing, and enterprise security architecture"
        color="#00e5ff"
      />

      {/* Architecture Stepper */}
      <div className="ghost-card p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--ghost-text-dim)' }}>
          <Layers className="w-4 h-4 text-cyan-500" /> End-to-End Processing Architecture
        </h3>

        <div className="space-y-3">
          {ARCHITECTURE_STEPS.map((step, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-md font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center justify-center border shrink-0 mt-0.5"
                  style={{ background: 'var(--ghost-surface-3)', borderColor: 'var(--ghost-border)' }}>
                  0{idx + 1}
                </span>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider block" style={{ color: step.color }}>
                    {step.layer}
                  </span>
                  <h4 className="text-sm font-bold mt-0.5" style={{ color: 'var(--ghost-text)' }}>{step.title}</h4>
                  <p className="text-xs mt-1 leading-relaxed max-w-xl" style={{ color: 'var(--ghost-text-dim)' }}>{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitive Differentiation */}
      <div className="ghost-card p-6 space-y-4 border-cyan-500/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ghost-text)' }}>
            Why GhostNet? Key Technical Differentiators
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DIFFERENTIATION.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="p-4 rounded-xl border space-y-2"
                style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-cyan-500" />
                  </div>
                  <h4 className="text-xs font-bold" style={{ color: 'var(--ghost-text)' }}>{item.title}</h4>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ghost-text-dim)' }}>{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
