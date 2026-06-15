import { describe, expect, it } from 'vitest'

import {
  AGENT_PLACEHOLDER_EMAIL,
  AGENT_PLACEHOLDER_NAME,
  AGENT_PLACEHOLDER_PHONE,
  isPlaceholderAgent,
  resolveAgentForStorage,
  sanitizeAgentForDisplay,
} from '@/lib/policies/agent-placeholders'

describe('agent placeholders', () => {
  it('detects legacy placeholder agent', () => {
    expect(
      isPlaceholderAgent({
        name: AGENT_PLACEHOLDER_NAME,
        phone: AGENT_PLACEHOLDER_PHONE,
        email: AGENT_PLACEHOLDER_EMAIL,
      })
    ).toBe(true)
  })

  it('sanitizes placeholders to undefined for display', () => {
    expect(
      sanitizeAgentForDisplay({
        name: AGENT_PLACEHOLDER_NAME,
        phone: AGENT_PLACEHOLDER_PHONE,
        email: AGENT_PLACEHOLDER_EMAIL,
      })
    ).toBeUndefined()
  })

  it('keeps real extracted agent values', () => {
    expect(
      sanitizeAgentForDisplay({
        name: 'Laura Gómez',
        phone: '+573001112233',
        email: 'laura@aseguradora.com',
      })
    ).toEqual({
      name: 'Laura Gómez',
      phone: '+573001112233',
      email: 'laura@aseguradora.com',
    })
  })

  it('stores empty strings instead of placeholders', () => {
    expect(
      resolveAgentForStorage({
        name: AGENT_PLACEHOLDER_NAME,
        phone: AGENT_PLACEHOLDER_PHONE,
        email: AGENT_PLACEHOLDER_EMAIL,
      })
    ).toEqual({ name: '', phone: '', email: '' })
  })
})
