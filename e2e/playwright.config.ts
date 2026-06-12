import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`
const useEmulators = process.env.E2E_FIREBASE_EMULATORS === 'true'

const emulatorEnv: Record<string, string> = {
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: 'true',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-insurwallet.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-insurwallet',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-insurwallet.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789012',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789012:web:abcdef123456',
  NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION: 'false',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
}

const nextServer = {
  command: process.env.CI
    ? `npm run start -- -p ${port}`
    : `npm run dev -- -p ${port}`,
  url: baseURL,
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
  env: {
    ...(useEmulators ? emulatorEnv : {}),
  },
}

const emulatorServer = useEmulators
  ? {
      command: 'npm run emulators',
      url: 'http://127.0.0.1:4000',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'pipe' as const,
      stderr: 'pipe' as const,
    }
  : null

export default defineConfig({
  testDir: '.',
  fullyParallel: !useEmulators,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: useEmulators ? 1 : process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: emulatorServer ? [emulatorServer, nextServer] : nextServer,
})
