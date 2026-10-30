-- GhostNet AI — Consolidated Production Migrations (004 & 005)
-- Project: ysvmcaeyffxzwyjwiyka

-- ============================================================
-- 1. Public Threat Feed Blocklist (Feature 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS public_blocklist (
  id bigserial PRIMARY KEY,
  domain_hash text UNIQUE NOT NULL,
  domain text,
  source text NOT NULL,
  added_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_blocklist_hash ON public_blocklist(domain_hash);

ALTER TABLE public_blocklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_blocklist_anon_read" ON public_blocklist;
CREATE POLICY "public_blocklist_anon_read"
  ON public_blocklist FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_blocklist_service_write" ON public_blocklist;
CREATE POLICY "public_blocklist_service_write"
  ON public_blocklist FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE public_blocklist IS 'Hashed domain blocklist populated from OpenPhish and URLhaus public threat feeds. Updated every 6 hours via cron.';

-- ============================================================
-- 2. Community Threat Intelligence Indicators (Feature 4)
-- ============================================================
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

DROP POLICY IF EXISTS "threat_indicators_anon_read" ON threat_indicators;
CREATE POLICY "threat_indicators_anon_read"
  ON threat_indicators FOR SELECT USING (true);

DROP POLICY IF EXISTS "threat_indicators_service_write" ON threat_indicators;
CREATE POLICY "threat_indicators_service_write"
  ON threat_indicators FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE threat_indicators IS 'Community threat intelligence: hashed indicators from high-risk scans. Updated server-side via service role only.';
