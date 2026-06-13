import type { PolicyMetadata } from '@/mariana/types'

export const MARIANA_TOOL_NAMES = [
  'get_policies_summary',
  'get_policies_by_type',
  'get_coverage_for_event',
  'get_benefits_assistances',
  'search_document_chunks',
  'get_coverage_details',
  'get_contacts',
] as const

export type MarianaToolName = (typeof MARIANA_TOOL_NAMES)[number]

export type ToolContext = {
  uid: string
  ownedPolicyIds: string[]
  sharedPolicyIds: string[]
}

export type ToolCall = {
  name: MarianaToolName
  policyId?: string
  query?: string
  policyTypes?: string[]
}

export type ToolResult = {
  name: MarianaToolName
  data: unknown
  readOnly: true
}

function allowedPolicyIds(context: ToolContext): Set<string> {
  return new Set([...context.ownedPolicyIds, ...context.sharedPolicyIds])
}

export function assertPolicyAccess(
  context: ToolContext,
  policyId: string | undefined
): void {
  if (!policyId) {
    return
  }

  if (!allowedPolicyIds(context).has(policyId)) {
    throw new Error('Unauthorized policy access')
  }
}

function filterPoliciesForContext(
  context: ToolContext,
  policies: PolicyMetadata[]
): PolicyMetadata[] {
  return policies.filter((policy) => allowedPolicyIds(context).has(policy.id))
}

export function executeTool(
  call: ToolCall,
  context: ToolContext,
  policies: PolicyMetadata[] = []
): ToolResult {
  if (!MARIANA_TOOL_NAMES.includes(call.name)) {
    throw new Error(`Unknown tool: ${call.name}`)
  }

  assertPolicyAccess(context, call.policyId)

  const scopedPolicies = filterPoliciesForContext(context, policies)

  switch (call.name) {
    case 'get_policies_summary':
      return {
        name: call.name,
        readOnly: true,
        data: scopedPolicies,
      }
    case 'get_policies_by_type': {
      const types = call.policyTypes?.map((type) => type.toLowerCase()) ?? []
      const filtered =
        types.length === 0
          ? scopedPolicies
          : scopedPolicies.filter((policy) =>
              types.includes(policy.policyType.toLowerCase())
            )
      return {
        name: call.name,
        readOnly: true,
        data: {
          policyTypes: call.policyTypes ?? [],
          policies: filtered,
        },
      }
    }
    case 'get_coverage_for_event':
      return {
        name: call.name,
        readOnly: true,
        data: {
          query: call.query ?? '',
          policyTypes: call.policyTypes ?? [],
          matches: [],
        },
      }
    case 'get_benefits_assistances':
      return {
        name: call.name,
        readOnly: true,
        data: {
          query: call.query ?? '',
          policyTypes: call.policyTypes ?? [],
          benefits: [],
        },
      }
    case 'search_document_chunks':
      return {
        name: call.name,
        readOnly: true,
        data: {
          policyId: call.policyId ?? null,
          query: call.query ?? '',
          chunks: [],
        },
      }
    case 'get_coverage_details':
      return {
        name: call.name,
        readOnly: true,
        data: {
          policyId: call.policyId ?? null,
          coverages: [],
        },
      }
    case 'get_contacts':
      return {
        name: call.name,
        readOnly: true,
        data: {
          policyId: call.policyId ?? null,
          contacts: [],
        },
      }
  }
}
