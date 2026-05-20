# Lesson Planner Q Project Notes

This is a living project document. Update it whenever the product's behavior, structure, data flow, or important decisions change.

## What This Is

Lesson Planner Q is an AI-powered lesson preparation studio for Chinese Mahayana folk Buddhist educators teaching small 90-minute classes of 13-year-old students.

The product helps an educator move from a rough topic or voice planning conversation into lesson options, an educator-reviewed brief, a full lesson plan, printable visual material ideas, rehearsal coaching, and after-class reflection memory.

## Who It Is For

The primary user is an educator preparing small-group Buddhist education lessons. The app is educator-facing, not a student-facing unsupervised tutor.

The current teaching context assumes:

- Chinese Mahayana folk Buddhist education.
- A small class, currently described in the server prompt as four students.
- Students around age 13.
- 90-minute weekly lessons unless the educator specifies otherwise.
- Practical, respectful, age-appropriate links between Buddhist ideas and everyday life.

## Current Capabilities

- Generate three distinct lesson-planning options before committing to a plan.
- Generate a concise lesson brief with clarifying questions and planning choices.
- Update the brief from educator feedback.
- Generate a full lesson plan with objectives, lesson flow, play-based activity, gradual-release self-directed learning, reflection prompts, and educator notes.
- Generate a visual material pack with image prompt, story cards, scenario cards, value cards, storyboard panels, worksheet prompts, and review notes.
- Generate a lesson image from the visual pack prompt.
- Generate rehearsal coaching for difficult student questions and simpler educator language.
- Start a Realtime voice planning session through an ephemeral client secret.
- Save after-class lesson reflections in browser local storage and include recent reflections as planning memory for future outputs.
- Run local evals against the real Express API routes to check schema contracts and product guardrails.

## How It Is Built

The frontend is a Vite + React + TypeScript app in `src/`.

The local API server is an Express app in `server/index.mjs`. It loads environment variables from `.env.local`, `.env_local`, or `.env`, then exposes `/api/*` routes used by the frontend.

The app uses OpenAI for:

- Structured text generation through the Responses API.
- Image generation through the Images API.
- Realtime voice sessions through Realtime client secrets and WebRTC.

Default model environment variables are:

- `OPENAI_TEXT_MODEL`, defaulting to `gpt-5.4-mini`.
- `OPENAI_REALTIME_MODEL`, defaulting to `gpt-realtime-2`.
- `OPENAI_IMAGE_MODEL`, defaulting to `gpt-image-2`.

Prompt caching is configured in `server/index.mjs` with a stable shared instruction prefix and `OPENAI_PROMPT_CACHE_RETENTION`.

## LLM vs Rules-Based Responsibilities

Lesson Planner Q should be described as a hybrid system: LLMs draft educator-facing content, while the app supplies workflow structure, constraints, storage, and validation.

LLM-backed behavior:

- `/api/options` asks the text model to generate exactly three comparable lesson approaches.
- `/api/brief` and `/api/brief/update` ask the text model to draft or revise structured lesson briefs.
- `/api/lesson` asks the text model to draft the full 90-minute lesson plan.
- `/api/visuals` asks the text model to draft printable material guidance, story/scenario cards, worksheet prompts, storyboard panels, review notes, and the image prompt.
- `/api/rehearsal` asks the text model to generate likely student questions, simpler language, suggested responses, and coaching notes.
- `/api/image` uses the image model to render one lesson visual from the visual pack prompt.
- `/api/realtime/client-secret` creates a Realtime session for educator-facing voice planning or rehearsal.

Rules-based and deterministic behavior:

- The React app owns the planning workflow, button availability, selected option state, loading states, and rendering of typed artifacts.
- Form defaults, request payload assembly, and the inclusion of up to five recent reflections in generation requests are handled in `src/App.tsx`.
- Reflection memory is local browser state: reflections are saved to `localStorage`, capped at 20, and can be edited or deleted without an LLM call.
- The Express server owns route boundaries, model selection from environment variables, strict JSON schema contracts, prompt-cache keys, health responses, and API error handling.
- JSON schemas constrain the shape of model responses, but the prose content inside those schemas is still model-generated and requires educator review.
- The eval runner and graders are deterministic checks over route responses; they do not replace human review of religious, cultural, or classroom fit.

