import { describe, expect, it } from 'vitest'

import { stripUndefined } from './strip-undefined'

describe('stripUndefined', () => {
  it('removes top-level undefined keys', () => {
    expect(
      stripUndefined({
        coverages: undefined,
        notes: 'draft',
        premium: 0,
      })
    ).toEqual({
      notes: 'draft',
      premium: 0,
    })
  })

  it('removes nested undefined keys in objects and arrays', () => {
    expect(
      stripUndefined({
        benefitEntries: [
          { name: 'Dental', description: undefined, category: 'health' },
        ],
        agent: { name: 'Agent', phone: '+571234', email: undefined },
      })
    ).toEqual({
      benefitEntries: [{ name: 'Dental', category: 'health' }],
      agent: { name: 'Agent', phone: '+571234' },
    })
  })

  it('preserves null, dates, and primitives', () => {
    const date = new Date('2025-01-01')

    expect(stripUndefined({ cleared: null, when: date, count: 0 })).toEqual({
      cleared: null,
      when: date,
      count: 0,
    })
  })

  it('returns arrays with undefined elements stripped at object level only', () => {
    expect(stripUndefined([{ a: 1, b: undefined }, undefined])).toEqual([
      { a: 1 },
      undefined,
    ])
  })
})
