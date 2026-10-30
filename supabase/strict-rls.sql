alter table public.scan_history enable row level security;
alter table public.scam_reports enable row level security;

alter table public.scan_history add column if not exists user_id uuid references auth.users(id) on delete set null;

drop policy if exists scan_history_select_all on public.scan_history;
drop policy if exists scan_history_insert_all on public.scan_history;
drop policy if exists scan_history_update_auth on public.scan_history;
drop policy if exists scan_history_delete_auth on public.scan_history;

create policy scan_history_select_own
on public.scan_history
for select
to authenticated
using (auth.uid() = user_id);

create policy scan_history_insert_own
on public.scan_history
for insert
to authenticated
with check (auth.uid() = user_id);

create policy scan_history_update_own
on public.scan_history
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy scan_history_delete_own
on public.scan_history
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists scam_reports_select_all on public.scam_reports;
drop policy if exists scam_reports_insert_all on public.scam_reports;
drop policy if exists scam_reports_update_auth on public.scam_reports;
drop policy if exists scam_reports_delete_auth on public.scam_reports;

create policy scam_reports_select_own
on public.scam_reports
for select
to authenticated
using (auth.uid() = reporter_user_id);

create policy scam_reports_insert_own
on public.scam_reports
for insert
to authenticated
with check (auth.uid() = reporter_user_id);

create policy scam_reports_update_own
on public.scam_reports
for update
to authenticated
using (auth.uid() = reporter_user_id)
with check (auth.uid() = reporter_user_id);

create policy scam_reports_delete_own
on public.scam_reports
for delete
to authenticated
using (auth.uid() = reporter_user_id);

revoke all on table public.scan_history from anon;
revoke all on table public.scam_reports from anon;

grant select, insert, update, delete on table public.scan_history to authenticated;
grant select, insert, update, delete on table public.scam_reports to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists evidence_public_read on storage.objects;
drop policy if exists evidence_upload on storage.objects;
drop policy if exists evidence_update_auth on storage.objects;
drop policy if exists evidence_delete_auth on storage.objects;

create policy evidence_read_own
on storage.objects
for select
to authenticated
using (bucket_id = 'evidence' and owner = auth.uid());

create policy evidence_insert_own
on storage.objects
for insert
to authenticated
with check (bucket_id = 'evidence' and owner = auth.uid());

create policy evidence_update_own
on storage.objects
for update
to authenticated
using (bucket_id = 'evidence' and owner = auth.uid())
with check (bucket_id = 'evidence' and owner = auth.uid());

create policy evidence_delete_own
on storage.objects
for delete
to authenticated
using (bucket_id = 'evidence' and owner = auth.uid());
