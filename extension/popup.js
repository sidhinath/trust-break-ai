const DEFAULT_API_BASE = "https://ghost-net-zeta.vercel.app";

async function getApiBase() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["apiBaseUrl"], (result) => {
      resolve(result.apiBaseUrl || DEFAULT_API_BASE);
    });
  });
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

    try {
      const apiBase = await getApiBase();
      const resp = await fetch(`${apiBase}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload }),
      });

      if (!resp.ok) {
        throw new Error(`Analysis failed with status ${resp.status}`);
      }

      const data = await resp.json();
      const score = data.fraud_score || 0;
      const risk = data.risk_level || (score >= 70 ? "scam" : score >= 35 ? "suspicious" : "safe");

      scoreVal.textContent = `${score}/100`;
      scoreVal.className = `score-val score-${risk}`;

      riskBadge.textContent = `${risk.toUpperCase()} RISK`;
      riskBadge.style.color =
        risk === "scam" ? "#ef4444" : risk === "suspicious" ? "#f59e0b" : "#10b981";

      analysisText.textContent = data.analysis || data.ai_analysis || "Threat analysis complete.";

      reasonsList.innerHTML = "";
      const reasons = data.reasons || [];
      for (const r of reasons.slice(0, 3)) {
        const li = document.createElement("li");
        li.textContent = r;
        reasonsList.appendChild(li);
      }

      resultBox.classList.add("show");
    } catch (err) {
      alert("Analysis error: " + err.message);
    } finally {
      scanBtn.disabled = false;
      scanBtn.textContent = "Inspect Threat";
    }
  });
});
