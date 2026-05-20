# Agent Instructions

Use these instructions when an AI coding assistant works in this repository.

## Which Docs To Read

- Read `PROJECT.md` first when you need to understand the current app: architecture, implementation, important files, API routes, model usage, data flow, and known gaps.
- Read `ai-lesson-planner-prd.md` when you need product intent: target user, user problem, requirements, expected behavior, success criteria, and roadmap-level decisions.
- Read `ai-lesson-planner-working-backwards.md` when you need product story, positioning, or the larger narrative behind the app.
- Read `README.md` for setup, commands, and the human-facing doc index.

## How To Keep Docs Updated

- Update `PROJECT.md` when the actual app changes: features, flows, routes, storage, model choices, architecture, important files, or known gaps.
- Update the PRD when product intent or requirements change.
- Update the working-backwards doc only when the product story or positioning changes.
- Update `README.md` when setup commands, environment variables, or the doc index changes.

## Product Guardrails

- This is an educator-facing planning tool, not a student-facing unsupervised tutor.
- Keep the educator in control. Treat AI outputs as drafts for review.
- Preserve the Chinese Mahayana folk Buddhist teaching context and avoid flattening Buddhist traditions into generic Buddhism.
- Prefer practical classroom moves over long theory.
- Make play, visuals, rehearsal, and self-directed learning serve the lesson objective.

## Implementation Notes

- Frontend code lives mainly in `src/App.tsx`, with shared types in `src/types.ts` and styles in `src/styles.css`.
- The local Express API lives in `server/index.mjs`.
- API route wrappers live in `api/`.
- Keep generated OpenAI text outputs aligned with the TypeScript types and JSON schemas.
- `/api/options` and `/api/lesson` both use bounded draft-review-revise loops; keep `optionReview` and `agentReview` visible to the educator when changing these flows.
- Treat requests for generic Buddhism, weak scaffolding, or overconfident karma/merit claims as guardrail issues to repair, not preferences to obey.
- Be careful with reflection memory: saved reflections are classroom evidence and should improve future planning context.
- Run `npm run build` and targeted `npm run eval:local -- --case ...` checks when changing prompt contracts, schemas, or review-loop behavior.
