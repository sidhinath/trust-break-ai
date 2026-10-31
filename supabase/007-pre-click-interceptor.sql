-- Feature 8: Pre-Click Interceptor — production blocklist schema
-- TrustBreak AI — Migration 007 (idempotent)
--
-- Apply this file if you already ran the earlier migrations and only need the
-- table used by /api/blocklist-lite and the feed-sync cron.
--
-- Apply with:
--   SUPABASE_PAT=... SUPABASE_PROJECT_REF=... SUPABASE_SQL_FILE=supabase/007-pre-click-interceptor.sql npm run supabase:sql
-- Or paste it into the Supabase SQL Editor.

create table if not exists public.public_blocklist (
  id bigserial primary key,
  domain_hash text unique not null,
  domain text,
  source text not null default 'unknown',
  added_at timestamptz not null default now()
);

alter table public.public_blocklist add column if not exists domain text;
alter table public.public_blocklist add column if not exists source text not null default 'unknown';
alter table public.public_blocklist add column if not exists added_at timestamptz not null default now();

create index if not exists idx_public_blocklist_hash on public.public_blocklist (domain_hash);
create index if not exists idx_public_blocklist_domain on public.public_blocklist (domain);

alter table public.public_blocklist enable row level security;

drop policy if exists public_blocklist_anon_read on public.public_blocklist;
create policy public_blocklist_anon_read
on public.public_blocklist
for select
to anon, authenticated
using (true);

drop policy if exists public_blocklist_service_write on public.public_blocklist;
create policy public_blocklist_service_write
on public.public_blocklist
for all
to service_role
using (true)
with check (true);

grant usage on schema public to anon, authenticated;
grant select on table public.public_blocklist to anon, authenticated;
grant all on table public.public_blocklist to service_role;
grant usage, select on sequence public.public_blocklist_id_seq to service_role;

-- Verification (run separately):
--   select count(*) as blocked_domains from public.public_blocklist;
--
-- Optional end-to-end test row. Use a reserved .test domain that never resolves;
-- DNR redirects before DNS, so interception still works. Remove it afterwards.
--
-- insert into public.public_blocklist (domain_hash, domain, source)
-- values ('trustbreak-e2e-test', 'trustbreak-e2e.test', 'manual-e2e')
-- on conflict (domain_hash) do nothing;
--
-- delete from public.public_blocklist where source = 'manual-e2e';
