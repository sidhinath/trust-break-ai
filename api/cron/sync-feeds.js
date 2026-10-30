/**
 * GhostNet AI — Feature 3: Cron Feed Sync Endpoint
 *
 * Called by Vercel Cron every 6 hours.
 * Protected by CRON_SECRET bearer token.
 * Vercel cron schedule: every 6 hours (0 star/6 star star star)
 */
import { syncThreatFeeds } from "../../scripts/sync-threat-feeds.js"

export default async function handler(req, res) {
  // Validate cron secret - strictly require CRON_SECRET to be configured
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    res.status(401).json({ error: "CRON_SECRET is not configured on server" })
    return
  }

  const authHeader = req.headers?.authorization || ""
  const token = authHeader.replace(/^Bearer\s+/i, "")
  if (token !== cronSecret) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  try {
    const result = await syncThreatFeeds()
    res.status(200).json({ ok: true, ...result, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[cron/sync-feeds] Error:", err)
    res.status(500).json({ ok: false, error: err?.message || "Sync failed" })
  }
}
