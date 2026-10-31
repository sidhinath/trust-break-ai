/**
 * TrustBreak AI — Pre-Click Warning Page (MV3 CSP-safe external script)
 * Reads the blocked target, derives the domain, and requests a one-time bypass.
 */

(() => {
  const targetParam = "?target=";
  const rawSearch = window.location.search || "";
  const rawTarget = rawSearch.startsWith(targetParam)
    ? rawSearch.slice(targetParam.length)
    : "";

  function parseTarget(value) {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      return parsed;
    } catch {
      return null;
    }
  }

  const target = parseTarget(rawTarget);
  const domainBox = document.getElementById("domainBox");
  const bypassButton = document.getElementById("bypassBtn");
  const backButton = document.getElementById("backBtn");

  if (domainBox) {
    domainBox.textContent = target ? target.hostname : "Known Malicious Domain";
  }

  if (backButton) {
    backButton.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.close();
      }
    });
  }

  if (bypassButton) {
    bypassButton.addEventListener("click", () => {
      if (!target) {
        bypassButton.textContent = "Target URL unavailable";
        return;
      }

      bypassButton.disabled = true;
      bypassButton.textContent = "Preparing safe bypass...";

      chrome.runtime.sendMessage(
        { action: "TRUSTBREAK_ALLOW_ONCE", targetUrl: target.href },
        (response) => {
          if (chrome.runtime.lastError || !response || !response.ok) {
            bypassButton.disabled = false;
            bypassButton.textContent = "Proceed anyway (unsafe)";
            alert("TrustBreak AI could not prepare the bypass. Please try again.");
            return;
          }
          window.location.replace(target.href);
        }
      );
    });
  }
})();
