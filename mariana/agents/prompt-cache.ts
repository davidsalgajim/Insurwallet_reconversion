import type Anthropic from '@anthropic-ai/sdk'

type TextBlockParam = Anthropic.Messages.TextBlockParam

export function buildCachedSystemBlocks(
  staticPrompt: string,
  dynamicSuffix?: string
): TextBlockParam[] {
  const blocks: TextBlockParam[] = [
    {
      type: 'text',
      text: staticPrompt,
      cache_control: { type: 'ephemeral' },
    },
  ]

  if (dynamicSuffix?.trim()) {
    blocks.push({
      type: 'text',
      text: dynamicSuffix,
    })
  }

  return blocks
}
