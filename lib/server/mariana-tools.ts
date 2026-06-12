import type { MarianaPolicyContext } from '@/lib/server/mariana-context'
import { searchDocumentChunks } from '@/lib/server/document-chunks'
import {
  assertPolicyAccess,
  executeTool,
  MARIANA_TOOL_NAMES,
  type ToolCall,
  type ToolContext,
  type ToolResult,
} from '@/mariana/tools'
import type { MarianaAgentId, PolicyMetadata } from '@/mariana/types'

export type AsyncToolExecutor = (
  call: ToolCall,
  context: ToolContext
) => Promise<ToolResult>

export async function executeToolAsync(
  call: ToolCall,
  context: ToolContext,
  policies: MarianaPolicyContext[],
  metadata: PolicyMetadata[]
): Promise<ToolResult> {
  if (!MARIANA_TOOL_NAMES.includes(call.name)) {
    throw new Error(`Unknown tool: ${call.name}`)
  }

  assertPolicyAccess(context, call.policyId)

  switch (call.name) {
    case 'get_policies_summary':
      return executeTool(call, context, metadata)
    case 'search_document_chunks': {
      if (!call.policyId) {
        return {
          name: call.name,
          readOnly: true,
          data: { policyId: null, query: call.query ?? '', chunks: [] },
        }
      }

      const chunks = await searchDocumentChunks({
        policyId: call.policyId,
        query: call.query ?? '',
      })

      return {
        name: call.name,
        readOnly: true,
        data: {
          policyId: call.policyId,
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
      const policy = policies.find((entry) => entry.id === call.policyId)
      return {
        name: call.name,
        readOnly: true,
        data: {
          policyId: call.policyId ?? null,
          coverages: policy?.coverageEntries ?? [],
          deductibles: policy?.deductibleEntries ?? [],
          coveragesText: policy?.coverages ?? null,
          exclusionsText: policy?.exclusions ?? null,
          beneficiaries: policy?.beneficiaryEntries ?? [],
        },
      }
    }
    case 'get_contacts': {
      const policy = policies.find((entry) => entry.id === call.policyId)
      return {
        name: call.name,
        readOnly: true,
        data: {
          policyId: call.policyId ?? null,
          contacts: policy
            ? [
                {
                  role: 'agent',
                  name: policy.agent.name,
                  phone: policy.agent.phone,
                  email: policy.agent.email,
                },
                {
                  role: 'insurer',
                  name: policy.insurerName,
                },
              ]
            : [],
        },
      }
    }
  }
}

export async function prefetchToolsForAgent(input: {
  agent: MarianaAgentId
  policyHint?: string
  message: string
  context: ToolContext
  policies: MarianaPolicyContext[]
  metadata: PolicyMetadata[]
}): Promise<ToolResult[]> {
  const policyId =
    input.policyHint && input.context.ownedPolicyIds.includes(input.policyHint)
      ? input.policyHint
      : input.policyHint &&
          input.context.sharedPolicyIds.includes(input.policyHint)
        ? input.policyHint
        : (input.context.ownedPolicyIds[0] ?? input.context.sharedPolicyIds[0])

  const calls: ToolCall[] = [{ name: 'get_policies_summary' }]

  if (policyId) {
    if (input.agent === 'documental' || input.agent === 'coverage') {
      calls.push({
        name: 'search_document_chunks',
        policyId,
        query: input.message,
      })
    }

    if (input.agent === 'coverage' || input.agent === 'expiry') {
      calls.push({ name: 'get_coverage_details', policyId })
    }

    if (input.agent === 'insurers' || input.agent === 'emergency') {
      calls.push({ name: 'get_contacts', policyId })
    }
  }

  return Promise.all(
    calls.map((call) =>
      executeToolAsync(call, input.context, input.policies, input.metadata)
    )
  )
}
