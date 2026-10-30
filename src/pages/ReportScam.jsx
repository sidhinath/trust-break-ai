import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ScannerHeader from "../components/scanner/ScannerHeader";
import { createScamReport } from "@/lib/data";
import { analyzeReport } from "@/lib/api";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const REPORT_TYPES = [
  { value: "message", label: "Phishing SMS / WhatsApp Message" },
  { value: "link", label: "Malicious Phishing Website / URL" },
  { value: "phone", label: "Fraudulent Caller / Vishing Number" },
  { value: "screenshot", label: "Fake Payment / Screenshot Deception" },
  { value: "other", label: "Other Social Engineering Attack" },
];

export default function ReportScam() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    report_type: "message",
    scam_content: "",
    phone_number: "",
    url: "",
    region: "India",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreedConsent, setAgreedConsent] = useState(false);

  useEffect(() => {
    if (location.state?.prefill) {
      const p = location.state.prefill;
      setForm((prev) => ({
        ...prev,
        report_type: p.report_type || "message",
        scam_content: p.scam_content || "",
        url: p.url || "",
      }));
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.scam_content.trim() || !agreedConsent) return;

    setSubmitting(true);

    try {
      const ai = await analyzeReport(form);

      await createScamReport({
        report_type: form.report_type,
        scam_content: form.scam_content,
        phone_number: form.phone_number || null,
        url: form.url || null,
        region: form.region || "Global",
        fraud_score: ai?.fraud_score || 85,
        ai_analysis: ai?.ai_analysis || "Scam report verified and syndicated to community threat radar.",
        risk_level: ai?.risk_level || "scam",
        status: "verified",
      });
      queryClient.invalidateQueries({ queryKey: ['scamReports'] });

      setSuccess(true);
    } catch (err) {
      console.error("Report submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ScannerHeader
        icon={AlertTriangle}
        title="Scam Intelligence Report Center"
        description="Submit newly discovered phishing numbers, malicious URLs, or scam scripts to alert the global defense community"
        color="#f59e0b"
      />

      {success ? (
        <div className="ghost-card p-8 text-center space-y-4 border-emerald-500/30">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold" style={{ color: 'var(--ghost-text)' }}>Threat Reported Successfully</h3>
            <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--ghost-text-dim)' }}>
              Your report has been analyzed and syndicated to the GhostNet community threat intelligence database.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              onClick={() => {
                setSuccess(false);
                setForm({ report_type: "message", scam_content: "", phone_number: "", url: "", region: "India" });
              }}
              className="text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 h-9 rounded-lg">
              Submit Another Report
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("Home"))}
              className="text-xs font-bold px-4 h-9 rounded-lg">
              Return to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="ghost-card p-6 space-y-4">
          
          {/* Vector Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ghost-text-dim)' }}>
              Scam Vector Category
            </label>
            <Select
              value={form.report_type}
              onValueChange={(val) => setForm({ ...form, report_type: val })}>
              <SelectTrigger className="w-full" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)', color: 'var(--ghost-text)' }}>
                <SelectValue placeholder="Select vector category" />
              </SelectTrigger>
              <SelectContent style={{ background: 'var(--ghost-surface)', borderColor: 'var(--ghost-border)', color: 'var(--ghost-text)' }}>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scam Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ghost-text-dim)' }}>
              Scam Content & Details *
            </label>
            <div className="rounded-xl border focus-within:border-amber-500/50 transition-colors p-2"
              style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
              <Textarea
                required
                value={form.scam_content}
                onChange={(e) => setForm({ ...form, scam_content: e.target.value })}
                placeholder="Paste the scam message, script, caller claims, or payment demand..."
                className="min-h-[110px] bg-transparent border-0 resize-none text-sm font-medium focus-visible:ring-0 placeholder:text-slate-400"
                style={{ color: 'var(--ghost-text)' }}
              />
            </div>
          </div>

          {/* Optional Phone and URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--ghost-text-dim)' }}>
                <Phone className="w-3.5 h-3.5 text-amber-500" /> Fraudster Phone / Sender ID (Optional)
              </label>
              <Input
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                placeholder="+91 98765 43210 or VM-SBINB"
                className="text-xs h-10"
                style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)', color: 'var(--ghost-text)' }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--ghost-text-dim)' }}>
                <Globe className="w-3.5 h-3.5 text-cyan-400" /> Phishing URL (Optional)
              </label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://fake-login.xyz"
                className="text-xs h-10"
                style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)', color: 'var(--ghost-text)' }}
              />
            </div>
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ghost-text-dim)' }}>
              Target Geographic Region
            </label>
            <Input
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              placeholder="e.g. India, USA, UK, Global"
              className="text-xs h-10"
              style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)', color: 'var(--ghost-text)' }}
            />
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="scam-report-consent"
              checked={agreedConsent}
              onChange={(e) => setAgreedConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
            />
            <label htmlFor="scam-report-consent" className="text-xs font-medium cursor-pointer" style={{ color: 'var(--ghost-text-dim)' }}>
              I consent to submit this scam telemetry for automated threat analysis under the <a href="/PrivacyPolicy" className="text-amber-600 dark:text-amber-400 underline font-semibold">GhostNet Privacy Policy</a>.
            </label>
          </div>

          <Button
            type="submit"
            disabled={submitting || !form.scam_content.trim() || !agreedConsent}
            className="w-full h-12 rounded-xl font-bold text-slate-950 transition-all shadow-md bg-amber-500 hover:bg-amber-400 disabled:opacity-50">
            {submitting ? "Syndicating to Community Threat Intelligence..." : "Submit Scam Incident Report"}
          </Button>

        </form>
      )}
    </div>
  );
}
