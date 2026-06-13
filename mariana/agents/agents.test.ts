import { describe, expect, it } from 'vitest'

import { buildCoveragePrompt, buildDocumentalPrompt } from '@/mariana/agents'
import { buildCachedSystemBlocks } from '@/mariana/agents/prompt-cache'
import {
  getAgentSystemPrompt,
  getAgentSystemPromptWithSpecialist,
} from '@/mariana/agents/index'
import { getSpecialistPromptForPolicyType } from '@/mariana/agents/specialists'
import { PolicyTypeSchema } from '@/lib/schemas/policy'

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

  it('returns null for tier0 (deterministic, no LLM prompt)', () => {
    expect(getAgentSystemPrompt('tier0', 'es')).toBeNull()
  })

  it('returns prompt for emergency agent', () => {
    expect(getAgentSystemPrompt('emergency', 'es')).toContain('Emergency')
  })

  it('builds cached system blocks for Anthropic prompt caching', () => {
    const blocks = buildCachedSystemBlocks('Static prompt', 'Dynamic suffix')
    expect(blocks[0]?.cache_control).toEqual({ type: 'ephemeral' })
    expect(blocks[1]?.text).toBe('Dynamic suffix')
  })

  it('builds specialist prompts for every policy type', () => {
    for (const policyType of PolicyTypeSchema.options) {
      const prompt = getSpecialistPromptForPolicyType(policyType, 'es')
      expect(prompt).toContain('conversational flow')
      expect(prompt).toContain('locale: es')
    }
  })

  it('merges base and specialist prompts for situational routes', () => {
    const prompt = getAgentSystemPromptWithSpecialist({
      agentId: 'coverage',
      locale: 'es',
      situationalIntent: 'pet_incident',
      policyTypes: ['pet'],
    })
    expect(prompt).toContain('Coverage & Benefits specialist')
    expect(prompt).toContain('Pet insurance situational specialist')
  })
})
