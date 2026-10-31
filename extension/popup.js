const DEFAULT_API_BASE = "https://trust-break-ai.vercel.app";
const REQUEST_TIMEOUT_MS = 20000;

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

function setErrorState(riskBadge, scoreVal, analysisText, reasonsList, resultBox, message) {
  riskBadge.textContent = "ERROR";
  riskBadge.style.color = "#ef4444";
  scoreVal.textContent = "--";
  scoreVal.className = "score-val";
  analysisText.textContent = message;
  reasonsList.innerHTML = "";
  resultBox.classList.add("show");
}

document.addEventListener("DOMContentLoaded", async () => {
  const scanInput = document.getElementById("scanInput");
  const scanBtn = document.getElementById("scanBtn");
  const resultBox = document.getElementById("resultBox");
  const riskBadge = document.getElementById("riskBadge");
  const scoreVal = document.getElementById("scoreVal");
  const analysisText = document.getElementById("analysisText");
  const reasonsList = document.getElementById("reasonsList");

  // Pre-fill with current tab URL if available
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
      scanInput.value = tab.url;
    }
  } catch {
    // Ignore error
  }

  scanBtn.addEventListener("click", async () => {
    const text = scanInput.value.trim();
    if (!text) return;

    scanBtn.disabled = true;
    scanBtn.textContent = "Analyzing Threat...";
    resultBox.classList.remove("show");

    const isUrl = /^https?:\/\//i.test(text);
    const type = isUrl ? "link" : "message";
    const payload = isUrl ? { url: text } : { message: text };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const apiBase = await getApiBase();
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
      const risk = data.risk_level || (score >= 70 ? "scam" : score >= 35 ? "suspicious" : "safe");

      scoreVal.textContent = `${score}/100`;
      scoreVal.className = `score-val score-${risk}`;

      riskBadge.textContent = `${String(risk).toUpperCase()} RISK`;
      riskBadge.style.color =
        risk === "scam" ? "#ef4444" : risk === "suspicious" ? "#f59e0b" : "#10b981";

      analysisText.textContent =
        data.explanation || data.analysis || data.ai_analysis || "Threat analysis complete.";

      reasonsList.innerHTML = "";
      const reasons = Array.isArray(data.reasons) ? data.reasons : [];
      for (const reason of reasons.slice(0, 3)) {
        const li = document.createElement("li");
        li.textContent = String(reason);
        reasonsList.appendChild(li);
      }

      resultBox.classList.add("show");
    } catch (err) {
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
