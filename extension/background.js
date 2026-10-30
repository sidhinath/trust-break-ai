/**
 * GhostNet AI — Chrome Extension Service Worker (MV3)
 * Real-time background URL threat scanner and pre-click interceptor.
 */

const DEFAULT_API_BASE = "https://ghost-net-zeta.vercel.app";
const urlScanCache = new Map(); // url -> scan result

async function getApiBase() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["apiBaseUrl"], (result) => {
      resolve(result.apiBaseUrl || DEFAULT_API_BASE);
    });
  });
}

// ---------------------------------------------------------------------------
// Real-time Navigation Inspection (Feature 7)
// ---------------------------------------------------------------------------
chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Only inspect top-level frame navigations
  if (details.frameId !== 0) return;

  const url = details.url;
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return;

  // Skip local and internal URLs
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") return;
  } catch {
    return;
  }

  // Check cache
  if (urlScanCache.has(url)) {
    const cached = urlScanCache.get(url);
    if (cached.fraud_score >= 70) {
      notifyTab(details.tabId, cached);
    }
    return;
  }

  try {
    const apiBase = await getApiBase();
    const resp = await fetch(`${apiBase}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "link",
        payload: { url },
      }),
    });

    if (!resp.ok) return;

    const data = await resp.json();
    urlScanCache.set(url, data);

    if (data.fraud_score >= 70 || data.risk_level === "scam") {
      notifyTab(details.tabId, data);
    }
  } catch (err) {
    console.warn("[GhostNet Ext] Navigation check skipped:", err.message);
  }
});

function notifyTab(tabId, threatData) {
  chrome.tabs.sendMessage(tabId, {
    action: "GHOSTNET_SHOW_OVERLAY",
    threat: threatData,
  }).catch(() => {
    // Tab might not be ready or script injected yet; ignore error
  });
}

// ---------------------------------------------------------------------------
// Pre-Click Declarative Net Request Interceptor (Feature 8, flag-gated)
// ---------------------------------------------------------------------------
async function syncPreClickBlocklist() {
  try {
    const apiBase = await getApiBase();
    const resp = await fetch(`${apiBase}/api/blocklist-lite`);
    if (!resp.ok) {
      console.log("[GhostNet Ext] Pre-click blocklist not enabled on server or empty.");
      return;
    }

    const text = await resp.text();
    const domains = text
      .split("\n")
      .map((d) => d.trim().toLowerCase())
      .filter((d) => d && !d.startsWith("#"));

    if (domains.length === 0) return;

    // Build dynamic rules (cap at 4500 to stay well within Chrome 5000 dynamic rule limit)
    const capped = domains.slice(0, 4500);
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map((r) => r.id);

    const warningPageUrl = chrome.runtime.getURL("warning.html");

    const addRules = capped.map((domain, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          regexSubstitution: `${warningPageUrl}?blocked_domain=${encodeURIComponent(domain)}&target=\\0`,
        },
      },
      condition: {
        regexFilter: `^https?:\\/\\/([^\\/]+\\.)?${domain.replace(/\./g, "\\.")}(\\/|$)`,
        resourceTypes: ["main_frame"],
      },
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });

    console.log(`[GhostNet Ext] Successfully updated ${addRules.length} pre-click block rules.`);
  } catch (err) {
    console.warn("[GhostNet Ext] Failed to sync blocklist-lite rules:", err.message);
  }
}

// Initial sync and periodic check
chrome.runtime.onInstalled.addListener(() => {
  syncPreClickBlocklist();
});

// Periodic alarm every 30 minutes
chrome.alarms.create("syncBlocklistAlarm", { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncBlocklistAlarm") {
    syncPreClickBlocklist();
  }
});
