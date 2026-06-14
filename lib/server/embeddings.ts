/** Google text-embedding-004 — 768 dimensions (matches Firestore vector index). */
export const EMBEDDING_DIMENSION = 768

const EMBEDDING_MODEL = 'text-embedding-004'
const BATCH_SIZE = 32

function resolveEmbeddingApiKey(): string | undefined {
  const key =
    process.env.EMBEDDING_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim()
  return key || undefined
}

export function isEmbeddingsConfigured(): boolean {
  return Boolean(resolveEmbeddingApiKey())
}

type EmbedContentResponse = {
  embedding?: { values?: number[] }
}

type BatchEmbedResponse = {
  embeddings?: Array<{ values?: number[] }>
}

async function embedSingle(
  text: string,
  apiKey: string
): Promise<number[] | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${encodeURIComponent(apiKey)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
    }),
  })

  if (!response.ok) {
    return null
  }

  const body = (await response.json()) as EmbedContentResponse
  const values = body.embedding?.values
  if (!values || values.length !== EMBEDDING_DIMENSION) {
    return null
  }

  return values
}

async function embedBatch(
  texts: string[],
  apiKey: string
): Promise<(number[] | null)[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${encodeURIComponent(apiKey)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
      })),
    }),
  })

  if (!response.ok) {
    return Promise.all(texts.map((text) => embedSingle(text, apiKey)))
  }

  const body = (await response.json()) as BatchEmbedResponse
  const embeddings = body.embeddings ?? []

  return texts.map((_, index) => {
    const values = embeddings[index]?.values
    if (!values || values.length !== EMBEDDING_DIMENSION) {
      return null
    }
    return values
  })
}

/** Embed a single query or chunk. Returns null when API key is missing or the call fails. */
export async function embedText(text: string): Promise<number[] | null> {
  const apiKey = resolveEmbeddingApiKey()
  const normalized = text.trim()
  if (!apiKey || !normalized) {
    return null
  }

  return embedSingle(normalized, apiKey)
}

/** Embed many texts in batches (index-time). Missing vectors are null — caller keeps keyword-only chunks. */
export async function embedTexts(
  texts: string[]
): Promise<(number[] | null)[]> {
  const apiKey = resolveEmbeddingApiKey()
  if (!apiKey || texts.length === 0) {
    return texts.map(() => null)
  }

  const results: (number[] | null)[] = []

  for (let offset = 0; offset < texts.length; offset += BATCH_SIZE) {
    const slice = texts.slice(offset, offset + BATCH_SIZE)
    const batch = await embedBatch(slice, apiKey)
    results.push(...batch)
  }

  return results
}
