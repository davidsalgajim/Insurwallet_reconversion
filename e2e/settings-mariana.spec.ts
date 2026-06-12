import { expect, test } from '@playwright/test'

import { e2eLocale, registerUser } from './helpers/auth'

const locale = e2eLocale()
const useEmulators = process.env.E2E_FIREBASE_EMULATORS === 'true'

test.describe('Settings & MarIAna (Firebase emulators)', () => {
  test.skip(
    !useEmulators,
    'Set E2E_FIREBASE_EMULATORS=true and run emulators before this suite'
  )

  test('settings page shows profile sections', async ({ page }) => {
    await registerUser(page, Date.now())

    await page.goto(`/${locale}/settings`)
    await expect(
      page.getByRole('heading', { name: /perfil|profile/i })
    ).toBeVisible()
    await expect(page.getByText(/privacidad|privacy/i).first()).toBeVisible()
    await expect(
      page.getByText(/exportar mis datos|export my data/i)
    ).toBeVisible()
  })

  test('mariana accepts an insurance question and streams a reply', async ({
    page,
  }) => {
    await registerUser(page, Date.now() + 2)

    await page.goto(`/${locale}/mariana`)
    await expect(page.getByRole('heading', { name: /mariana/i })).toBeVisible()

    const question = '¿Cuándo vence mi seguro de auto?'
    await page.locator('#mariana-input').fill(question)
    await page
      .getByRole('button', { name: /enviar mensaje|send message/i })
      .click()

    await expect(page.getByText(question)).toBeVisible({ timeout: 10_000 })
    await expect(
      page
        .locator('li')
        .filter({ hasText: /vencim|expir|placeholder|tier0/i })
        .last()
    ).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('Settings & MarIAna (smoke)', () => {
  test('settings redirects unauthenticated users', async ({ page }) => {
    await page.goto(`/${locale}/settings`)
    await expect(page).toHaveURL(new RegExp(`/${locale}/login`))
  })

  test('mariana redirects unauthenticated users', async ({ page }) => {
    await page.goto(`/${locale}/mariana`)
    await expect(page).toHaveURL(new RegExp(`/${locale}/login`))
  })
})
