/**
 * TrustBreak AI — Pre-Click Blocklist Lite Endpoint (Feature 8)
 * Returns a plain-text list of high-confidence malicious domains for browser
 * declarativeNetRequest rules.
 *
 * Enabled by default in production. Set ENABLE_PRE_CLICK_INTERCEPTOR=false to
 * disable it (kill switch).
 */

const MAX_DOMAINS = 4500
const REQUEST_TIMEOUT_MS = 10000

// A conservative hostname check. Accepts ASCII/punycode labels only, which is
// what OpenPhish, URLhaus, and Supabase store.
const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/

function isEnabled() {
  const raw = process.env.ENABLE_PRE_CLICK_INTERCEPTOR
  if (raw === undefined || raw === null || raw === "") return true
  return !["false", "0", "off", "no"].includes(String(raw).trim().toLowerCase())
}

function normalizeDomain(value) {
  let domain = String(value ?? "").trim().toLowerCase()
  if (!domain) return ""

  if (domain.includes("://")) {
    try {
      domain = new URL(domain).hostname
    } catch {
      return ""
    }
  }

  domain = domain.replace(/^\.+/, "").replace(/\.+$/, "")
  if (!HOSTNAME_PATTERN.test(domain)) return ""

  return domain
}

function normalizeDomains(rows) {
  const domains = new Set()

  for (const row of Array.isArray(rows) ? rows : []) {
    const raw = typeof row === "string" ? row : row?.domain
    const domain = normalizeDomain(raw)
    if (domain) domains.add(domain)
  }

  return [...domains].sort()
}

export default async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Content-Type", "text/plain; charset=utf-8")
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=600")

  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }

  if (req.method !== "GET") {
    res.status(405).send("Method not allowed\n")
    return
  }

  if (!isEnabled()) {
    res.status(404).send("# Pre-click interceptor is disabled on this environment\n")
    return
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    res.status(503).send("# Blocklist database is not configured\n")
    return
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const endpoint =
      `${String(url).replace(/\/+$/, "")}/rest/v1/public_blocklist` +
      `?select=domain&domain=not.is.null&order=domain.asc&limit=${MAX_DOMAINS}`

    const response = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
      cache: "no-store",
    })

    if (!response.ok) {
      console.warn(`[blocklist-lite] Supabase query failed with status ${response.status}`)
      res.status(503).send(`# Blocklist query failed (status ${response.status})\n`)
      return
    }

    const rows = await response.json()
    const domains = normalizeDomains(rows).slice(0, MAX_DOMAINS)

    res.setHeader("X-Blocklist-Count", String(domains.length))
    res.status(200).send(domains.length > 0 ? `${domains.join("\n")}\n` : "")
  } catch (err) {
    const message = err?.name === "AbortError" ? "request timed out" : err?.message || "unknown error"
    console.warn("[blocklist-lite] Fetch failed:", message)
    res.status(503).send("# Transient blocklist error\n")
  } finally {
    clearTimeout(timer)
  }
}
