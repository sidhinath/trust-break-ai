/**
 * TrustBreak AI — Chrome Extension Service Worker (MV3)
 * Real-time background URL threat scanner and pre-click interceptor.
 */

const DEFAULT_API_BASE = "https://trust-break-ai.vercel.app";
const SHOW_OVERLAY_ACTION = "TRUSTBREAK_SHOW_OVERLAY";
const ALLOW_ONCE_ACTION = "TRUSTBREAK_ALLOW_ONCE";
const SYNC_BLOCKLIST_ACTION = "TRUSTBREAK_SYNC_BLOCKLIST";
const BYPASS_RULE_ID = 9001;
const MAX_CACHE_ENTRIES = 500;
// Chrome permits at most 1000 regexFilter rules per ruleset type. Exceeding it
// makes updateDynamicRules() reject the entire batch, leaving zero protection.
const MAX_BLOCKLIST_RULES = 1000;
const SYNC_ALARM = "syncBlocklistAlarm";
const RETRY_ALARM = "trustbreakBlocklistRetry";
const BYPASS_ALARM = "trustbreakBypassExpiry";
const urlScanCache = new Map(); // url -> scan result
const pendingBypass = new Set(); // hostnames allowed once by the user

// Mirrors RISK_BANDS in src/lib/scanner.js — keep these in sync.
// Safe 0–25 · Medium 26–60 · High 61–100
const RISK_BANDS = { safeMax: 25, mediumMax: 60 };

function shouldWarn(result) {
  const score = Number(result?.fraud_score);
  if (Number.isFinite(score) && score > RISK_BANDS.mediumMax) return true;
  return result?.risk_level === "scam";
}

function riskLabel(result) {
  const score = Number(result?.fraud_score);
  if (Number.isFinite(score)) {
    if (score > RISK_BANDS.mediumMax) return "high";
    if (score > RISK_BANDS.safeMax) return "medium";
    return "safe";
  }
  return result?.risk_level || "unknown";
}

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

/**
 * Sends a URL (plus optional page title / text) to /api/analyze and logs the
 * full decision trail so a "safe" verdict can always be explained.
 */
