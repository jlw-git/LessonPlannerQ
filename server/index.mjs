import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

const root = process.cwd();
for (const file of [".env.local", ".env_local", ".env"]) {
  const candidate = path.join(root, file);
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate, override: false, quiet: true });
  }
}

const app = express();
const port = Number(process.env.PORT || 8787);
const textModel = process.env.OPENAI_TEXT_MODEL || "gpt-5.4-mini";
const realtimeModel = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const requestedPromptCacheRetention = process.env.OPENAI_PROMPT_CACHE_RETENTION || "in_memory";
const promptCacheRetention = ["in_memory", "24h"].includes(requestedPromptCacheRetention)
  ? requestedPromptCacheRetention
  : "in_memory";
const promptCacheVersion = "lesson-planner-q:v2";
const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

app.use(express.json({ limit: "8mb" }));

const baseContext = `You are Lesson Planner Q, an educator-facing AI product for Chinese Mahayana folk Buddhist education.
The educator teaches 13-year-old students in a small class of 4.
Lessons are usually 90 minutes unless the educator specifies otherwise.
Create practical, respectful, age-appropriate lessons that help students apply Buddhist teachings to real life.
Do not present Buddhism as one uniform tradition. Label the initial focus as Chinese Mahayana folk Buddhism.
Prefer play-based learning and scaffolded self-directed learning using gradual release: I do, We do, You do.
Keep the educator in control. Mark outputs as drafts for educator review.`;

const cachedInstructionPrefix = `${baseContext}

Stable product contract for every generated artifact:
- Optimize for an educator preparing one realistic weekly lesson, not for a student using an unsupervised tutor.
- Treat voice interview notes, typed notes, prior brief, selected option, rehearsal notes, and visual pack outputs as educator-provided planning context.
- Preserve the educator's agency. Suggest, scaffold, and explain tradeoffs; do not imply that AI output is authoritative religious instruction.
- Keep Buddhist teaching references respectful, concrete, and age-appropriate. Use Chinese Mahayana folk Buddhist context carefully and avoid collapsing different Buddhist traditions into one generic Buddhism.
- Connect abstract ideas to ordinary 13-year-old life: friendship conflict, school stress, exclusion, online group chat, family responsibility, embarrassment, disappointment, attention, and kindness under pressure.
- Prefer small-class dynamics for four students: paired practice, round-robin roles, quick reflection turns, short scenarios, visible artifacts, and educator checkpoints.
- Plan for a 90-minute session with pacing that can flex if students are restless, finish early, or need a calmer reset.
- Use gradual release as the default scaffold: the educator models first, the class practices together, then students make a supported choice or artifact independently.
- Make play purposeful. Games, role-play, cards, storyboards, and movement should support the learning outcome rather than feel decorative.
- When recommending self-directed learning, provide enough structure that students know the goal, options, timebox, check-in moment, and reflection prompt.
- When recommending visual materials, describe what each item helps students do: notice, compare, choose, remember, discuss, arrange, rehearse, or reflect.
- When recommending rehearsal, focus on the educator's confidence: simpler language, likely student objections, respectful answers, pacing, and transitions.
- If lessonMemory is provided, treat it as classroom evidence from past lessons. Consider the lesson plan that was actually used, build on what worked, adjust what did not work, and carry forward next-time notes into the new lesson design.
- Use concise language by default. Favor specific classroom moves over long theory. Avoid generic moralizing, vague inspiration, or unsupported doctrinal claims.
- If a question is culturally or doctrinally sensitive, flag it for educator review instead of overconfidently resolving it.
- Return only content that matches the requested JSON schema. Do not include markdown fences, commentary outside the JSON object, or fields not present in the schema.

Prompt-cache note: this shared prefix is intentionally stable across text generation routes. Task-specific instructions and dynamic lesson context appear after this prefix.`;

function buildInstructions(taskInstructions) {
  return `${cachedInstructionPrefix}

Task-specific instructions:
${taskInstructions}`;
}

function sortJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortJsonValue(value[key])])
    );
  }

  return value;
}

function stableStringify(value) {
  return JSON.stringify(sortJsonValue(value));
}

function cachedInputTokens(response) {
  return (
    response.usage?.input_tokens_details?.cached_tokens ??
    response.usage?.prompt_tokens_details?.cached_tokens ??
    0
  );
}

async function readUpstreamJson(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: {
        message: text.replace(/\s+/g, " ").trim().slice(0, 240) || "Upstream returned a non-JSON response."
      }
    };
  }
}

const lessonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    traditionNote: { type: "string" },
    summary: { type: "string" },
    learningObjectives: { type: "array", items: { type: "string" } },
    teachingAnchor: { type: "string" },
    lessonFlow: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          segment: { type: "string" },
          duration: { type: "string" },
          educatorMove: { type: "string" },
          studentAction: { type: "string" }
        },
        required: ["segment", "duration", "educatorMove", "studentAction"]
      }
    },
    playBasedActivity: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        materials: { type: "array", items: { type: "string" } },
        instructions: { type: "array", items: { type: "string" } },
        debriefQuestions: { type: "array", items: { type: "string" } }
      },
      required: ["name", "materials", "instructions", "debriefQuestions"]
    },
    selfDirectedLearning: {
      type: "object",
      additionalProperties: false,
      properties: {
        framework: { type: "string" },
        iDo: { type: "string" },
        weDo: { type: "string" },
        youDo: { type: "string" },
        checkpoints: { type: "array", items: { type: "string" } }
      },
      required: ["framework", "iDo", "weDo", "youDo", "checkpoints"]
    },
    reflection: { type: "array", items: { type: "string" } },
    realLifeApplication: { type: "string" },
    takeHome: { type: "string" },
    educatorNotes: { type: "array", items: { type: "string" } },
    reviewNotes: { type: "array", items: { type: "string" } }
  },
  required: [
    "title",
    "traditionNote",
    "summary",
    "learningObjectives",
    "teachingAnchor",
    "lessonFlow",
    "playBasedActivity",
    "selfDirectedLearning",
    "reflection",
    "realLifeApplication",
    "takeHome",
    "educatorNotes",
    "reviewNotes"
  ]
};

const briefSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    briefSummary: { type: "string" },
    studentTakeaway: { type: "string" },
    clarifyingQuestions: { type: "array", items: { type: "string" } },
    keyChoices: { type: "array", items: { type: "string" } },
    suggestedStructure: { type: "array", items: { type: "string" } },
    visualPackRecommended: { type: "boolean" },
    visualPackRationale: { type: "string" },
    rehearsalRecommended: { type: "boolean" },
    rehearsalFocus: { type: "string" },
    changeLog: { type: "array", items: { type: "string" } },
    reviewPrompts: { type: "array", items: { type: "string" } }
  },
  required: [
    "title",
    "briefSummary",
    "studentTakeaway",
    "clarifyingQuestions",
    "keyChoices",
    "suggestedStructure",
    "visualPackRecommended",
    "visualPackRationale",
    "rehearsalRecommended",
    "rehearsalFocus",
    "changeLog",
    "reviewPrompts"
  ]
};

const lessonOptionsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    options: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          approach: { type: "string" },
          bestFor: { type: "string" },
          lessonShape: { type: "array", items: { type: "string" } },
          activities: { type: "array", items: { type: "string" } },
          tradeoffs: { type: "array", items: { type: "string" } },
          visualPackRecommended: { type: "boolean" },
          rehearsalFocus: { type: "string" }
        },
        required: [
          "title",
          "approach",
          "bestFor",
          "lessonShape",
          "activities",
          "tradeoffs",
          "visualPackRecommended",
          "rehearsalFocus"
        ]
      }
    }
  },
  required: ["options"]
};

const visualSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    packTitle: { type: "string" },
    imagePrompt: { type: "string" },
    styleGuidance: { type: "string" },
    storyCards: { type: "array", items: { type: "string" } },
    scenarioCards: { type: "array", items: { type: "string" } },
    valueCards: { type: "array", items: { type: "string" } },
    storyboardPanels: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          panel: { type: "string" },
          caption: { type: "string" },
          studentPrompt: { type: "string" }
        },
        required: ["panel", "caption", "studentPrompt"]
      }
    },
    worksheetPrompts: { type: "array", items: { type: "string" } },
    reviewNotes: { type: "array", items: { type: "string" } }
  },
  required: [
    "packTitle",
    "imagePrompt",
    "styleGuidance",
    "storyCards",
    "scenarioCards",
    "valueCards",
    "storyboardPanels",
    "worksheetPrompts",
    "reviewNotes"
  ]
};

const rehearsalSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    scenario: { type: "string" },
    studentQuestions: { type: "array", items: { type: "string" } },
    suggestedResponses: { type: "array", items: { type: "string" } },
    simplerLanguage: { type: "array", items: { type: "string" } },
    coachingNotes: { type: "array", items: { type: "string" } }
  },
  required: ["scenario", "studentQuestions", "suggestedResponses", "simplerLanguage", "coachingNotes"]
};

function requireClient() {
  if (!client) {
    const error = new Error("OPENAI_API_KEY is missing. Add it to .env.local or .env_local.");
    error.status = 500;
    throw error;
  }
  return client;
}

