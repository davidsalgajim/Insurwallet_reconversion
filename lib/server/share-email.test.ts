import { describe, expect, it } from 'vitest'

import {
  buildShareEmailHtml,
  buildShareEmailSubject,
} from '@/lib/server/share-email'

describe('share email templates', () => {
  it('builds localized HTML with share link and permission', () => {
    const html = buildShareEmailHtml({
      recipientEmail: 'user@example.com',
      insurerName: 'Seguros Demo',
      policyNumber: 'POL-001',
      token: 'abc123',
      permission: 'view_download',
      locale: 'es',
    })

    expect(html).toContain('/share/abc123')
    expect(html).toContain('Seguros Demo')
    expect(html).toContain('descarga')
  })

  it('returns localized subjects', () => {
    expect(buildShareEmailSubject('en')).toContain('InsurWallet')
    expect(buildShareEmailSubject('pt')).toContain('InsurWallet')
  })
})
