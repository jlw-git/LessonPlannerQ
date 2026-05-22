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
- Review generated lesson options with a pedagogy critic and tradition reviewer, revise once when needed, and show a concise educator-facing option review.
- Generate a concise lesson brief with clarifying questions and planning choices, then review and revise it once when needed.
- Update the brief from educator feedback, then review and revise the update once when needed.
- Generate a full lesson plan with objectives, lesson flow, play-based activity, gradual-release self-directed learning, reflection prompts, and educator notes.
- Review generated full lesson plans with a pedagogy critic and tradition reviewer, revise once when needed, and show educator-facing review notes.
- Generate a visual material pack with image prompt, story cards, scenario cards, value cards, storyboard panels, worksheet prompts, and review notes.
- Generate a lesson image from the visual pack prompt.
- Generate rehearsal coaching for difficult student questions and simpler educator language.
- Start a Realtime voice planning session through an ephemeral client secret, using audio-only browser microphone permission and live captions for both PlannerQ speech and educator microphone input.
- Extract voice interview transcripts into editable planning fields for educator review before generating options or briefs.
- Save after-class lesson reflections in browser local storage and include recent reflections as planning memory for future outputs.
- Run local evals against the real Express API routes to check schema contracts and product guardrails.

## How It Is Built

The frontend is a Vite + React + TypeScript app in `src/`.

The local API server is an Express app in `server/index.mjs`. It loads environment variables from `.env.local`, `.env_local`, or `.env`, then exposes `/api/*` routes used by the frontend.

The app uses OpenAI for:

- Structured text generation through the Responses API.
- Image generation through the Images API.
- Realtime voice sessions through Realtime client secrets and WebRTC.

Realtime voice sessions request browser microphone access only. The app does not need system screen recording permission and should not request or document screen recording access.

Default model environment variables are:

- `OPENAI_TEXT_MODEL`, defaulting to `gpt-5.4-mini`.
- `OPENAI_REALTIME_MODEL`, defaulting to `gpt-realtime-2`.
- `OPENAI_IMAGE_MODEL`, defaulting to `gpt-image-2`.

Prompt caching is configured in `server/index.mjs` with a stable shared instruction prefix and `OPENAI_PROMPT_CACHE_RETENTION`.

## LLM vs Rules-Based Responsibilities

Lesson Planner Q should be described as a hybrid system: LLMs draft educator-facing content, while the app supplies workflow structure, constraints, storage, and validation.

LLM-backed behavior:

- `/api/options` asks the text model to generate exactly three comparable lesson approaches.
- `/api/options` then runs a structured option review over the draft options and performs one revision pass when the critic requests changes.
- `/api/interview/extract` asks the text model to convert a voice transcript into editable `topic`, `lessonObjectives`, and `planningRequirements` fields plus review notes.
- `/api/brief` and `/api/brief/update` ask the text model to draft or revise structured lesson briefs, then run critic/tradition review and one revision pass before returning the brief plus `agentReview`.
- `/api/lesson` asks the text model to draft the full 90-minute lesson plan.
- `/api/lesson` then runs a structured agent review over the draft plan and performs one revision pass when the critic requests changes.
- `/api/visuals` asks the text model to draft printable material guidance, story/scenario cards, worksheet prompts, storyboard panels, review notes, and the image prompt.
- `/api/rehearsal` asks the text model to generate likely student questions, simpler language, suggested responses, and coaching notes.
- `/api/image` uses the image model to render one lesson visual from the visual pack prompt.
- `/api/realtime/client-secret` creates a Realtime session for educator-facing voice planning or rehearsal.

Rules-based and deterministic behavior:

- The React app owns the planning workflow, button availability, selected option state, loading states, and rendering of typed artifacts.
- The React app keeps extracted voice interview fields in an educator-review card and applies them to the form only when the educator chooses.
- Form defaults, request payload assembly, and the inclusion of up to five recent reflections in generation requests are handled in `src/App.tsx`.
- Reflection memory is local browser state: reflections are saved to `localStorage`, capped at 20, and can be edited or deleted without an LLM call.
- The Express server owns route boundaries, model selection from environment variables, strict JSON schema contracts, prompt-cache keys, health responses, and API error handling.
- JSON schemas constrain the shape of model responses, but the prose content inside those schemas is still model-generated and requires educator review.
- The eval runner and graders are deterministic checks over route responses; they do not replace human review of religious, cultural, or classroom fit.
- `/api/options` and `/api/lesson` also apply a narrow deterministic sanitizer for known overconfident doctrinal phrases so rejected adversarial wording is not echoed back in educator-facing output.

## How It Works

The main planning flow starts in `src/App.tsx`. The frontend is organized as a streamlined planning workspace: a voice-first start brief, a compact context panel for lesson memory, rehearsal, and next actions that appears once there is planning context or saved memory to act on, and a workflow rail that appears after a full lesson plan exists.

1. The educator enters a topic, objectives, and planning requirements, or starts a realtime voice planning session.
2. The initial screen presents voice planning as the primary path for thinking aloud with PlannerQ, while the typed brief stays available as a secondary fallback.
3. If the educator uses voice, live captions appear during the conversation, then the transcript can be extracted into editable planning fields and applied only after educator review.
4. The frontend builds a request payload containing the form state, the selected lesson option when present, and up to five recent saved lesson reflections.
5. The frontend calls the Express API routes under `/api`.
6. The server sends stable product instructions plus task-specific instructions to OpenAI.
7. Text routes request strict JSON schema output so the frontend can render typed lesson artifacts.
8. The educator can compare options, refine a brief, generate a full plan, create visuals, rehearse explanations, and save reflections after the lesson.