async function scanUrl(targetUrl, context = {}) {
  const apiBase = await getApiBase();
  const startedAt = Date.now();
  const payload = { url: targetUrl, debug: true };

  if (context.title) payload.title = String(context.title).slice(0, 300);
  if (context.text) payload.page_text = String(context.text).slice(0, 4000);

  console.log("[TrustBreak AI Ext] Scanning", targetUrl, {
    hasTitle: Boolean(payload.title),
    hasPageText: Boolean(payload.page_text),
    textLength: payload.page_text ? payload.page_text.length : 0,
  });

  const resp = await fetch(`${apiBase}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "link", payload }),
  });

  if (!resp.ok) {
    console.warn(
      `[TrustBreak AI Ext] Scan failed (HTTP ${resp.status}) for ${targetUrl} after ${Date.now() - startedAt}ms`
    );
    return null;
  }

  const data = await resp.json();
  cacheScanResult(targetUrl, { ...data, hasContext: Boolean(context.text) });

  console.log("[TrustBreak AI Ext] Verdict", {
    url: targetUrl,
    score: data.fraud_score,
    band: riskLabel(data),
    engine: data.engine || data.source || "unknown",
    degraded: data.degraded === true,
    degradedReason: data.degraded_reason || null,
    securityTestPage: data.security_test_page || false,
    durationMs: Date.now() - startedAt,
    breakdown: data.score_breakdown || [],
    aiDiagnostics: data.ai_diagnostics || null,
  });

  return data;
}

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
  const cached = urlScanCache.get(details.url);
  if (cached) {
    if (shouldWarn(cached)) sendOverlayWithRetry(details.tabId, cached);
    else console.log("[TrustBreak AI Ext] Cached verdict", { url: details.url, score: cached.fraud_score });
    return;
  }

  try {
    let title = "";
    try {
      const tab = await chrome.tabs.get(details.tabId);
      title = tab?.title || "";
    } catch {
      // Title is optional context.
    }

    const data = await scanUrl(details.url, { title });
    if (data && shouldWarn(data)) {
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
// Pre-Click Declarative Net Request Interceptor (Feature 8)
// ---------------------------------------------------------------------------
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isValidDomain(domain) {
  if (domain.length < 4 || domain.length > 253) return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  return labels.every(
    (label) =>
      label.length >= 1 &&
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
  );
}

function parseBlocklist(text) {
  const domains = new Set();

  for (const line of String(text || "").split("\n")) {
    const domain = line.trim().toLowerCase();
    if (!domain || domain.startsWith("#")) continue;
    if (!isValidDomain(domain)) continue;
    domains.add(domain);
  }

  return [...domains].sort();
}

function recordSyncStatus(status) {
  try {
    chrome.storage.local.set({
      blocklistSync: { ...status, at: Date.now() },
    });
  } catch {
    // Diagnostics only; never block the sync.
  }
}

function scheduleBlocklistRetry(delayInMinutes) {
  chrome.alarms.create(RETRY_ALARM, { delayInMinutes });
}

async function removeBlockRules(ruleIds) {
  if (ruleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ruleIds });
  }
}

async function syncPreClickBlocklist(attempt = 0) {
  try {
    const apiBase = await getApiBase();
    const resp = await fetch(`${apiBase}/api/blocklist-lite`, { cache: "no-store" });

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules
      .filter((rule) => rule.id !== BYPASS_RULE_ID)
      .map((rule) => rule.id);

    // 404 means the operator disabled Feature 8: clear stale rules.
    if (resp.status === 404) {
      await removeBlockRules(removeRuleIds);
      chrome.alarms.clear(RETRY_ALARM);
      recordSyncStatus({ state: "disabled", domains: 0 });
      console.log("[TrustBreak AI Ext] Pre-click interceptor is disabled on the server.");
      return { ok: true, state: "disabled", domains: 0 };
    }

    // Transient server/database errors: keep the current rules and retry soon
    // instead of leaving users unprotected.
    if (!resp.ok) {
      scheduleBlocklistRetry(2);
      recordSyncStatus({ state: "error", status: resp.status, domains: existingRules.length });
      console.warn(`[TrustBreak AI Ext] Blocklist sync returned ${resp.status}; keeping existing rules.`);
      return { ok: false, state: "error", status: resp.status };
    }

    const text = await resp.text();
    const domains = parseBlocklist(text).slice(0, MAX_BLOCKLIST_RULES);

    // A successful but empty feed clears stale rules. The regular 30-minute
    // alarm will pick up new entries once the database is populated.
    if (domains.length === 0) {
      await removeBlockRules(removeRuleIds);
      chrome.alarms.clear(RETRY_ALARM);
      recordSyncStatus({ state: "empty", domains: 0 });
      console.log("[TrustBreak AI Ext] Pre-click blocklist is empty; no rules applied.");
      return { ok: true, state: "empty", domains: 0 };
    }

    const warningPageUrl = chrome.runtime.getURL("warning.html");

    const addRules = domains.map((domain, index) => ({
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
        regexFilter: `^https?:\\/\\/([^\\/]+\\.)?${escapeRegExp(domain)}(\\/.*)?$`,
        resourceTypes: ["main_frame"],
      },
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });

    chrome.alarms.clear(RETRY_ALARM);
    recordSyncStatus({ state: "active", domains: addRules.length });
    console.log(`[TrustBreak AI Ext] Successfully updated ${addRules.length} pre-click block rules.`);
    return { ok: true, state: "active", domains: addRules.length };
  } catch (err) {
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      return syncPreClickBlocklist(attempt + 1);
    }

    scheduleBlocklistRetry(2);
    recordSyncStatus({ state: "error", message: err?.message || "sync failed" });
    console.warn("[TrustBreak AI Ext] Failed to sync blocklist-lite rules:", err?.message);
    return { ok: false, state: "error", message: err?.message };
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
  chrome.alarms.create(BYPASS_ALARM, { delayInMinutes: 1 });
  return true;
}

async function clearBypassRule() {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [BYPASS_RULE_ID],
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === ALLOW_ONCE_ACTION && typeof message.targetUrl === "string") {
    allowOnce(message.targetUrl)
      .then((ok) => sendResponse({ ok }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  // The content script reports the page title + visible text after load. This
  // lets the scanner score page-content phishing cues, not just the URL.
  if (message?.action === "TRUSTBREAK_PAGE_CONTEXT" && typeof message.url === "string") {
    const tabId = sender?.tab?.id;
    (async () => {
      const parsed = isScannableUrl(message.url);
      if (!parsed) {
        sendResponse({ ok: false, error: "not-scannable" });
        return;
      }

      const cached = urlScanCache.get(message.url);
      if (cached?.hasContext) {
        sendResponse({ ok: true, cached: true, score: cached.fraud_score });
        return;
      }

      try {
        const data = await scanUrl(message.url, { title: message.title, text: message.text });
        if (data && shouldWarn(data) && typeof tabId === "number") {
          sendOverlayWithRetry(tabId, data);
        }
        sendResponse({
          ok: Boolean(data),
          score: data?.fraud_score,
          risk: data?.risk_level,
          band: data ? riskLabel(data) : "unknown",
        });
      } catch (err) {
        console.warn("[TrustBreak AI Ext] Page-context scan failed:", err?.message);
        sendResponse({ ok: false, error: err?.message || "scan-failed" });
      }
    })();
    return true;
  }

  if (message?.action === SYNC_BLOCKLIST_ACTION) {
    syncPreClickBlocklist()
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, state: "error", message: err?.message }));
    return true;
  }

  if (message?.action === "TRUSTBREAK_GET_STATUS") {
    Promise.all([
      chrome.declarativeNetRequest.getDynamicRules(),
      chrome.storage.local.get(["blocklistSync"]),
    ])
      .then(([rules, stored]) => {
        sendResponse({
          ok: true,
          rules: rules.filter((rule) => rule.id !== BYPASS_RULE_ID).length,
          sync: stored.blocklistSync || null,
        });
      })
      .catch(() => sendResponse({ ok: false, rules: 0, sync: null }));
    return true;
  }

  return false;
});

// Initial sync, browser startup sync, and periodic refresh.
function startBlocklistSync() {
  clearBypassRule().catch(() => {});
  syncPreClickBlocklist();
}

chrome.runtime.onInstalled.addListener(startBlocklistSync);

if (chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(startBlocklistSync);
}

// Keep a single periodic alarm. Re-creating it on every service-worker wake
// would continually postpone it.
chrome.alarms.get(SYNC_ALARM).then((alarm) => {
  if (!alarm) {
    chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 30, delayInMinutes: 1 });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM || alarm.name === RETRY_ALARM) {
    syncPreClickBlocklist();
  }
  if (alarm.name === BYPASS_ALARM) {
    clearBypassRule().catch(() => {});
  }
});
