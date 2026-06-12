import { afterEach, describe, expect, it } from 'vitest'

import {
  checkRateLimit,
  checkSessionTokenLimit,
  estimateTokens,
  isInsuranceScoped,
  isInsuranceScopedResponse,
  resetRateLimits,
  validateMessageLength,
  wrapDocumentData,
} from '@/mariana/guardrails'

describe('isInsuranceScoped', () => {
  it('accepts insurance-related questions', () => {
    expect(isInsuranceScoped('¿Qué cubre mi póliza de salud?')).toBe(true)
    expect(isInsuranceScoped('When does my auto policy expire?')).toBe(true)
  })

  it('rejects clearly off-topic questions', () => {
    expect(isInsuranceScoped('Dame una receta de pasta')).toBe(false)
    expect(isInsuranceScoped('What is the weather today?')).toBe(false)
  })

  it('rejects empty messages', () => {
    expect(isInsuranceScoped('   ')).toBe(false)
  })
})

describe('validateMessageLength', () => {
  it('enforces non-empty and max length', () => {
    expect(validateMessageLength('hola')).toBe(true)
    expect(validateMessageLength('')).toBe(false)
    expect(validateMessageLength('a'.repeat(4_001))).toBe(false)
  })
})

describe('wrapDocumentData', () => {
  it('wraps document text in delimiters', () => {
    expect(wrapDocumentData('clause text')).toBe(
      '<document_data>\nclause text\n</document_data>'
    )
  })
})

describe('token limits', () => {
  it('estimates tokens and enforces session cap', () => {
    expect(estimateTokens('abcd')).toBe(1)
    expect(checkSessionTokenLimit(1_000)).toBe(true)
    expect(checkSessionTokenLimit(40_000)).toBe(false)
  })
})

describe('checkRateLimit', () => {
  afterEach(() => {
    resetRateLimits()
  })

  it('allows requests under the per-minute cap', () => {
    expect(checkRateLimit('user-1').allowed).toBe(true)
    expect(checkRateLimit('user-1').allowed).toBe(true)
  })

  it('blocks requests over the per-minute cap', () => {
    const uid = 'rate-limited-user'
    for (let i = 0; i < 20; i += 1) {
      expect(checkRateLimit(uid, 1_000).allowed).toBe(true)
    }
    const blocked = checkRateLimit(uid, 1_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterMs).toBeGreaterThan(0)
  })
})

describe('isInsuranceScopedResponse', () => {
  it('accepts typical insurance answers', () => {
    expect(isInsuranceScopedResponse('Tu póliza cubre hospitalización.')).toBe(
      true
    )
  })

  it('rejects clearly off-topic answers', () => {
    expect(
      isInsuranceScopedResponse('Aquí tienes una receta de pasta carbonara.')
    ).toBe(false)
  })
})