## How It Works

The main planning flow starts in `src/App.tsx`. The frontend is organized as a planning cockpit: a persistent workflow rail, a central planning workspace, and a compact context panel for lesson memory, rehearsal, and next actions.

1. The educator enters a topic, objectives, and planning requirements, or starts a realtime voice planning session.
2. The frontend builds a request payload containing the form state, the selected lesson option when present, and up to five recent saved lesson reflections.
3. The frontend calls the Express API routes under `/api`.
4. The server sends stable product instructions plus task-specific instructions to OpenAI.
5. Text routes request strict JSON schema output so the frontend can render typed lesson artifacts.
6. The educator can compare options, refine a brief, generate a full plan, create visuals, rehearse explanations, and save reflections after the lesson.

Saved reflections are stored in browser `localStorage` under `lesson-planner-q-reflections`. The app keeps up to 20 saved reflections and sends the five most recent into future planning requests as classroom evidence.

## Important Files and Folders

- `src/App.tsx`: main React application, planning workflow, realtime client flow, reflection memory UI, and API calls.
- `src/types.ts`: TypeScript types for lesson plans, briefs, options, visual packs, and rehearsal output.
- `src/styles.css`: application styling.
- `server/index.mjs`: Express API server, OpenAI client setup, shared product instructions, JSON schemas, and route handlers.
- `api/`: serverless-style API entrypoints/proxies for deployment environments.
- `evals/`: local JSONL eval cases, deterministic graders, and a runner that exercises real API routes.
- `README.md`: setup instructions and quick project summary.
- `ai-lesson-planner-prd.md`: product requirements document.
- `ai-lesson-planner-working-backwards.md`: working-backwards product framing.
- `.env.example`: environment variable example for local setup.

## API Routes

- `GET /api/health`: returns API health, model names, key presence, and prompt-cache configuration.
- `POST /api/options`: generates three lesson-planning options.
- `POST /api/brief`: generates the initial lesson brief.
- `POST /api/brief/update`: updates an existing brief using educator feedback.
- `POST /api/lesson`: generates the full lesson plan.
- `POST /api/visuals`: generates the printable visual material pack.
- `POST /api/rehearsal`: generates educator rehearsal coaching.
- `POST /api/image`: generates one image from a visual prompt.
- `POST /api/realtime/client-secret`: creates a short-lived realtime client secret for voice planning.

## Evals

Local evals live in `evals/` and run with:

```bash
npm run eval:local
```

The runner imports the Express app, starts it on an ephemeral local port, sends each JSONL case through the real route, and writes `evals/results/latest.json`. It requires `OPENAI_API_KEY` unless `--server-url` points to an already-running compatible API. Current checks cover response schemas, educator control, Chinese Mahayana folk Buddhist context, practical classroom moves, gradual release, reflection-memory use, visual cultural review, and rehearsal simplicity.

## Key Product Principles

- Keep the educator in control. AI output is a draft for educator review.
- Be respectful and specific about Buddhist context. Do not flatten all Buddhist traditions into one generic frame.
- Prefer classroom moves over long theory.
- Use play and visuals only when they support the learning goal.
- Scaffold self-directed learning with clear goals, choices, timeboxes, check-ins, and reflection.
- Use lesson reflections as evidence from the actual classroom, not as decorative history.

## Known Gaps

- Reflection memory is local to the browser, so it does not sync across devices.
- Generated materials are not yet exported as printable PDFs or editable document files.
- There is no user account system or persistent database.
- There is a focused local eval harness, but no broader unit or browser test suite yet.
- Cultural or doctrinal review still depends on educator judgment.

## How To Run Locally

```bash
npm install
npm run dev
```

The web app runs at `http://127.0.0.1:5173`, and the API runs at `http://127.0.0.1:8787`.

## When To Update This File

Update this file when:

- A major feature is added, removed, or renamed.
- The product flow changes.
- New routes, storage, models, or external services are added.
- The teaching audience or product assumptions change.
- A key technical or product decision is made.
- A known gap is closed or a new meaningful gap appears.
