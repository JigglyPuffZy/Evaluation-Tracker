import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PROJECT_REF = 'ljojasxfgqlnqswkfoqm'
const EXPECTED_URL = `https://${PROJECT_REF}.supabase.co`

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=')
        return [line.slice(0, index), line.slice(index + 1).trim()]
      }),
  )
}

function jwtProjectRef(jwt) {
  try {
    const payload = jwt.split('.')[1]
    if (!payload) return null
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString())
    return typeof json.ref === 'string' ? json.ref.toLowerCase() : null
  } catch {
    return null
  }
}

function fail(message) {
  console.error(`\n[supabase-env] ${message}\n`)
  process.exit(1)
}

const env = readEnvFile(path.join(ROOT, '.env'))
const url = (env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')
const anon = env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!url || !anon) {
  fail('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (.env locally, Vercel env vars in CI).')
}

if (url !== EXPECTED_URL) {
  fail(`VITE_SUPABASE_URL must be ${EXPECTED_URL} (got ${url || 'empty'}).`)
}

const ref = jwtProjectRef(anon)
if (ref !== PROJECT_REF) {
  fail(
    `VITE_SUPABASE_ANON_KEY is for project "${ref ?? 'unknown'}", but this app uses "${PROJECT_REF}". Copy keys from the same Supabase project.`,
  )
}

const vercelPath = path.join(ROOT, 'vercel.json')
if (fs.existsSync(vercelPath)) {
  const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'))
  const rewrite = vercel.rewrites?.find((entry) => entry.source?.includes('api/supabase'))
  const destination = rewrite?.destination ?? ''
  if (!destination.includes(PROJECT_REF)) {
    fail(`vercel.json Supabase proxy must target ${EXPECTED_URL}.`)
  }
}

console.log(`[supabase-env] OK — ${PROJECT_REF}`)
