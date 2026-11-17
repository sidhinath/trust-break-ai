const DEFAULT_API_BASE = "https://trust-break-ai.vercel.app";
const REQUEST_TIMEOUT_MS = 20000;

// Mirrors RISK_BANDS in src/lib/scanner.js — keep these in sync.
// Safe 0–25 · Medium 26–60 · High 61–100
const RISK_BANDS = { safeMax: 25, mediumMax: 60 };

function normalizeApiBase(value) {
  return String(value || DEFAULT_API_BASE).replace(/\/+$/, "");
}

async function getApiBase() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["apiBaseUrl"], (result) => {
      resolve(normalizeApiBase(result.apiBaseUrl));
    });
  });
}

function bandFor(score) {
  if (score > RISK_BANDS.mediumMax) return "high";
  if (score > RISK_BANDS.safeMax) return "medium";
  return "safe";
}

const BAND_LABEL = { safe: "SAFE RISK", medium: "MEDIUM RISK", high: "HIGH RISK" };
const BAND_CLASS = { safe: "score-safe", medium: "score-suspicious", high: "score-scam" };

function readTabContext(tabId) {
  return new Promise((resolve) => {
    if (typeof tabId !== "number") {
      resolve({ title: "", text: "" });
      return;
    }
    try {
      chrome.tabs.sendMessage(tabId, { action: "TRUSTBREAK_GET_PAGE_CONTEXT" }, (context) => {
        if (chrome.runtime.lastError || !context || !context.ok) {
          resolve({ title: "", text: "" });
          return;
        }
        resolve({ title: context.title || "", text: context.text || "" });
      });
    } catch {
      resolve({ title: "", text: "" });
    }
  });
}

function setErrorState(riskBadge, scoreVal, analysisText, reasonsList, resultBox, message) {
  riskBadge.textContent = "ERROR";
  riskBadge.style.color = "#ef4444";
  scoreVal.textContent = "--";
  scoreVal.className = "score-val";
  analysisText.textContent = message;
  reasonsList.innerHTML = "";
  resultBox.classList.add("show");
}

function renderDebug(debugBox, data, engine, degraded, score) {
  if (!debugBox) return;
  const lines = [];

  lines.push(`Engine: ${engine}${degraded ? " (degraded)" : ""}`);
  lines.push(`Score: ${score}/100 → band ${bandFor(score)} (safe 0-25 / medium 26-60 / high 61-100)`);

  if (data.degraded_reason) lines.push(`Degraded reason: ${data.degraded_reason}`);
  if (data.security_test_page) lines.push(`Security test page: ${data.security_test_page}`);
  if (data.page_context_used !== undefined) lines.push(`Page context used: ${data.page_context_used}`);

  const ai = data.ai_diagnostics;
  if (ai) {
    lines.push(`AI key: ${ai.keySource || "none"}${ai.keyReason ? ` — ${ai.keyReason}` : ""}`);
    lines.push(`AI status: ${ai.status || "unknown"}`);
    const attempts = Array.isArray(ai.attempts) ? ai.attempts : [];
    if (attempts.length === 0) lines.push("  (no model call was made)");
    for (const attempt of attempts) {
      const parts = [`  ${attempt.model}`];
      if (attempt.status) parts.push(`HTTP ${attempt.status}`);
      parts.push(attempt.ok ? "ok" : "failed");
      if (attempt.durationMs !== undefined) parts.push(`${attempt.durationMs}ms`);
      if (attempt.error) parts.push(`— ${String(attempt.error).slice(0, 140)}`);
      lines.push(parts.join(" · "));
    }
  } else {
    lines.push("AI diagnostics: not reported by the server (older deployment?)");
  }

  const breakdown = Array.isArray(data.score_breakdown) ? data.score_breakdown : [];
  if (breakdown.length > 0) {
    lines.push("Score breakdown:");
    for (const entry of breakdown) {
      const delta = Number(entry.delta) || 0;
      lines.push(`  ${delta >= 0 ? "+" : ""}${delta}  ${entry.signal} → ${entry.score}`);
    }
  }

  debugBox.textContent = lines.join("\n");
  debugBox.classList.add("show");
}