async function createJson({ instructions, input, schema, schemaName }) {
  const openai = requireClient();
  const response = await openai.responses.create({
    model: textModel,
    instructions: buildInstructions(instructions),
    input: stableStringify(input),
    prompt_cache_key: `${promptCacheVersion}:${textModel}:${schemaName}`,
    prompt_cache_retention: promptCacheRetention,
    reasoning: { effort: "low" },
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        schema,
        strict: true
      }
    }
  });

  if (process.env.LOG_PROMPT_CACHE === "1") {
    console.log(
      `[prompt-cache] ${schemaName}: ${cachedInputTokens(response)} cached input tokens`
    );
  }

  const outputText = response.output_text;
  if (!outputText) {
    throw new Error("The model returned no text output.");
  }
  return JSON.parse(outputText);
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    hasOpenAIKey: Boolean(apiKey),
    textModel,
    realtimeModel,
    imageModel,
    promptCacheRetention,
    promptCacheVersion
  });
});

app.post("/api/lesson", async (req, res, next) => {
  try {
    const payload = req.body;
    const lesson = await createJson({
      schema: lessonSchema,
      schemaName: "lesson_plan",
      instructions: "Generate one complete weekly lesson plan. Make it feasible for a small class and avoid generic moralizing.",
      input: payload
    });
    res.json(lesson);
  } catch (error) {
    next(error);
  }
});

app.post("/api/brief", async (req, res, next) => {
  try {
    const brief = await createJson({
      schema: briefSchema,
      schemaName: "lesson_brief",
      instructions: `Generate a concise educator-reviewed lesson brief before the full lesson plan.
Include clarifying questions the lesson planner would ask after the voice interview.
Recommend whether a visual pack and rehearsal coach should be used next.`,
      input: req.body
    });
    res.json(brief);
  } catch (error) {
    next(error);
  }
});

app.post("/api/options", async (req, res, next) => {
  try {
    const options = await createJson({
      schema: lessonOptionsSchema,
      schemaName: "lesson_options",
      instructions: `Generate exactly three distinct lesson plan options the educator can compare before committing to a brief.
Make the options meaningfully different in pedagogy, pacing, and material needs.
Keep each option concise and scannable.`,
      input: req.body
    });
    res.json(options);
  } catch (error) {
    next(error);
  }
});

app.post("/api/brief/update", async (req, res, next) => {
  try {
    const brief = await createJson({
      schema: briefSchema,
      schemaName: "updated_lesson_brief",
      instructions: `Update the existing lesson brief using the educator's feedback.
Preserve useful prior decisions, revise what the educator asked to change, and update visual/rehearsal recommendations if needed.`,
      input: req.body
    });
    res.json(brief);
  } catch (error) {
    next(error);
  }
});

app.post("/api/rehearsal", async (req, res, next) => {
  try {
    const rehearsal = await createJson({
      schema: rehearsalSchema,
      schemaName: "rehearsal_coach",
      instructions: "Simulate realistic, respectful 13-year-old questions and coach the educator to explain more clearly.",
      input: req.body
    });
    res.json(rehearsal);
  } catch (error) {
    next(error);
  }
});

app.post("/api/visuals", async (req, res, next) => {
  try {
    const visuals = await createJson({
      schema: visualSchema,
      schemaName: "visual_material_pack",
      instructions: "Create a printable visual pack plan. Avoid casual depictions of sacred figures unless the educator specifically requested them. Include cultural review notes.",
      input: req.body
    });
    res.json(visuals);
  } catch (error) {
    next(error);
  }
});

app.post("/api/image", async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "Image prompt is required." });
      return;
    }
    const openai = requireClient();
    const image = await openai.images.generate({
      model: imageModel,
      prompt,
      size: "1024x1024",
      quality: "medium",
      n: 1
    });
    const first = image.data?.[0];
    res.json({
      b64: first?.b64_json || null,
      url: first?.url || null,
      revisedPrompt: first?.revised_prompt || null
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/realtime/client-secret", async (req, res, next) => {
  try {
    requireClient();
    const context = req.body?.context || {};
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        expires_after: {
          anchor: "created_at",
          seconds: 600
        },
        session: {
          type: "realtime",
          model: realtimeModel,
          instructions: `${baseContext}
You are the voice-based lesson planning interview and educator rehearsal coach.
Ask one concise follow-up question at a time. Help the educator shape a 90-minute lesson plan.
Keep the conversation educator-facing and do not speak directly to students as an unsupervised tutor.
Current lesson context: ${JSON.stringify(context)}`,
          audio: {
            output: {
              voice: "marin"
            }
          }
        }
      })
    });

    const data = await readUpstreamJson(response);
    if (!response.ok) {
      res.status(response.status).json({ error: data.error?.message || "Failed to create realtime client secret." });
      return;
    }
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.message || "Unexpected server error"
  });
});

export { app };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(port, () => {
    console.log(`Lesson Planner Q API listening on http://127.0.0.1:${port}`);
  });
}
