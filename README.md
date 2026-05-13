# Lesson Planner Q

AI-powered lesson preparation studio for Chinese Mahayana folk Buddhist educators teaching small 90-minute classes of 13-year-old students.

## What It Does

- Generates weekly 90-minute lesson plans.
- Supports play-based learning and scaffolded self-directed learning.
- Provides an educator rehearsal coach for difficult student questions.
- Creates visual-pack prompts, story cards, scenario cards, and reflection worksheet prompts.
- Can generate lesson visuals with GPT Image 2.
- Includes a Realtime 2 voice coach entry point for educator-facing lesson planning interviews.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and add your OpenAI API key.

   Prompt caching is enabled automatically for repeated OpenAI text requests. Keep `OPENAI_PROMPT_CACHE_RETENTION=in_memory` for the default cache behavior, or set it to `24h` if your selected model supports extended prompt cache retention. Set `LOG_PROMPT_CACHE=1` while developing to print cached input token counts for each text generation route.

3. Start the app:

```bash
npm run dev
```

The web app runs at [http://127.0.0.1:5173](http://127.0.0.1:5173), and the API runs at `http://127.0.0.1:8787`.

## Product Docs

- [Working Backwards One-Pager](./ai-lesson-planner-working-backwards.md)
- [Product Requirements Document](./ai-lesson-planner-prd.md)
