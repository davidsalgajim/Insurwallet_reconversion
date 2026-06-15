/**
 * Local document worker — loads repo .env.local and runs uvicorn on :8080.
 * Usage: npm run dev:worker
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'

const root = process.cwd()
const workerDir = join(root, 'worker')

function loadEnvLocal() {
  const envPath = resolve(root, '.env.local')
  if (!existsSync(envPath)) return

  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const match = line.match(/^\s*([^#][^=]+)=(.*)$/)
    if (!match) continue
    const key = match[1].trim()
    const value = match[2].trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function resolveWorkerPython() {
  const winVenv = join(workerDir, '.venv', 'Scripts', 'python.exe')
  const unixVenv = join(workerDir, '.venv', 'bin', 'python')
  if (process.platform === 'win32' && existsSync(winVenv)) return winVenv
  if (existsSync(unixVenv)) return unixVenv
  return process.platform === 'win32' ? 'py' : 'python3'
}

function resolveCredentialsPath() {
  const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  if (!creds) return
  if (creds.startsWith('./') || creds.startsWith('.\\')) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = resolve(root, creds)
  }
}

loadEnvLocal()

if (!process.env.FIREBASE_STORAGE_BUCKET?.trim()) {
  const publicBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim()
  if (publicBucket) {
    process.env.FIREBASE_STORAGE_BUCKET = publicBucket
  }
}

resolveCredentialsPath()

const required = ['INTERNAL_API_SECRET', 'ANTHROPIC_API_KEY']
const missing = required.filter((key) => !process.env[key]?.trim())
if (missing.length > 0) {
  console.error(
    `Missing worker env in .env.local: ${missing.join(', ')}. See worker/README.md`
  )
  process.exit(1)
}

if (!process.env.FIREBASE_STORAGE_BUCKET?.trim()) {
  console.error(
    'Set FIREBASE_STORAGE_BUCKET or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local'
  )
  process.exit(1)
}

const python = resolveWorkerPython()
const args = ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8080', '--host', '127.0.0.1']

console.log(`Starting worker at http://127.0.0.1:8080 (${python})`)

const child = spawn(python, args, {
  cwd: workerDir,
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  }
  process.exit(code ?? 1)
})

process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
