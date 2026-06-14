import type { MarianaPolicyContext } from '@/lib/server/mariana-context'
import { searchDocumentChunks } from '@/lib/server/document-chunks'
import { embedText, isEmbeddingsConfigured } from '@/lib/server/embeddings'
import {
  collectContactsForPolicies,
  filterPoliciesByType,
  searchBenefitsAssistances,
  searchCoverageForEvent,
} from '@/mariana/event-search'
import { usesAssistancePrefetch } from '@/mariana/situational'
import {
  assertPolicyAccess,
  executeTool,
  MARIANA_TOOL_NAMES,
  type ToolCall,
  type ToolContext,
  type ToolResult,
} from '@/mariana/tools'
import type {
  MarianaAgentId,
  PolicyMetadata,
  RouteDecision,
} from '@/mariana/types'

export type AsyncToolExecutor = (
  call: ToolCall,
  context: ToolContext
) => Promise<ToolResult>

function scopedPolicies(
  context: ToolContext,
  policies: MarianaPolicyContext[]
): MarianaPolicyContext[] {
  const allowed = new Set([
    ...context.ownedPolicyIds,
    ...context.sharedPolicyIds,
  ])
  return policies.filter((policy) => allowed.has(policy.id))
}

export type AsyncToolOptions = {
  cloudAiConsented?: boolean
  queryEmbedding?: number[]
}

export async function executeToolAsync(
  call: ToolCall,
  context: ToolContext,
  policies: MarianaPolicyContext[],
  metadata: PolicyMetadata[],
  options: AsyncToolOptions = {}
): Promise<ToolResult> {
  if (!MARIANA_TOOL_NAMES.includes(call.name)) {
    throw new Error(`Unknown tool: ${call.name}`)
  }

  assertPolicyAccess(context, call.policyId)

  const accessiblePolicies = scopedPolicies(context, policies)

  switch (call.name) {
    case 'get_policies_summary':
      return executeTool(call, context, metadata)
    case 'get_policies_by_type': {
      const filtered = filterPoliciesByType(
        accessiblePolicies,
        call.policyTypes
      )
      return {
        name: call.name,
        readOnly: true,
        data: {
          policyTypes: call.policyTypes ?? [],
          policies: filtered.map((policy) => ({
            id: policy.id,
            policyNumber: policy.policyNumber,
            insurerName: policy.insurerName,
            policyType: policy.policyType,
            holderName: policy.holderName,
            endDate: policy.endDate,
          })),
        },
      }
    }
    case 'get_coverage_for_event': {
      const matches = searchCoverageForEvent(
        accessiblePolicies,
        call.query ?? '',
        call.policyTypes
      )
      return {
        name: call.name,
        readOnly: true,
        data: {
          query: call.query ?? '',
          policyTypes: call.policyTypes ?? [],
          matches,
        },
      }
    }
    case 'get_benefits_assistances': {
      const benefits = searchBenefitsAssistances(
        accessiblePolicies,
        call.query,
        call.policyTypes
      )
      return {
        name: call.name,
        readOnly: true,
        data: {
          query: call.query ?? '',
          policyTypes: call.policyTypes ?? [],
          benefits,
        },
      }
    }
    case 'search_document_chunks': {
      const allowedPolicyIds = [
        ...context.ownedPolicyIds,
        ...context.sharedPolicyIds,
      ]
      const targetPolicyIds = call.policyId ? [call.policyId] : allowedPolicyIds

      if (targetPolicyIds.length === 0) {
        return {
          name: call.name,
          readOnly: true,
          data: { policyId: null, query: call.query ?? '', chunks: [] },
        }
      }

      let queryEmbedding = options.queryEmbedding
      if (
        !queryEmbedding &&
        options.cloudAiConsented !== false &&
        isEmbeddingsConfigured()
      ) {
        queryEmbedding = (await embedText(call.query ?? '')) ?? undefined
      }

      const chunks = await searchDocumentChunks({
        uid: context.uid,
        policyIds: targetPolicyIds,
        query: call.query ?? '',
        queryEmbedding,
        limit: call.policyId ? 5 : 8,
      })

      return {
        name: call.name,
        readOnly: true,
        data: {
          policyId: call.policyId ?? null,
          query: call.query ?? '',
          chunks: chunks.map((chunk) => ({
            chunkId: chunk.chunkId,
            docId: chunk.docId,
            page: chunk.page,
            fileName: chunk.fileName,
            text: chunk.text,
            score: chunk.score,
          })),
        },
      }
    }
    case 'get_coverage_details': {
      const policy = accessiblePolicies.find(
        (entry) => entry.id === call.policyId
      )
      return {
        name: call.name,
        readOnly: true,
        data: {
          policyId: call.policyId ?? null,
          coverages: policy?.coverageEntries ?? [],
          deductibles: policy?.deductibleEntries ?? [],
          benefits: policy?.benefitEntries ?? [],
          coveragesText: policy?.coverages ?? null,
          exclusionsText: policy?.exclusions ?? null,
          beneficiaries: policy?.beneficiaryEntries ?? [],
        },
      }
    }
    case 'get_contacts': {
      const targetPolicies = call.policyId
        ? accessiblePolicies.filter((policy) => policy.id === call.policyId)
        : accessiblePolicies

      return {
        name: call.name,
        readOnly: true,
        data: {
          policyId: call.policyId ?? null,
          contacts: collectContactsForPolicies(targetPolicies),
        },
      }
    }
  }
}

