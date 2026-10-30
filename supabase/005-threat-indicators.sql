-- Feature 4: Community Threat Intelligence Indicators
-- GhostNet AI — Migration 005

CREATE TABLE IF NOT EXISTS threat_indicators (
  id bigserial PRIMARY KEY,
  indicator_hash text UNIQUE NOT NULL,
  indicator_type text NOT NULL CHECK (indicator_type IN ('message', 'link', 'screenshot', 'qr', 'voice')),
  risk_score integer NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  reason_codes text[] DEFAULT '{}'::text[],
  report_count integer DEFAULT 1,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  region text
);

CREATE INDEX IF NOT EXISTS idx_threat_indicators_hash ON threat_indicators(indicator_hash);
CREATE INDEX IF NOT EXISTS idx_threat_indicators_last_seen ON threat_indicators(last_seen);

ALTER TABLE threat_indicators ENABLE ROW LEVEL SECURITY;

-- Public can read (for heatmap aggregation from client)
DROP POLICY IF EXISTS "threat_indicators_anon_read" ON threat_indicators;
CREATE POLICY "threat_indicators_anon_read"
  ON threat_indicators FOR SELECT USING (true);

-- Only service role can write/update (anon inserts are rejected)
DROP POLICY IF EXISTS "threat_indicators_service_write" ON threat_indicators;
CREATE POLICY "threat_indicators_service_write"
  ON threat_indicators FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE threat_indicators IS 'Community threat intelligence: hashed indicators from high-risk scans. Updated server-side via service role only.';
