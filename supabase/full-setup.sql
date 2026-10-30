create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.scan_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  scan_type text not null check (scan_type in ('message', 'link', 'screenshot', 'voice')),
  input_content text,
  fraud_score numeric(5,2) check (fraud_score >= 0 and fraud_score <= 100),
  risk_level text not null check (risk_level in ('safe', 'suspicious', 'scam')),
  ai_analysis text,
  reasons text[] not null default '{}',
  screenshot_url text,
  source text not null default 'web',
  metadata jsonb not null default '{}'::jsonb
);

alter table public.scan_history add column if not exists updated_at timestamptz not null default now();
alter table public.scan_history add column if not exists reasons text[] not null default '{}';
alter table public.scan_history add column if not exists source text not null default 'web';
alter table public.scan_history add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.scam_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  report_type text not null check (report_type in ('message', 'link', 'phone', 'screenshot', 'website', 'other')),
  scam_content text not null,
  phone_number text,
  url text,
  screenshot_url text,
  fraud_score numeric(5,2) check (fraud_score >= 0 and fraud_score <= 100),
  ai_analysis text,
  risk_level text check (risk_level in ('safe', 'suspicious', 'scam')),
  region text,
  country text,
  upvotes integer not null default 0 check (upvotes >= 0),
  status text not null default 'pending' check (status in ('pending', 'verified', 'dismissed')),
  reporter_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.scam_reports add column if not exists updated_at timestamptz not null default now();
alter table public.scam_reports add column if not exists upvotes integer not null default 0;
alter table public.scam_reports add column if not exists status text not null default 'pending';
alter table public.scam_reports add column if not exists reporter_user_id uuid references auth.users(id) on delete set null;
alter table public.scam_reports add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'scan_history_scan_type_check') then
    alter table public.scan_history
      add constraint scan_history_scan_type_check
      check (scan_type in ('message', 'link', 'screenshot', 'voice')) not valid;
    alter table public.scan_history validate constraint scan_history_scan_type_check;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'scan_history_risk_level_check') then
    alter table public.scan_history
      add constraint scan_history_risk_level_check
      check (risk_level in ('safe', 'suspicious', 'scam')) not valid;
    alter table public.scan_history validate constraint scan_history_risk_level_check;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'scan_history_fraud_score_check') then
    alter table public.scan_history
      add constraint scan_history_fraud_score_check
      check (fraud_score is null or (fraud_score >= 0 and fraud_score <= 100)) not valid;
    alter table public.scan_history validate constraint scan_history_fraud_score_check;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'scam_reports_report_type_check') then
    alter table public.scam_reports
      add constraint scam_reports_report_type_check
      check (report_type in ('message', 'link', 'phone', 'screenshot', 'website', 'other')) not valid;
    alter table public.scam_reports validate constraint scam_reports_report_type_check;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'scam_reports_risk_level_check') then
    alter table public.scam_reports
      add constraint scam_reports_risk_level_check
      check (risk_level is null or risk_level in ('safe', 'suspicious', 'scam')) not valid;
    alter table public.scam_reports validate constraint scam_reports_risk_level_check;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'scam_reports_status_check') then
    alter table public.scam_reports
      add constraint scam_reports_status_check
      check (status in ('pending', 'verified', 'dismissed')) not valid;
    alter table public.scam_reports validate constraint scam_reports_status_check;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'scam_reports_upvotes_check') then
    alter table public.scam_reports
      add constraint scam_reports_upvotes_check
      check (upvotes >= 0) not valid;
    alter table public.scam_reports validate constraint scam_reports_upvotes_check;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'scam_reports_fraud_score_check') then
    alter table public.scam_reports
      add constraint scam_reports_fraud_score_check
      check (fraud_score is null or (fraud_score >= 0 and fraud_score <= 100)) not valid;
    alter table public.scam_reports validate constraint scam_reports_fraud_score_check;
  end if;
end $$;

drop trigger if exists set_scan_history_updated_at on public.scan_history;
create trigger set_scan_history_updated_at
before update on public.scan_history
for each row
execute function public.set_updated_at();

drop trigger if exists set_scam_reports_updated_at on public.scam_reports;
create trigger set_scam_reports_updated_at
before update on public.scam_reports
for each row
execute function public.set_updated_at();

create index if not exists idx_scan_history_created_at on public.scan_history (created_at desc);
create index if not exists idx_scan_history_risk_level on public.scan_history (risk_level);
create index if not exists idx_scan_history_scan_type on public.scan_history (scan_type);
create index if not exists idx_scan_history_metadata on public.scan_history using gin (metadata);

create index if not exists idx_scam_reports_created_at on public.scam_reports (created_at desc);
create index if not exists idx_scam_reports_risk_level on public.scam_reports (risk_level);
create index if not exists idx_scam_reports_report_type on public.scam_reports (report_type);
create index if not exists idx_scam_reports_status on public.scam_reports (status);
create index if not exists idx_scam_reports_metadata on public.scam_reports using gin (metadata);

alter table public.scan_history enable row level security;
alter table public.scam_reports enable row level security;

drop policy if exists scan_history_select_all on public.scan_history;
create policy scan_history_select_all
on public.scan_history
for select
to anon, authenticated
using (true);

drop policy if exists scan_history_insert_all on public.scan_history;
create policy scan_history_insert_all
on public.scan_history
for insert
to anon, authenticated
with check (true);

drop policy if exists scan_history_update_auth on public.scan_history;
create policy scan_history_update_auth
on public.scan_history
for update
to authenticated
using (true)
with check (true);

drop policy if exists scan_history_delete_auth on public.scan_history;
create policy scan_history_delete_auth
on public.scan_history
for delete
to authenticated
using (true);

drop policy if exists scam_reports_select_all on public.scam_reports;
create policy scam_reports_select_all
on public.scam_reports
for select
to anon, authenticated
using (true);

drop policy if exists scam_reports_insert_all on public.scam_reports;
create policy scam_reports_insert_all
on public.scam_reports
for insert
to anon, authenticated
with check (true);

drop policy if exists scam_reports_update_auth on public.scam_reports;
create policy scam_reports_update_auth
on public.scam_reports
for update
to authenticated
using (true)
with check (true);

drop policy if exists scam_reports_delete_auth on public.scam_reports;
create policy scam_reports_delete_auth
on public.scam_reports
for delete
to authenticated
using (true);

grant usage on schema public to anon, authenticated;
grant select, insert on table public.scan_history to anon, authenticated;
grant select, insert on table public.scam_reports to anon, authenticated;
grant update, delete on table public.scan_history to authenticated;
grant update, delete on table public.scam_reports to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists evidence_public_read on storage.objects;
create policy evidence_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'evidence');

drop policy if exists evidence_upload on storage.objects;
create policy evidence_upload
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'evidence');

drop policy if exists evidence_update_auth on storage.objects;
create policy evidence_update_auth
on storage.objects
for update
to authenticated
using (bucket_id = 'evidence')
with check (bucket_id = 'evidence');

drop policy if exists evidence_delete_auth on storage.objects;
create policy evidence_delete_auth
on storage.objects
for delete
to authenticated
using (bucket_id = 'evidence');