function resolveExplicitPolicyId(
  context: ToolContext,
  policyHint?: string
): string | undefined {
  if (
    policyHint &&
    (context.ownedPolicyIds.includes(policyHint) ||
      context.sharedPolicyIds.includes(policyHint))
  ) {
    return policyHint
  }

  return undefined
}

function resolvePolicyId(
  context: ToolContext,
  policyHint?: string
): string | undefined {
  if (
    policyHint &&
    (context.ownedPolicyIds.includes(policyHint) ||
      context.sharedPolicyIds.includes(policyHint))
  ) {
    return policyHint
  }

  return context.ownedPolicyIds[0] ?? context.sharedPolicyIds[0]
}

export function planPrefetchToolCalls(input: {
  agent: MarianaAgentId
  policyHint?: string
  message: string
  context: ToolContext
  decision?: RouteDecision
}): ToolCall[] {
  const situationalIntent = input.decision?.entities.situationalIntent
  const policyTypes = input.decision?.entities.policyTypes
  const policyId = resolvePolicyId(input.context, input.policyHint)
  const explicitPolicyId = resolveExplicitPolicyId(
    input.context,
    input.policyHint
  )

  const calls: ToolCall[] = [{ name: 'get_policies_summary' }]

  if (situationalIntent) {
    calls.push({
      name: 'get_policies_by_type',
      policyTypes,
    })
    calls.push({
      name: 'get_coverage_for_event',
      query: input.message,
      policyTypes,
    })
    calls.push({
      name: 'get_benefits_assistances',
      query: input.message,
      policyTypes: usesAssistancePrefetch(situationalIntent)
        ? policyTypes
        : undefined,
    })
    calls.push({
      name: 'get_contacts',
      policyId,
    })

    if (explicitPolicyId && situationalIntent !== 'emergency_accident') {
      calls.push({
        name: 'search_document_chunks',
        policyId: explicitPolicyId,
        query: input.message,
      })
    } else if (situationalIntent !== 'emergency_accident') {
      calls.push({
        name: 'search_document_chunks',
        query: input.message,
      })
    }

    return calls
  }

  if (policyId) {
    if (input.agent === 'coverage' || input.agent === 'expiry') {
      calls.push({ name: 'get_coverage_details', policyId })
    }

    if (input.agent === 'insurers' || input.agent === 'emergency') {
      calls.push({ name: 'get_contacts', policyId })
    }
  }

  if (input.agent === 'coverage' || input.agent === 'documental') {
    calls.push({
      name: 'search_document_chunks',
      policyId: explicitPolicyId,
      query: input.message,
    })
  }

  return calls
}

export async function prefetchToolsForAgent(input: {
  agent: MarianaAgentId
  policyHint?: string
  message: string
  context: ToolContext
  policies: MarianaPolicyContext[]
  metadata: PolicyMetadata[]
  decision?: RouteDecision
  cloudAiConsented?: boolean
  queryEmbedding?: number[]
}): Promise<ToolResult[]> {
  const calls = planPrefetchToolCalls({
    agent: input.agent,
    policyHint: input.policyHint,
    message: input.message,
    context: input.context,
    decision: input.decision,
  })

  const toolOptions: AsyncToolOptions = {
    cloudAiConsented: input.cloudAiConsented,
    queryEmbedding: input.queryEmbedding,
  }

  return Promise.all(
    calls.map((call) =>
      executeToolAsync(
        call,
        input.context,
        input.policies,
        input.metadata,
        toolOptions
      )
    )
  )
}
