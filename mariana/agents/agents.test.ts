import { describe, expect, it } from 'vitest'

import { buildCoveragePrompt, buildDocumentalPrompt } from '@/mariana/agents'
import { getAgentSystemPrompt } from '@/mariana/agents/index'

describe('MarIAna agent prompts', () => {
  it('builds documental prompt with locale and read-only constraints', () => {
    const prompt = buildDocumentalPrompt('es')
    expect(prompt).toContain('Documental specialist')
    expect(prompt).toContain('<document_data>')
    expect(prompt).toContain('locale: es')
  })

  it('builds coverage prompt with locale and structured data scope', () => {
    const prompt = buildCoveragePrompt('en')
    expect(prompt).toContain('Coverage & Benefits specialist')
    expect(prompt).toContain('coverageEntries')
    expect(prompt).toContain('locale: en')
  })

  it('returns null for agents without stub prompts yet', () => {
    expect(getAgentSystemPrompt('emergency', 'es')).toBeNull()
  })
})
