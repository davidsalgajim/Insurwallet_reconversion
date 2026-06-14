# MarIAna — Multi-agent insurance assistant

MarIAna answers insurance questions using read-only tools scoped server-side by Firebase Auth `uid`. The chat endpoint streams SSE deltas from specialist agents after deterministic routing.

## Architecture

```
User message
    → Tier 0 (Firestore templates, no LLM)
    → Haiku router (intent + entities)
    → Specialist agent (Sonnet) + prefetched tools
    → SSE stream with citations
```

| Module                        | Role                                                 |
| ----------------------------- | ---------------------------------------------------- |
| `router.ts`                   | Deterministic intent matching                        |
| `haiku-router.ts`             | LLM classification when Tier 0 misses                |
| `agents/`                     | System prompts (5 core + 10 policy-type specialists) |
| `stream.ts`                   | Orchestrates routing, tool prefetch, streaming       |
| `tools.ts`                    | Sync tool definitions + access checks                |
| `lib/server/mariana-tools.ts` | Async tools (Firestore, RAG)                         |
| `guardrails.ts`               | Rate limits, scope check, `<document_data>` wrapper  |

## RAG (hybrid retrieval)

Document text is chunked (~500 tokens) into Firestore:

`policies/{policyId}/documents/{docId}/chunks/{chunkId}`

### Indexing

Triggered when the user confirms policy review (`POST /api/policies/{id}/index-documents`).

1. Chunk extracted summary + policy fields
2. If **cloud AI consent** is accepted and `EMBEDDING_API_KEY` / `GOOGLE_AI_API_KEY` is set → embed with Google **text-embedding-004** (768-dim)
3. Store `embedding: number[]` on each chunk (optional — keyword search still works without it)

### Query-time search

`search_document_chunks` tool:

1. Embeds the user query (same model, consent + API key required)
2. **Hybrid score**: `max(keyword, 0.35×keyword + 0.65×cosine)`
3. When no explicit policy hint → searches all owned/shared policies (top 8)
4. Results wrapped in `<document_data>` before reaching the LLM

Firestore vector index (`firestore.indexes.json`, 768-dim flat) is deployed for future native `findNearest`; current implementation uses in-memory cosine over fetched chunks (<100 per user initially).

### Environment

```bash
EMBEDDING_API_KEY=...   # or GOOGLE_AI_API_KEY
ANTHROPIC_API_KEY=...   # chat + Haiku router
```

Without an embedding key, MarIAna falls back to keyword overlap search.

## Evals

Structural evals (no LLM) live in `mariana/evals/` — see [`evals/README.md`](evals/README.md).
