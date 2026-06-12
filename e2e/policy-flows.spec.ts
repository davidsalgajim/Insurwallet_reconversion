import path from 'node:path'

import { expect, test } from '@playwright/test'

import { e2eLocale, registerUser } from './helpers/auth'

const locale = e2eLocale()
const samplePdf = path.join(
  process.cwd(),
  'e2e',
  'fixtures',
  'sample-policy.pdf'
)

const useEmulators = process.env.E2E_FIREBASE_EMULATORS === 'true'

test.describe('Policy flows (Firebase emulators)', () => {
  test.skip(
    !useEmulators,
    'Set E2E_FIREBASE_EMULATORS=true and run emulators before this suite'
  )

  test('create manual policy and see it in the list', async ({ page }) => {
    const unique = Date.now()
    const policyNumber = `E2E-${unique}`
    const insurerName = 'Seguros E2E Demo'

    await registerUser(page, unique)

    await page.goto(`/${locale}/policies/new/manual`)
    await page.locator('#insurerName').fill(insurerName)
    await page.locator('#policyNumber').fill(policyNumber)
    await page.locator('#startDate').fill('2025-01-01')
    await page.locator('#endDate').fill('2026-12-31')
    await page
      .getByRole('button', { name: /guardar y continuar|save and continue/i })
      .click()

    await expect(page).toHaveURL(new RegExp(`/${locale}/policies`), {
      timeout: 20_000,
    })
    await expect(page.getByText(insurerName)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(policyNumber)).toBeVisible()
  })

  test('upload PDF enters processing state', async ({ page }) => {
    await registerUser(page, Date.now() + 1)

    await page.goto(`/${locale}/policies/new/upload`)
    await page.locator('input[type="file"]').setInputFiles(samplePdf)
    await expect(page.getByText('sample-policy.pdf')).toBeVisible()

    await page
      .getByRole('button', { name: /subir y procesar|upload and process/i })
      .click()

    await expect(
      page.getByRole('button', { name: /ver borrador|view draft/i })
    ).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('Policy flows (smoke, no emulators)', () => {
  test.skip(
    useEmulators,
    'Smoke policy wizard pages only run without emulator suite'
  )

  test('manual policy wizard requires authentication', async ({ page }) => {
    await page.goto(`/${locale}/policies/new/manual`)
    await expect(page).toHaveURL(new RegExp(`/${locale}/login`))
  })

  test('upload page requires authentication', async ({ page }) => {
    await page.goto(`/${locale}/policies/new/upload`)
    await expect(page).toHaveURL(new RegExp(`/${locale}/login`))
  })
})
