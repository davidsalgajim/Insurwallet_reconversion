/**
 * Placeholder for axe-core integration in Vitest (task 6.5).
 *
 * To enable:
 *   npm install -D vitest-axe axe-core jsdom
 *   A11Y_AXE_ENABLED=true npm run test
 *
 * For route-level checks, prefer @axe-core/playwright in e2e/ (task 6.3+).
 */

export type AxeViolation = {
  id: string
  impact?: 'minor' | 'moderate' | 'serious' | 'critical'
  description: string
  nodes: number
}

export function isAxeEnabled(): boolean {
  return process.env.A11Y_AXE_ENABLED === 'true'
}

/**
 * Returns an empty list until vitest-axe is wired. Throws when enabled without integration.
 */
export async function runAxeCheck(): Promise<AxeViolation[]> {
  if (!isAxeEnabled()) {
    return []
  }

  throw new Error(
    'A11Y_AXE_ENABLED is set but axe-core is not integrated yet — see lib/a11y/axe-vitest-stub.ts'
  )
}
