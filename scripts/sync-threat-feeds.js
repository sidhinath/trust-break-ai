/**
 * GhostNet AI — Feature 3: Public Threat Feed Sync
 *
 * Fetches OpenPhish and URLhaus free public threat feeds, extracts hostnames,
 * SHA-256 hashes them, and upserts into the public_blocklist table.
 *
 * Usage: node scripts/sync-threat-feeds.js
 * Or called from api/cron/sync-feeds.js
 *
 * Required env vars:
 *   VITE_SUPABASE_URL or SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import crypto from "node:crypto"

const OPENPHISH_FEED_URL = "https://openphish.com/feed.txt"
const URLHAUS_FEED_URL = "https://urlhaus.abuse.ch/downloads/csv_recent/"
const MAX_ENTRIES_PER_SYNC = 5000
const BATCH_SIZE = 200

function hashDomain(domain) {
  return crypto.createHash("sha256").update(domain.toLowerCase().trim()).digest("hex")
}

function extractHostname(rawUrl) {
  try {
    const url = new URL(rawUrl.trim())
    return url.hostname.toLowerCase() || null
  } catch {
    return null
  }
}

async function fetchWithTimeout(url, ms = 15000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const resp = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    return resp
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

async function fetchOpenPhish() {
  try {
    console.log("[sync-feeds] Fetching OpenPhish feed...")
    const resp = await fetchWithTimeout(OPENPHISH_FEED_URL)
    if (!resp.ok) {
      console.warn(`[sync-feeds] OpenPhish returned ${resp.status} — skipping`)
      return []
    }
    const text = await resp.text()
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean)
    const domains = lines.map(extractHostname).filter(Boolean)
    console.log(`[sync-feeds] OpenPhish: ${domains.length} unique domains extracted`)
    return domains.map(d => ({ domain: d, source: "openphish" }))
  } catch (err) {
    console.warn("[sync-feeds] OpenPhish fetch failed:", err.message, "— skipping")
    return []
  }
}

async function fetchURLhaus() {
  try {
    console.log("[sync-feeds] Fetching URLhaus feed...")
    const resp = await fetchWithTimeout(URLHAUS_FEED_URL)
    if (!resp.ok) {
      console.warn(`[sync-feeds] URLhaus returned ${resp.status} — skipping`)
      return []
    }
    const text = await resp.text()
    const lines = text.split("\n")
    const domains = []
    for (const line of lines) {
      if (line.startsWith("#") || !line.trim()) continue
      // CSV format: id, dateadded, url, url_status, last_online, threat, tags, urlhaus_link, reporter
      const parts = line.split(",")
      const rawUrl = parts[2]?.replace(/"/g, "").trim()
      if (rawUrl) {
        const host = extractHostname(rawUrl)
        if (host) domains.push({ domain: host, source: "urlhaus" })
      }
    }
    console.log(`[sync-feeds] URLhaus: ${domains.length} unique domains extracted`)
    return domains
  } catch (err) {
    console.warn("[sync-feeds] URLhaus fetch failed:", err.message, "— skipping")
    return []
  }
}

async function upsertBatch(supabaseUrl, serviceKey, rows) {
  const resp = await fetch(`${supabaseUrl}/rest/v1/public_blocklist?on_conflict=domain_hash`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Supabase upsert failed: ${resp.status} ${text}`)
  }
  return rows.length
}

export async function syncThreatFeeds() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.warn("[sync-feeds] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — aborting sync")
    return { synced: 0, error: "Missing env vars" }
  }

  const [openPhishEntries, urlhausEntries] = await Promise.all([
    fetchOpenPhish(),
    fetchURLhaus(),
  ])

  // Deduplicate by domain across feeds, cap at MAX_ENTRIES_PER_SYNC
  const seen = new Set()
  const allRows = []
  for (const entry of [...openPhishEntries, ...urlhausEntries]) {
    if (seen.has(entry.domain)) continue
    seen.add(entry.domain)
    allRows.push({
      domain_hash: hashDomain(entry.domain),
      domain: entry.domain,
      source: entry.source,
      added_at: new Date().toISOString(),
    })
    if (allRows.length >= MAX_ENTRIES_PER_SYNC) break
  }

  if (allRows.length === 0) {
    console.log("[sync-feeds] No entries to sync")
    return { synced: 0 }
  }

  console.log(`[sync-feeds] Upserting ${allRows.length} entries in batches of ${BATCH_SIZE}...`)
  let totalSynced = 0
  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    const batch = allRows.slice(i, i + BATCH_SIZE)
    try {
      const n = await upsertBatch(supabaseUrl, serviceKey, batch)
      totalSynced += n
    } catch (err) {
      console.warn(`[sync-feeds] Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, err.message)
    }
  }

  console.log(`[sync-feeds] Done. Synced ${totalSynced} entries.`)
  return { synced: totalSynced }
}

export { extractHostname, hashDomain }

// Allow running directly
if (process.argv[1] && (process.argv[1].endsWith("sync-threat-feeds.js") || process.argv[1].includes("sync-threat-feeds"))) {
  syncThreatFeeds()
    .then(({ synced }) => {
      console.log(`[sync-feeds] Complete. ${synced} entries upserted.`)
      process.exit(0)
    })
    .catch(err => {
      console.error("[sync-feeds] Fatal error:", err)
      process.exit(1)
    })
}
