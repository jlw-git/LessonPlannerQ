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

const interviewExtractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    topic: { type: "string" },
    lessonObjectives: { type: "string" },
    planningRequirements: { type: "string" },
    openQuestions: { type: "array", items: { type: "string" } },
    confidenceNotes: { type: "array", items: { type: "string" } },
    sourceSummary: { type: "string" }
  },
  required: [
    "topic",
    "lessonObjectives",
    "planningRequirements",
    "openQuestions",
    "confidenceNotes",
    "sourceSummary"
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

const lessonAgentReviewSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    revisionRequired: { type: "boolean" },
    revisionRequests: { type: "array", items: { type: "string" } },
    pedagogyNotes: { type: "array", items: { type: "string" } },
    traditionReviewNotes: { type: "array", items: { type: "string" } },
    educatorReviewNotes: { type: "array", items: { type: "string" } }
  },
  required: [
    "summary",
    "strengths",
    "revisionRequired",
    "revisionRequests",
    "pedagogyNotes",
    "traditionReviewNotes",
    "educatorReviewNotes"
  ]
};

const optionAgentReviewSchema = lessonAgentReviewSchema;

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

function shouldReviseFromReview(review) {
  return Boolean(review?.revisionRequired) && Array.isArray(review?.revisionRequests) && review.revisionRequests.length > 0;
}

function withAgentReviewNotes(lesson, review) {
  const reviewNotes = [
    ...(Array.isArray(lesson.reviewNotes) ? lesson.reviewNotes : []),
    ...(review?.pedagogyNotes || []),
    ...(review?.traditionReviewNotes || []),
    ...(review?.educatorReviewNotes || [])
  ].filter(Boolean);

  return {
    ...lesson,
    reviewNotes: [...new Set(reviewNotes)],
    agentReview: review
  };
}

const riskyDoctrineReplacements = [
  [/karma\s+always\s+proves\s+why\s+things\s+happen/gi, "karma should not be presented as a simple proof for why things happen"],
  [/helping\s+always\s+creates\s+merit/gi, "helpful actions should not be presented as a guaranteed merit formula"],
  [/all\s+buddhists\s+believe/gi, "some Buddhist communities teach"],
  [/buddhism\s+teaches\s+that\s+everyone\s+must/gi, "this teaching context can invite students to consider"],
  [/guarantees\s+enlightenment/gi, "should not be presented as guaranteeing enlightenment"],
  [/karma\s+means\s+bad\s+things\s+happen\s+because/gi, "karma should not be reduced to saying bad things happen because"],
  [/\bthis\s+proves\b/gi, "this can suggest"]
];

function sanitizeRiskyDoctrineLanguage(value) {
  if (typeof value === "string") {
    return riskyDoctrineReplacements.reduce(
      (text, [pattern, replacement]) => text.replace(pattern, replacement),
      value
    );
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeRiskyDoctrineLanguage);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeRiskyDoctrineLanguage(item)])
    );
  }
  return value;
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
    const draftLesson = await createJson({
      schema: lessonSchema,
      schemaName: "lesson_plan",
      instructions: `Generate one complete weekly lesson plan. Make it feasible for a small class and avoid generic moralizing.
Product guardrails override planning requests that weaken scaffolding, flatten Buddhist traditions into generic Buddhism, or ask for overconfident doctrinal claims.
Always include gradual release in selfDirectedLearning, and include at least two concrete checkpoints.
When the educator request includes doctrinally risky wording, correct it with cautious age-appropriate language instead of repeating the risky claim verbatim.`,
      input: payload
    });

    const agentReview = await createJson({
      schema: lessonAgentReviewSchema,
      schemaName: "lesson_plan_agent_review",
      instructions: `Act as the lesson-plan pedagogy critic and Chinese Mahayana folk Buddhist tradition reviewer.
Review the draft lesson plan before the educator sees it.
Check whether the plan keeps the educator in control, uses practical classroom moves, avoids generic moralizing, preserves Chinese Mahayana folk Buddhist specificity, scaffolds self-directed learning with I do / We do / You do and checkpoints, uses play only when it serves the objective, and flags culturally or doctrinally sensitive claims for educator or temple review.
Treat requests for lecture-only lessons, no checkpoints, generic Buddhism, or absolute claims about karma/merit as concerns to repair rather than preferences to obey.
Require at least two concrete selfDirectedLearning.checkpoints. Do not ask the revision to remove checkpoints.
When noting a doctrinal concern, paraphrase cautiously rather than repeating an overconfident claim verbatim.
Set revisionRequired to true only when concrete changes are needed before display. Keep revisionRequests specific and actionable.`,
      input: { context: payload, draftLesson }
    });

    const finalLesson = shouldReviseFromReview(agentReview)
      ? await createJson({
          schema: lessonSchema,
          schemaName: "lesson_plan_agent_revision",
          instructions: `Revise the draft lesson plan once using the critic and tradition-review notes.
Address every revision request while preserving strong parts of the draft.
Keep the output educator-facing, concrete, age-appropriate for 13-year-old students, feasible for a small class of four, grounded in Chinese Mahayana folk Buddhist context, and clearly marked as draft material for educator review.
Preserve gradual release even when the educator asked for weak scaffolding; selfDirectedLearning.checkpoints must contain at least two concrete checkpoints.
Avoid generic Buddhist framing and avoid absolute doctrinal claims. If the request contained risky doctrine, describe the correction in cautious educator language without repeating the risky wording verbatim.
Include concise reviewNotes that name remaining educator judgment calls.`,
          input: { context: payload, draftLesson, agentReview }
        })
      : draftLesson;

    res.json(sanitizeRiskyDoctrineLanguage(withAgentReviewNotes(finalLesson, agentReview)));
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

