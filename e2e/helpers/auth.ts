import { expect, type Page } from '@playwright/test'

const locale = process.env.E2E_LOCALE ?? 'es'

export function e2eLocale(): string {
  return locale
}

export function e2eCredentials(unique = Date.now()) {
  return {
    email: `e2e-${unique}@insurwallet.test`,
    password: 'E2eTestPass1!',
    displayName: 'E2E User',
  }
}

export async function registerUser(page: Page, unique = Date.now()) {
  const creds = e2eCredentials(unique)

  await page.goto(`/${locale}/register`)
  await page.locator('#displayName').fill(creds.displayName)
  await page.locator('#email').fill(creds.email)
  await page.locator('#password').fill(creds.password)
  await page
    .getByRole('button', { name: /crear cuenta|create account/i })
    .click()

  await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard`), {
    timeout: 20_000,
  })

  return creds
}

export async function loginUser(page: Page, email: string, password: string) {
  await page.goto(`/${locale}/login`)
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page
    .getByRole('button', { name: /iniciar sesión|log in|sign in/i })
    .click()

  await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard`), {
    timeout: 20_000,
  })
}

export async function signOutUser(page: Page) {
  await page
    .getByRole('button', { name: /cerrar sesión|sign out|sair/i })
    .click()

  await expect(page).toHaveURL(new RegExp(`/${locale}/login`), {
    timeout: 15_000,
  })
}
