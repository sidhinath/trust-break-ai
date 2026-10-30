-- Feature 3: Public Threat Feed Blocklist
-- GhostNet AI — Migration 004

CREATE TABLE IF NOT EXISTS public_blocklist (
  id bigserial PRIMARY KEY,
  domain_hash text UNIQUE NOT NULL,
  domain text,
  source text NOT NULL,
  added_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_blocklist_hash ON public_blocklist(domain_hash);

ALTER TABLE public_blocklist ENABLE ROW LEVEL SECURITY;

-- Public can read (for client-side checks if ever needed)
DROP POLICY IF EXISTS "public_blocklist_anon_read" ON public_blocklist;
CREATE POLICY "public_blocklist_anon_read"
  ON public_blocklist FOR SELECT USING (true);

-- Only service role can write
DROP POLICY IF EXISTS "public_blocklist_service_write" ON public_blocklist;
CREATE POLICY "public_blocklist_service_write"
  ON public_blocklist FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE public_blocklist IS 'Hashed domain blocklist populated from OpenPhish and URLhaus public threat feeds. Updated every 6 hours via cron.';
