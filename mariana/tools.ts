import type { PolicyMetadata } from '@/mariana/types'

export const MARIANA_TOOL_NAMES = [
  'get_policies_summary',
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

export function executeTool(
  call: ToolCall,
  context: ToolContext,
  policies: PolicyMetadata[] = []
): ToolResult {
  if (!MARIANA_TOOL_NAMES.includes(call.name)) {
    throw new Error(`Unknown tool: ${call.name}`)
  }

  assertPolicyAccess(context, call.policyId)

  switch (call.name) {
    case 'get_policies_summary':
      return {
        name: call.name,
        readOnly: true,
        data: policies.filter((policy) =>
          allowedPolicyIds(context).has(policy.id)
        ),
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
