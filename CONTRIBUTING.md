# Contributing to InsurWallet

Thank you for helping build InsurWallet. This document covers how we review changes and ship features safely.

## Branching and commits

- Use feature branches: `feat/`, `fix/`, `refactor/`, `test/`, `chore/`
- Follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `test:`, `chore:`
- One logical change per PR; keep diffs focused
- Mark tasks complete in `tasks/tasks-plan-reconversion-insurwallet.md` when closing a parent task

## Pull request workflow (7.5)

Every feature enters through a PR. Before merge:

1. **CI green** — `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` (and rules tests when touching Firebase rules)
2. **Agent review** — run the appropriate reviewers on the diff:
   - **TypeScript / Next.js:** `typescript-reviewer`
   - **Python worker / MarIAna:** `python-reviewer`
   - **Auth, payments, secrets, user input:** `security-reviewer`
   - **Optional gate:** Bugbot on non-trivial changes
3. **Human review** — address feedback; do not merge with failing checks or unresolved security findings
4. **Task list** — check off sub-tasks and commit message reflects the phase (F0–F7)

### When to run which agent

| Code touched                                                                    | Required reviewers                             |
| ------------------------------------------------------------------------------- | ---------------------------------------------- |
| `app/`, `components/`, `lib/` (TS)                                              | typescript-reviewer                            |
| `worker/`, `mariana/` (Python)                                                  | python-reviewer                                |
| `firestore.rules`, `storage.rules`, `middleware.ts`, auth, API routes, payments | security-reviewer + typescript-reviewer        |
| Large or cross-cutting PR                                                       | security-reviewer + language reviewer + Bugbot |

## Local verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

With Firebase emulators (rules tests):

```bash
npm run emulators:exec -- "npm run test:rules"
npm run emulators:exec -- "npm run test:storage-rules"
```

## Secrets and environment

- Never commit `.env.local`, service account JSON, or API keys
- Copy `.env.example` → `.env.local` for development
- Production/staging secrets live in **Google Secret Manager** — not in the repo
- Observability keys (`SENTRY_DSN`, `POSTHOG_KEY`) are optional locally; stubs no-op when unset

## Design and product context

Before UI work, read `PRODUCT.md` and `DESIGN.md`. Follow project rules in `.cursor/rules/` and `AGENTS.md`.

## Closing a phase (F0–F7)

When finishing a parent task in the task list:

1. Run full verification (above)
2. Run agent reviews per the table
3. Update `tasks/tasks-plan-reconversion-insurwallet.md` with `[x]`
4. Commit with a conventional message describing the phase closure
