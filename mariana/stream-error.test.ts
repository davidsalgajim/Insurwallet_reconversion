import { describe, expect, it } from 'vitest'

import { toErrorMessage } from '@/lib/server/safe-error'
import {
  MARIANA_ROUTER_MODEL,
  MARIANA_SPECIALIST_MODEL,
} from '@/mariana/models'

describe('toErrorMessage', () => {
  it('reads Error.message without mutation', () => {
    const error = new Error('boom')
    expect(toErrorMessage(error)).toBe('boom')
    expect(error.message).toBe('boom')
  })

  it('reads getter-only message objects safely', () => {
    const error = {
      get message() {
        return 'read-only'
      },
    }
    expect(toErrorMessage(error)).toBe('read-only')
    expect(() => {
      ;(error as { message: string }).message = 'mutated'
    }).toThrow()
  })
})

describe('mariana model ids', () => {
  it('uses current haiku and sonnet snapshots', () => {
    expect(MARIANA_ROUTER_MODEL).toBe('claude-haiku-4-5-20251001')
    expect(MARIANA_SPECIALIST_MODEL).toBe('claude-sonnet-4-5-20250929')
  })
})
