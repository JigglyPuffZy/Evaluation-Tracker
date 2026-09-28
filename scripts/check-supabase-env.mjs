import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PROJECT_REF = 'ljojasxfgqlnqswkfoqm'

const vercelPath = path.join(ROOT, 'vercel.json')
if (fs.existsSync(vercelPath)) {
  const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'))
  const rewrite = vercel.rewrites?.find((entry) => entry.source?.includes('api/supabase'))
  const destination = rewrite?.destination ?? ''
  if (!destination.includes(PROJECT_REF)) {
    console.error(`\n[supabase-env] vercel.json proxy must target ${PROJECT_REF}\n`)
    process.exit(1)
  }
}

const envPath = path.join(ROOT, '.env')
if (fs.existsSync(envPath)) {
  const env = Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=')
        return [line.slice(0, index), line.slice(index + 1).trim()]
      }),
  )

  const url = (env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')
  const anon = env.VITE_SUPABASE_ANON_KEY ?? ''
  const expectedUrl = `https://${PROJECT_REF}.supabase.co`

  if (url && url !== expectedUrl) {
    console.warn(`[supabase-env] warn: .env URL is ${url}; app uses canonical ${expectedUrl}`)
  }

  if (anon) {
    try {
      const payload = anon.split('.')[1]
      const ref = JSON.parse(
        Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(),
      ).ref
      if (ref !== PROJECT_REF) {
        console.warn(`[supabase-env] warn: .env anon key is for "${ref}"; app uses canonical ${PROJECT_REF}`)
      }
    } catch {
      console.warn('[supabase-env] warn: could not parse .env anon key')
    }
  }
}

console.log(`[supabase-env] OK — canonical project ${PROJECT_REF}`)
