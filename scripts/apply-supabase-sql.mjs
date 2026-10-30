import fs from 'node:fs/promises'
import path from 'node:path'

const SUPABASE_PAT = process.env.SUPABASE_PAT
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF
const SUPABASE_SQL_FILE = process.env.SUPABASE_SQL_FILE

if (!SUPABASE_PAT || !SUPABASE_PROJECT_REF || !SUPABASE_SQL_FILE) {
  throw new Error('Missing required env vars: SUPABASE_PAT, SUPABASE_PROJECT_REF, SUPABASE_SQL_FILE')
}

const sqlPath = path.resolve(SUPABASE_SQL_FILE)

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

  console.log(`Applied SQL file: ${SUPABASE_SQL_FILE}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
