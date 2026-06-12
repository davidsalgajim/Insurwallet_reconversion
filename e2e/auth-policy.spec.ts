import { expect, test } from '@playwright/test'

const locale = process.env.E2E_LOCALE ?? 'es'

test.describe('Auth pages smoke', () => {
  test('login page renders email/password form', async ({ page }) => {
    await page.goto(`/${locale}/login`)

    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(
      page.getByRole('link', { name: /crear cuenta|create account/i })
    ).toBeVisible()
  })

  test('register page renders sign-up form', async ({ page }) => {
    await page.goto(`/${locale}/register`)

    await expect(page.locator('#displayName')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(
      page.getByRole('link', { name: /iniciar sesión|log in|sign in/i })
    ).toBeVisible()
  })

  test('unauthenticated dashboard access redirects to login', async ({
    page,
  }) => {
    await page.goto(`/${locale}/dashboard`)

    await expect(page).toHaveURL(new RegExp(`/${locale}/login`))
    await expect(page.locator('#email')).toBeVisible()
  })

  test('policies list redirects unauthenticated users to login', async ({
    page,
  }) => {
    await page.goto(`/${locale}/policies`)

    await expect(page).toHaveURL(new RegExp(`/${locale}/login`))
  })
})

test.describe('Auth flow (Firebase Auth emulator)', () => {
  test.skip(
    process.env.E2E_FIREBASE_EMULATORS !== 'true',
    'Set E2E_FIREBASE_EMULATORS=true and run `npm run emulators` before this suite'
  )

  test('register then sign out and sign in again', async ({ page }) => {
    const unique = Date.now()
    const email = `e2e-${unique}@insurwallet.test`
    const password = 'E2eTestPass1!'

    await page.goto(`/${locale}/register`)
    await page.locator('#displayName').fill('E2E User')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page
      .getByRole('button', { name: /crear cuenta|create account/i })
      .click()

    await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard`), {
      timeout: 15_000,
    })

    await page
      .getByRole('button', { name: /cerrar sesión|sign out|sair/i })
      .click()

    await expect(page).toHaveURL(new RegExp(`/${locale}/login`))

    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page
      .getByRole('button', { name: /iniciar sesión|log in|sign in/i })
      .click()

    await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard`), {
      timeout: 15_000,
    })
  })
})
