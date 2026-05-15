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
- There is no automated test suite documented yet.
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
