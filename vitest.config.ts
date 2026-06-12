import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    passWithNoTests: true,
    include: [
      '**/*.test.{ts,tsx}',
      'firestore.rules.test.ts',
      'storage.rules.test.ts',
    ],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**', '**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