Saved reflections are stored in browser `localStorage` under `lesson-planner-q-reflections`. The app keeps up to 20 saved reflections and sends the five most recent into future planning requests as classroom evidence.

## Agentic Planning Loop

The intended evolution is not to make every screen autonomous. Lesson Planner Q should remain a deterministic educator-controlled workflow, with specialized agents used where they improve planning quality: interviewing, drafting, critique, revision, rehearsal, and memory synthesis.

The implemented slices include structured interview extraction plus server-side critic review and one-pass revision for lesson options, lesson briefs, and full lesson plans. The reflection memory agent should follow later.

The target agentic loop is:

1. Educator talks or types.
2. Interview agent extracts structured planning context.
3. Option agent creates three approaches.
4. Pedagogy critic and tradition reviewer inspect the options.
5. Option agent revises weak options before showing them.
6. Educator selects one.
7. Brief/plan agent drafts.
8. Critic reviews the brief and full plan.
9. Brief/plan agent revises once when needed.
10. Educator sees the draft plus review notes.
11. Rehearsal agent helps the educator practice.
12. After class, reflection agent summarizes classroom evidence into memory.
13. Next planning session starts with that memory.

The deterministic app shell should continue to own navigation, artifact state, schema validation, storage limits, educator review gates, and the rule that the product is educator-facing rather than an unsupervised student agent. Agentic behavior should happen inside those boundaries, so the product feels like a thoughtful planning team while still presenting one coherent PlannerQ experience to the educator.

Agent roles:

- Interview agent: turns voice or typed planning into structured context and clarifying questions. Future work.
- Option agent: creates distinct lesson approaches and revises weak options after critique. Implemented for lesson options.
- Pedagogy critic: checks whether play, visuals, self-directed learning, timeboxes, and classroom moves serve the lesson objective. Implemented for lesson options, lesson briefs, and full lesson plans.
- Tradition reviewer: flags generic Buddhist framing, cultural flattening, doctrinal overclaiming, or places needing educator/temple review. Implemented for lesson options, lesson briefs, and full lesson plans.
- Brief/plan agent: drafts the educator-reviewed brief and full lesson plan from the selected option and critique. Implemented for brief and full lesson plan revision.
- Rehearsal agent: helps the educator practice likely student questions, simpler language, and difficult explanations. Current rehearsal route drafts coaching; live attempt critique remains future work.
- Reflection memory agent: summarizes saved after-class reflections into inspectable classroom evidence for future planning. Future work.

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
- `POST /api/options`: generates three lesson-planning options, then runs critic/tradition review and one revision pass before returning the options plus `optionReview`.
- `POST /api/interview/extract`: extracts voice transcript notes into editable planning fields plus open questions, confidence notes, and a source summary.
- `POST /api/brief`: generates the initial lesson brief, then runs critic/tradition review and one revision pass before returning the brief plus `agentReview`.
- `POST /api/brief/update`: updates an existing brief using educator feedback, then runs critic/tradition review and one revision pass before returning the brief plus `agentReview`.
- `POST /api/lesson`: generates the full lesson plan, then runs critic/tradition review and one revision pass before returning the plan plus `agentReview`.
- `POST /api/visuals`: generates the printable visual material pack.
- `POST /api/rehearsal`: generates educator rehearsal coaching.
- `POST /api/image`: generates one image from a visual prompt.
- `POST /api/realtime/client-secret`: creates a short-lived realtime client secret for voice planning.

## Evals

Local evals live in `evals/` and run with:

```bash
npm run eval:local
```

The runner imports the Express app, starts it on an ephemeral local port, sends each JSONL case through the real route, and writes `evals/results/latest.json`. It requires `OPENAI_API_KEY` unless `--server-url` points to an already-running compatible API. Current checks cover response schemas, educator control, Chinese Mahayana folk Buddhist context, practical classroom moves, gradual release, reflection-memory use, visual cultural review, rehearsal simplicity, option and lesson agent-review shape, pedagogy/tradition review signals, and review-note traceability. Option and lesson eval cases now include adversarial prompts for weak scaffolding, generic Buddhist framing, and overconfident doctrinal claims.

## Key Product Principles

- Keep the educator in control. AI output is a draft for educator review.
- Be respectful and specific about Buddhist context. Do not flatten all Buddhist traditions into one generic frame.
- Prefer classroom moves over long theory.
- Use play and visuals only when they support the learning goal.
- Scaffold self-directed learning with clear goals, choices, timeboxes, check-ins, and reflection.
- Use lesson reflections as evidence from the actual classroom, not as decorative history.

## Next Build Priorities

Current implementation priorities, in order:

1. Polish the core weekly planning loop: voice or typed input, reviewed options, selected brief, rehearsal, full plan, visual/export, and reflection.
2. Add editable and exportable lesson artifacts, starting with printable lesson plans and visual packs.
3. Upgrade rehearsal from static coaching into a practice loop where the educator can try an explanation and receive feedback on clarity, tone, age fit, and doctrinal caution.
4. Build reflection memory synthesis so saved reflections become inspectable classroom evidence, not only raw local notes passed into prompts.
5. Add a small curated Buddhist and pedagogy reference layer to improve trust, source quality, and tradition-specific planning.
6. Instrument MVP success metrics such as time to usable plan, option selection, brief refinement, rehearsal use, visual generation, reflection save rate, and repeat weekly use.

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
