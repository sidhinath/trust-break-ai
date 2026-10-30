const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_PAT = process.env.SUPABASE_PAT
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_PAT || !SUPABASE_PROJECT_REF) {
  throw new Error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PAT, SUPABASE_PROJECT_REF')
}

const restHeaders = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

const mgmtHeaders = {
  Authorization: `Bearer ${SUPABASE_PAT}`,
  'Content-Type': 'application/json',
}

async function request(url, options = {}, allowFailure = false) {
  const response = await fetch(url, options)
  const text = await response.text()
  const data = text ? (() => {
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  })() : null

  if (!response.ok && !allowFailure) {
    throw new Error(`${url} -> ${response.status} ${typeof data === 'string' ? data : JSON.stringify(data)}`)
  }

  return { ok: response.ok, data }
}

async function deleteAllAuthUsers() {
  let page = 1
  let deleted = 0

  while (true) {
    const { data } = await request(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=1000`,
      { headers: restHeaders },
      true
    )

    const users = data?.users || []
    if (users.length === 0) break

    for (const user of users) {
      await request(
        `${SUPABASE_URL}/auth/v1/admin/users/${user.id}`,
        { method: 'DELETE', headers: restHeaders },
        true
      )
      deleted += 1
    }

    page += 1
  }

  return deleted
}

async function wipeBucket(bucketName) {
  const listResp = await request(
    `${SUPABASE_URL}/storage/v1/object/list/${bucketName}`,
    {
      method: 'POST',
      headers: restHeaders,
      body: JSON.stringify({ prefix: '', limit: 1000, offset: 0 }),
    },
    true
  )

  const objects = Array.isArray(listResp.data) ? listResp.data : []
  const objectNames = objects.map((obj) => obj.name).filter(Boolean)

  if (objectNames.length > 0) {
    await request(
      `${SUPABASE_URL}/storage/v1/object/remove/${bucketName}`,
      {
        method: 'POST',
        headers: restHeaders,
        body: JSON.stringify({ prefixes: objectNames }),
      },
      true
    )
  }

  await request(
    `${SUPABASE_URL}/storage/v1/bucket/${bucketName}`,
    { method: 'DELETE', headers: restHeaders },
    true
  )
}

async function resetDatabaseSchema() {
  const sql = `
create extension if not exists pgcrypto;
drop table if exists public.scan_history cascade;
drop table if exists public.scam_reports cascade;

create table public.scan_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  scan_type text not null check (scan_type in ('message','link','screenshot','voice')),
  input_content text,
  fraud_score numeric,
  risk_level text not null check (risk_level in ('safe','suspicious','scam')),
  ai_analysis text,
  reasons text[],
  screenshot_url text
);

create table public.scam_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  report_type text not null check (report_type in ('message','link','phone','screenshot','website','other')),
  scam_content text not null,
  phone_number text,
  url text,
  screenshot_url text,
  fraud_score numeric,
  ai_analysis text,
  risk_level text check (risk_level in ('safe','suspicious','scam')),
  region text,
  country text,
  upvotes numeric default 0,
  status text default 'pending' check (status in ('pending','verified','dismissed'))
);
`

  await request(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: mgmtHeaders,
      body: JSON.stringify({ query: sql }),
    }
  )
}

async function createEvidenceBucket() {
  await request(
    `${SUPABASE_URL}/storage/v1/bucket`,
    {
      method: 'POST',
      headers: restHeaders,
      body: JSON.stringify({
        id: 'evidence',
        name: 'evidence',
        public: true,
      }),
    },
    true
  )
}

async function verifyState() {
  const scans = await request(
    `${SUPABASE_URL}/rest/v1/scan_history?select=id&limit=1`,
    { headers: restHeaders },
    true
  )
  const reports = await request(
    `${SUPABASE_URL}/rest/v1/scam_reports?select=id&limit=1`,
    { headers: restHeaders },
    true
  )
  const users = await request(
    `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1`,
    { headers: restHeaders },
    true
  )

  return {
    scanRows: Array.isArray(scans.data) ? scans.data.length : 0,
    reportRows: Array.isArray(reports.data) ? reports.data.length : 0,
    authUsers: Array.isArray(users.data?.users) ? users.data.users.length : 0,
  }
}

async function main() {
  console.log('Starting full Supabase project wipe for GhostNet...')

  await request(
    `${SUPABASE_URL}/rest/v1/scan_history?id=not.is.null`,
    { method: 'DELETE', headers: { ...restHeaders, Prefer: 'return=minimal' } },
    true
  )
  await request(
    `${SUPABASE_URL}/rest/v1/scam_reports?id=not.is.null`,
    { method: 'DELETE', headers: { ...restHeaders, Prefer: 'return=minimal' } },
    true
  )

  const deletedUsers = await deleteAllAuthUsers()
  console.log(`Deleted auth users: ${deletedUsers}`)

  await wipeBucket('evidence')
  console.log('Storage bucket wiped: evidence')

  await resetDatabaseSchema()
  console.log('Database schema recreated')

  await createEvidenceBucket()
  console.log('Storage bucket created: evidence (public)')

  const state = await verifyState()
  console.log('Verification:', state)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
