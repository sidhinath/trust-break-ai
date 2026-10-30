/**
 * GhostNet AI — Pre-Click Blocklist Lite Endpoint (Feature 8)
 * Returns plain-text list of high-confidence malicious domains for browser declarativeNetRequest rules.
 * Gated behind ENABLE_PRE_CLICK_INTERCEPTOR=true.
 */

export default async function handler(req, res) {
  // Security & CORS headers
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Content-Type", "text/plain; charset=utf-8")

  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }

  if (req.method !== "GET") {
    res.status(405).send("Method not allowed\n")
    return
  }

  const isEnabled = process.env.ENABLE_PRE_CLICK_INTERCEPTOR === "true"
  if (!isEnabled) {
    res.status(404).send("# Pre-click interceptor is disabled on this environment\n")
    return
  }

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    res.status(200).send("# No database connection configured\n")
    return
  }

  try {
    const resp = await fetch(
      `${url}/rest/v1/public_blocklist?select=domain&domain=not.is.null&limit=4500`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      }
    )

    if (!resp.ok) {
      res.status(200).send("# Database query failed\n")
      return
    }

    const data = await resp.json()
    const domains = (data || [])
      .map((row) => row.domain?.trim().toLowerCase())
      .filter(Boolean)

    res.status(200).send(domains.join("\n") + "\n")
  } catch (err) {
    console.warn("[blocklist-lite error]", err.message)
    res.status(200).send("# Transient fetch error\n")
  }
}
