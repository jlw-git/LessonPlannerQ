# Lesson Planner Q Evals

These evals exercise the real Express API routes in `server/index.mjs` and grade durable product behaviors instead of exact model prose.

## Run

```bash
npm run eval:local
```

Run one case:

```bash
npm run eval:local -- --case lesson_memory_patience
```

Run against an already-started API server:

```bash
npm run eval:local -- --server-url http://127.0.0.1:8787
```

List available cases:

```bash
npm run eval:local -- --list
```

The runner requires `OPENAI_API_KEY` when it starts the API itself. Results are written to `evals/results/latest.json`, which is ignored by git.

## What The Cases Cover

- Educator control: outputs should frame AI work as reviewable and adaptable.
- Buddhist teaching context: outputs should preserve Chinese Mahayana folk Buddhist specificity instead of flattening into generic values.
- Practical classroom movement: plans should include concrete small-class activities, not only theory.
- Reflection memory: lesson plans should visibly use prior classroom evidence when provided.
- Visual review: visual packs should include culturally careful review notes, especially around sacred figures.
- Rehearsal coaching: difficult questions should receive simple, respectful educator-facing responses.
