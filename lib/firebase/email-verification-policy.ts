import { env } from '@/lib/env'

export function isEmailVerificationRequired(): boolean {
  return env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === true
}