document.addEventListener("DOMContentLoaded", async () => {
  const scanInput = document.getElementById("scanInput");
  const scanBtn = document.getElementById("scanBtn");
  const resultBox = document.getElementById("resultBox");
  const riskBadge = document.getElementById("riskBadge");
  const scoreVal = document.getElementById("scoreVal");
  const analysisText = document.getElementById("analysisText");
  const reasonsList = document.getElementById("reasonsList");
  const debugBox = document.getElementById("debugBox");

  let activeTab = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tab || null;
    if (tab && tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
      scanInput.value = tab.url;
    }
  } catch {
    // Tab access is best-effort.
  }

  scanBtn.addEventListener("click", async () => {
    const text = scanInput.value.trim();
    if (!text) return;

    scanBtn.disabled = true;
    scanBtn.textContent = "Analyzing Threat...";
    resultBox.classList.remove("show");
    if (debugBox) {
      debugBox.textContent = "";
      debugBox.classList.remove("show");
    }

    const isUrl = /^https?:\/\//i.test(text);
    const type = isUrl ? "link" : "message";
    const payload = isUrl ? { url: text, debug: true } : { message: text, debug: true };

    // Attach the live page title + visible text when available. This is what
    // lets the scanner score phishing cues inside the page itself.
    if (isUrl) {
      let pageContext = { title: "", text: "" };
      if (activeTab && activeTab.id !== undefined) {
        pageContext = await readTabContext(activeTab.id);
      }
      if (!pageContext.title && activeTab?.title) pageContext.title = activeTab.title;
      if (pageContext.title) payload.title = pageContext.title;
      if (pageContext.text) payload.page_text = pageContext.text;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const apiBase = await getApiBase();
      console.log("[TrustBreak AI Popup] POST /api/analyze", {
        apiBase,
        type,
        hasTitle: Boolean(payload.title),
        pageTextChars: payload.page_text ? payload.page_text.length : 0,
      });

      const resp = await fetch(`${apiBase}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        throw new Error(`Analysis failed with status ${resp.status}`);
      }

      const data = await resp.json();
      const numericScore = Number(data.fraud_score);
      const score = Number.isFinite(numericScore) ? Math.max(0, Math.min(100, Math.round(numericScore))) : 0;
      const band = bandFor(score);

      scoreVal.textContent = `${score}/100`;
      scoreVal.className = `score-val ${BAND_CLASS[band]}`;

      riskBadge.textContent = BAND_LABEL[band];
      riskBadge.style.color =
        band === "high" ? "#ef4444" : band === "medium" ? "#f59e0b" : "#10b981";

      const engine = data.engine || data.source || "unknown";
      const degraded =
        data.degraded === true || engine === "offline-heuristic" || engine === "heuristic";

      const explanation =
        data.explanation || data.analysis || data.ai_analysis || "Threat analysis complete.";
      analysisText.textContent = degraded
        ? `AI unavailable, using fallback heuristics. ${explanation}`
        : explanation;

      reasonsList.innerHTML = "";
      const engineItem = document.createElement("li");
      engineItem.textContent = `Engine: ${engine}${degraded ? " (degraded)" : ""}`;
      engineItem.style.color = degraded ? "#f59e0b" : "#64748b";
      reasonsList.appendChild(engineItem);

      const reasons = Array.isArray(data.reasons) ? data.reasons : [];
      for (const reason of reasons.slice(0, 4)) {
        const li = document.createElement("li");
        li.textContent = String(reason);
        reasonsList.appendChild(li);
      }

      resultBox.classList.add("show");
      renderDebug(debugBox, data, engine, degraded, score);

      console.log("[TrustBreak AI Popup] Verdict", {
        score,
        band,
        riskLevel: data.risk_level,
        engine,
        degraded,
        degradedReason: data.degraded_reason || null,
        securityTestPage: data.security_test_page || null,
        scoreBreakdown: data.score_breakdown || [],
        aiDiagnostics: data.ai_diagnostics || null,
      });
    } catch (err) {
      console.error("[TrustBreak AI Popup] Analysis error", err);
      const message =
        err.name === "AbortError"
          ? "Analysis timed out. Check your connection and try again."
          : `Analysis error: ${err.message}`;
      setErrorState(riskBadge, scoreVal, analysisText, reasonsList, resultBox, message);
    } finally {
      clearTimeout(timeout);
      scanBtn.disabled = false;
      scanBtn.textContent = "Inspect Threat";
    }
  });
});
