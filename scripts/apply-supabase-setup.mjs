import fs from 'node:fs/promises'
import path from 'node:path'

const SUPABASE_PAT = process.env.SUPABASE_PAT
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF

if (!SUPABASE_PAT || !SUPABASE_PROJECT_REF) {
  throw new Error('Missing required env vars: SUPABASE_PAT and SUPABASE_PROJECT_REF')
}

const sqlPath = path.resolve('supabase/full-setup.sql')

async function main() {
  const sql = await fs.readFile(sqlPath, 'utf8')

  const response = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Failed to apply SQL: ${response.status} ${text}`)
  }

  console.log('Supabase setup applied successfully.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
