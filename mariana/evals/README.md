# MarIAna structural evals

Deterministic evaluation suite for MarIAna routing, tool prefetch, and specialist prompt coverage — **no LLM calls**.

## What is checked

Each scenario in `scenarios/` defines:

| Field                            | Structural check                                                       |
| -------------------------------- | ---------------------------------------------------------------------- |
| `expectedBehavior.route`         | `routeMessage()` agent, `situationalIntent`, `policyTypes`, confidence |
| `expectedBehavior.tools`         | `prefetchToolsForAgent()` includes tool names                          |
| `expectedBehavior.shouldAsk`     | Specialist prompt contains guidance terms                              |
| `expectedBehavior.shouldMention` | Base + specialist prompts contain topic terms                          |

## Layout

```
mariana/evals/
├── README.md
├── types.ts
├── structural-eval.ts      # runner + summary
├── structural.eval.test.ts # Vitest gate
└── scenarios/
    ├── index.ts            # ALL_EVAL_SCENARIOS (10 types × 12 = 120)
    ├── life.ts … other.ts
```

## Run

```bash
npm run test -- mariana/evals/structural.eval.test.ts
npm run test -- mariana/evals
```

## Adding scenarios

1. Add to the matching `scenarios/<type>.ts` file (keep ≥10 per `PolicyType`).
2. Set `id` as `<type>-NN`.
3. Prefer situational messages that hit `mariana/situational.ts` patterns.
4. Run structural evals before merging.

## Gaps (known)

- Structural evals do **not** validate final LLM answer quality — only router/tools/prompts.
- Haiku fallback routing is not exercised (deterministic router only).
- `health_event` shares patterns with `life_event` for severe illness; disambiguation relies on message wording.
