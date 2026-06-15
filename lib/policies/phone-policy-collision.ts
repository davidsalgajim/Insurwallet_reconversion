/** Detect when an extracted phone is likely the policy/certificate number. */
export function phoneCollidesWithPolicyNumber(
  phone: string | undefined | null,
  policyNumber: string | undefined | null
): boolean {
  const phoneDigits = digitsOnly(phone?.split(' ext ')[0])
  const policyDigits = digitsOnly(policyNumber)
  const minLen = 7

  if (phoneDigits.length < minLen || !policyDigits) {
    return false
  }
  if (phoneDigits === policyDigits) {
    return true
  }
  if (
    phoneDigits.includes(policyDigits) ||
    policyDigits.includes(phoneDigits)
  ) {
    return Math.min(phoneDigits.length, policyDigits.length) >= minLen
  }

  for (const prefix of ['57', '54', '1', '34', '82', '52', '55', '56', '51']) {
    if (
      phoneDigits.startsWith(prefix) &&
      phoneDigits.length > prefix.length + 6
    ) {
      const local = phoneDigits.slice(prefix.length)
      if (local.length >= minLen && policyDigits.includes(local)) {
        return true
      }
    }
  }

  return false
}

function digitsOnly(value: string | undefined | null): string {
  if (!value) {
    return ''
  }
  return value.replace(/\D/g, '')
}
