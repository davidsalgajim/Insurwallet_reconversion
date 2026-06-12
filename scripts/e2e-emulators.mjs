import { spawnSync } from 'node:child_process'

process.env.E2E_FIREBASE_EMULATORS = 'true'

const result = spawnSync(
  'npx',
  ['playwright', 'test', '--config=e2e/playwright.config.ts'],
  { stdio: 'inherit', shell: true, env: process.env }
)

process.exit(result.status ?? 1)
