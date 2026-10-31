/**
 * TrustBreak AI — Chrome Extension Service Worker (MV3)
 * Real-time background URL threat scanner and pre-click interceptor.
 */

const DEFAULT_API_BASE = "https://trust-break-ai.vercel.app";
const SHOW_OVERLAY_ACTION = "TRUSTBREAK_SHOW_OVERLAY";
const ALLOW_ONCE_ACTION = "TRUSTBREAK_ALLOW_ONCE";
const BYPASS_RULE_ID = 9001;
const MAX_CACHE_ENTRIES = 500;
const MAX_BLOCKLIST_RULES = 4500;
const urlScanCache = new Map(); // url -> scan result
const pendingBypass = new Set(); // hostnames allowed once by the user

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

function cacheScanResult(url, data) {
  if (urlScanCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = urlScanCache.keys().next().value;
    if (oldestKey) urlScanCache.delete(oldestKey);
  }
  urlScanCache.set(url, data);
}

function isScannableUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") return null;
    return parsed;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Real-time Navigation Inspection (Feature 7)
// ---------------------------------------------------------------------------
chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Only inspect top-level frame navigations
  if (details.frameId !== 0) return;

  const parsed = isScannableUrl(details.url);
  if (!parsed) return;

  // The user explicitly chose to continue to this domain from the warning page.
  if (pendingBypass.has(parsed.hostname)) {
    pendingBypass.delete(parsed.hostname);
    clearBypassRule().catch(() => {});
  }

  // Check cache
  if (urlScanCache.has(details.url)) {
    const cached = urlScanCache.get(details.url);
    if (cached.fraud_score >= 70 || cached.risk_level === "scam") {
      sendOverlayWithRetry(details.tabId, cached);
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
        payload: { url: details.url },
      }),
    });

    if (!resp.ok) return;

    const data = await resp.json();
    cacheScanResult(details.url, data);

    if (data.fraud_score >= 70 || data.risk_level === "scam") {
      sendOverlayWithRetry(details.tabId, data);
    }
  } catch (err) {
    console.warn("[TrustBreak AI Ext] Navigation check skipped:", err.message);
  }
});

// The content script can be injected after a fast navigation commits, so retry
// briefly instead of silently dropping the warning.
async function sendOverlayWithRetry(tabId, threatData) {
  for (const delayMs of [0, 700, 1600]) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: SHOW_OVERLAY_ACTION,
        threat: threatData,
      });
      return;
    } catch {
      // Tab may still be loading or the content script is not ready yet.
    }
  }
}

// ---------------------------------------------------------------------------
// Pre-Click Declarative Net Request Interceptor (Feature 8, flag-gated)
// ---------------------------------------------------------------------------
async function syncPreClickBlocklist() {
  try {
    const apiBase = await getApiBase();
    const resp = await fetch(`${apiBase}/api/blocklist-lite`, { cache: "no-store" });

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules
      .filter((rule) => rule.id !== BYPASS_RULE_ID)
      .map((rule) => rule.id);

    if (!resp.ok) {
      // The endpoint is flag-gated; clear stale rules when it is disabled.
      if (removeRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds });
      }
      console.log("[TrustBreak AI Ext] Pre-click blocklist not enabled on server or empty.");
      return;
    }

    const text = await resp.text();
    const domains = text
      .split("\n")
      .map((domain) => domain.trim().toLowerCase())
      .filter((domain) => domain && !domain.startsWith("#"));

    if (domains.length === 0) {
      if (removeRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds });
      }
      return;
    }

    // Build dynamic rules (cap at 4500 to stay within Chrome's 5000 dynamic rule limit)
    const capped = domains.slice(0, MAX_BLOCKLIST_RULES);
    const warningPageUrl = chrome.runtime.getURL("warning.html");

    const addRules = capped.map((domain, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          // \0 is the full matched URL; the warning page reads it back verbatim.
          regexSubstitution: `${warningPageUrl}?target=\\0`,
        },
      },
      condition: {
        regexFilter: `^https?:\\/\\/([^\\/]+\\.)?${domain.replace(/\./g, "\\.")}(\\/.*)?$`,
        resourceTypes: ["main_frame"],
      },
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });

    console.log(`[TrustBreak AI Ext] Successfully updated ${addRules.length} pre-click block rules.`);
  } catch (err) {
    console.warn("[TrustBreak AI Ext] Failed to sync blocklist-lite rules:", err.message);
  }
}

// ---------------------------------------------------------------------------
// One-time bypass requested from warning.html
// ---------------------------------------------------------------------------
async function allowOnce(targetUrl) {
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [BYPASS_RULE_ID],
    addRules: [
      {
        id: BYPASS_RULE_ID,
        priority: 100,
        action: { type: "allow" },
        condition: {
          requestDomains: [parsed.hostname],
          resourceTypes: ["main_frame"],
        },
      },
    ],
  });

  pendingBypass.add(parsed.hostname);
  chrome.alarms.create("trustbreakBypassExpiry", { delayInMinutes: 1 });
  return true;
}

async function clearBypassRule() {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [BYPASS_RULE_ID],
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === ALLOW_ONCE_ACTION && typeof message.targetUrl === "string") {
    allowOnce(message.targetUrl)
      .then((ok) => sendResponse({ ok }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
  return false;
});

// Initial sync, browser startup sync, and periodic refresh
chrome.runtime.onInstalled.addListener(() => {
  syncPreClickBlocklist();
});

if (chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    syncPreClickBlocklist();
  });
}

chrome.alarms.create("syncBlocklistAlarm", { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncBlocklistAlarm") {
    syncPreClickBlocklist();
  }
  if (alarm.name === "trustbreakBypassExpiry") {
    clearBypassRule().catch(() => {});
  }
});
