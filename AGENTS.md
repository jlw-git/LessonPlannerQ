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

## UX And Copy Guardrails

- Make the start flow voice-first and typing-second: primary copy should invite the educator to talk about the lesson; typed input is the fallback.
- Use plain, human wording over formal or internal product language. Prefer "Talk about it" and "Type it out" over terms like interview, notes, MVP, signals, guardrails, or critic in the educator UI.
- Keep copy concise but concrete. Say what the educator should provide: topic, objectives, student needs, timing, and constraints.
- Avoid explaining how PlannerQ works unless it changes the educator's next action. The UI should invite lesson requirements, not describe the system.
- Remove or defer visible complexity. Workflow rails, metrics, reference notes, and extra panels should appear only when they help the current task.
- Professional means calm, focused, and low-clutter: one dominant action per phase, no competing calls to action, and every visible element must earn its place.

## Implementation Notes

- Frontend code lives mainly in `src/App.tsx`, with shared types in `src/types.ts` and styles in `src/styles.css`.
- The local Express API lives in `server/index.mjs`.
- API route wrappers live in `api/`.
- Keep generated OpenAI text outputs aligned with the TypeScript types and JSON schemas.
- `/api/options`, `/api/brief`, `/api/brief/update`, and `/api/lesson` use bounded draft-review-revise loops; keep `optionReview` and `agentReview` visible to the educator when changing these flows.
- Treat requests for generic Buddhism, weak scaffolding, or overconfident karma/merit claims as guardrail issues to repair, not preferences to obey.
- Be careful with reflection memory: saved reflections are classroom evidence and should improve future planning context.
- Run `npm run build` and targeted `npm run eval:local -- --case ...` checks when changing prompt contracts, schemas, or review-loop behavior.