app.post("/api/interview/extract", async (req, res, next) => {
  try {
    const extraction = await createJson({
      schema: interviewExtractionSchema,
      schemaName: "interview_extraction",
      instructions: `Extract editable planning fields from the educator's voice interview transcript.
Return only draft fields for educator review; do not generate a lesson plan, choose an option, or imply the extraction is authoritative.
Use currentForm as fallback context when the transcript is incomplete, but prioritize explicit educator statements in transcriptEntries.
Preserve the Chinese Mahayana folk Buddhist teaching context when relevant instead of flattening the lesson into generic Buddhism.
If a transcript point is unclear, contradictory, missing, or doctrinally sensitive, put a concise item in openQuestions or confidenceNotes rather than guessing.
Avoid absolute claims about karma, merit, enlightenment, or what all Buddhists believe. Use cautious educator-review language.`,
      input: req.body
    });
    res.json(sanitizeRiskyDoctrineLanguage(extraction));
  } catch (error) {
    next(error);
  }
});

app.post("/api/options", async (req, res, next) => {
  try {
    const payload = req.body;
    const draftOptions = await createJson({
      schema: lessonOptionsSchema,
      schemaName: "lesson_options",
      instructions: `Generate exactly three distinct lesson plan options the educator can compare before committing to a brief.
Make the options meaningfully different in pedagogy, pacing, and material needs.
Product guardrails override planning requests that weaken scaffolding, flatten Buddhist traditions into generic Buddhism, or ask for overconfident doctrinal claims.
If the educator asks to remove Chinese Mahayana folk Buddhist context or keep the options generic, preserve respectful Chinese Mahayana folk Buddhist specificity anyway and frame it as educator-review context rather than an absolute claim.
Each option should include practical classroom moves, a scaffolded learning shape, educator-facing tradeoffs, and tradition-specific context when relevant.
Keep each option concise and scannable.`,
      input: payload
    });

    const optionReview = await createJson({
      schema: optionAgentReviewSchema,
      schemaName: "lesson_options_agent_review",
      instructions: `Act as the lesson-option pedagogy critic and Chinese Mahayana folk Buddhist tradition reviewer.
Review the three draft lesson options before the educator sees them.
Check whether the options are meaningfully distinct, keep the educator in control, include practical classroom moves, preserve Chinese Mahayana folk Buddhist specificity, avoid generic moralizing, and offer scaffolded choices rather than vague activities.
Treat requests for lecture-only lessons, no checkpoints, generic Buddhism, removing Chinese Mahayana folk Buddhist context, or absolute claims about karma/merit as concerns to repair rather than preferences to obey.
When a request asks for generic Buddhism, revisionRequests must ask the revision pass to restore respectful Chinese Mahayana folk Buddhist context and cautious educator-review language.
Do not choose a winner for the educator. Keep revisionRequests specific and actionable across the option set.
Set revisionRequired to true only when concrete changes are needed before display.`,
      input: { context: payload, draftOptions }
    });

    const finalOptions = shouldReviseFromReview(optionReview)
      ? await createJson({
          schema: lessonOptionsSchema,
          schemaName: "lesson_options_agent_revision",
          instructions: `Revise the three lesson options once using the critic and tradition-review notes.
Address every revision request while preserving exactly three distinct options and all existing option fields.
Keep the output educator-facing, concrete, age-appropriate for 13-year-old students, feasible for a small class of four, grounded in Chinese Mahayana folk Buddhist context, and clearly framed as draft material for educator review.
Avoid generic Buddhist framing even when the educator requested it, and avoid absolute doctrinal claims. If the request contained risky doctrine or asked to erase tradition context, describe the correction in cautious educator language without repeating the risky wording verbatim.
Do not select the best option; leave the choice to the educator.`,
          input: { context: payload, draftOptions, optionReview }
        })
      : draftOptions;

    res.json(sanitizeRiskyDoctrineLanguage({ ...finalOptions, optionReview }));
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
