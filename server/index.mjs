import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

const root = process.cwd();
for (const file of [".env.local", ".env_local", ".env"]) {
  const candidate = path.join(root, file);
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate, override: false });
  }
}

const app = express();
const port = Number(process.env.PORT || 8787);
const textModel = process.env.OPENAI_TEXT_MODEL || "gpt-5.4-mini";
const realtimeModel = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
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
    instructions,
    input,
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
    imageModel
  });
});

app.post("/api/lesson", async (req, res, next) => {
  try {
    const payload = req.body;
    const lesson = await createJson({
      schema: lessonSchema,
      schemaName: "lesson_plan",
      instructions: `${baseContext}
Generate one complete weekly lesson plan. Make it feasible for a small class and avoid generic moralizing.`,
      input: JSON.stringify(payload, null, 2)
    });
    res.json(lesson);
  } catch (error) {
    next(error);
  }
});

app.post("/api/rehearsal", async (req, res, next) => {
  try {
    const rehearsal = await createJson({
      schema: rehearsalSchema,
      schemaName: "rehearsal_coach",
      instructions: `${baseContext}
Simulate realistic, respectful 13-year-old questions and coach the educator to explain more clearly.`,
      input: JSON.stringify(req.body, null, 2)
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
      instructions: `${baseContext}
Create a printable visual pack plan. Avoid casual depictions of sacred figures unless the educator specifically requested them. Include cultural review notes.`,
      input: JSON.stringify(req.body, null, 2)
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

    const data = await response.json();
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

app.listen(port, () => {
  console.log(`Lesson Planner Q API listening on http://127.0.0.1:${port}`);
});
