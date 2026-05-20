function collectText(value, bucket = []) {
  if (typeof value === "string") {
    bucket.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectText(item, bucket);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectText(item, bucket);
  }
  return bucket;
}

function textOf(value) {
  return collectText(value).join("\n").toLowerCase();
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function hasAllKeys(value, keys) {
  return value && typeof value === "object" && keys.every((key) => Object.hasOwn(value, key));
}

function pass(name, details) {
  return { name, passed: true, details };
}

function fail(name, details) {
  return { name, passed: false, details };
}

const schemaChecks = {
  options_schema(output) {
    if (!Array.isArray(output.options)) return fail("options_schema", "Expected output.options to be an array.");
    if (output.options.length !== 3) return fail("options_schema", `Expected exactly 3 options, received ${output.options.length}.`);
    const required = ["title", "approach", "bestFor", "lessonShape", "activities", "tradeoffs", "visualPackRecommended", "rehearsalFocus"];
    const incomplete = output.options.find((option) => !hasAllKeys(option, required));
    if (incomplete) return fail("options_schema", "At least one option is missing a required field.");
    return pass("options_schema", "Found exactly 3 complete lesson options.");
  },

  lesson_schema(output) {
    const required = [
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
    ];
    if (!hasAllKeys(output, required)) return fail("lesson_schema", "Lesson plan is missing one or more required fields.");
    if (!Array.isArray(output.lessonFlow) || output.lessonFlow.length < 4) {
      return fail("lesson_schema", "Expected at least 4 lesson-flow segments.");
    }
    return pass("lesson_schema", "Lesson plan includes the expected top-level contract.");
  },

  visual_schema(output) {
    const required = ["packTitle", "imagePrompt", "styleGuidance", "storyCards", "scenarioCards", "valueCards", "storyboardPanels", "worksheetPrompts", "reviewNotes"];
    if (!hasAllKeys(output, required)) return fail("visual_schema", "Visual pack is missing one or more required fields.");
    if (!Array.isArray(output.storyboardPanels) || output.storyboardPanels.length < 2) {
      return fail("visual_schema", "Expected at least 2 storyboard panels.");
    }
    return pass("visual_schema", "Visual pack includes the expected top-level contract.");
  },

  rehearsal_schema(output) {
    const required = ["scenario", "studentQuestions", "suggestedResponses", "simplerLanguage", "coachingNotes"];
    if (!hasAllKeys(output, required)) return fail("rehearsal_schema", "Rehearsal output is missing one or more required fields.");
    if (!Array.isArray(output.studentQuestions) || output.studentQuestions.length < 2) {
      return fail("rehearsal_schema", "Expected at least 2 student questions.");
    }
    return pass("rehearsal_schema", "Rehearsal output includes the expected top-level contract.");
  }
};

const productChecks = {
  educator_control(output) {
    const text = textOf(output);
    if (
      Array.isArray(output.options) &&
      output.options.length > 0 &&
      output.options.every((option) => option.bestFor && Array.isArray(option.tradeoffs) && option.tradeoffs.length > 0)
    ) {
      return pass("educator_control", "Options expose best-fit guidance and tradeoffs for educator choice.");
    }
    if (
      (Array.isArray(output.reviewNotes) && output.reviewNotes.length > 0) ||
      (Array.isArray(output.coachingNotes) && output.coachingNotes.length > 0)
    ) {
      return pass("educator_control", "Output includes educator-facing review or coaching notes.");
    }
    if (hasAny(text, ["draft", "educator review", "review", "adapt", "adjust", "teacher judgment"])) {
      return pass("educator_control", "Output signals educator review or adaptation.");
    }
    return fail("educator_control", "Expected language that keeps the educator in control.");
  },

  buddhist_context(output) {
    const text = textOf(output);
    if (hasAny(text, ["chinese mahayana", "mahayana", "folk buddh", "guanyin", "ksitigarbha", "bodhisattva", "merit"])) {
      return pass("buddhist_context", "Output preserves a specific Buddhist teaching context.");
    }
    return fail("buddhist_context", "Expected specific Chinese Mahayana folk Buddhist context, not generic values-only language.");
  },

  gradual_release(output) {
    const sdl = output.selfDirectedLearning;
    if (sdl?.iDo && sdl?.weDo && sdl?.youDo && Array.isArray(sdl?.checkpoints) && sdl.checkpoints.length > 0) {
      return pass("gradual_release", "Self-directed learning includes I do, We do, You do, and checkpoints.");
    }
    return fail("gradual_release", "Expected gradual-release self-directed learning with checkpoints.");
  },

  memory_used(output) {
    const text = textOf(output);
    if (hasAny(text, ["scenario card", "role-play", "short", "six minutes", "restless", "last", "previous", "worked well"])) {
      return pass("memory_used", "Output appears to use prior classroom reflection evidence.");
    }
    return fail("memory_used", "Expected visible use of lessonMemory evidence.");
  },

  practical_classroom_moves(output) {
    const text = textOf(output);
    if (hasAny(text, ["role-play", "cards", "paired", "round-robin", "timebox", "checkpoint", "movement", "sort", "debrief"])) {
      return pass("practical_classroom_moves", "Output includes concrete classroom moves.");
    }
    return fail("practical_classroom_moves", "Expected practical classroom moves rather than abstract theory.");
  },

  cultural_review(output) {
    const text = textOf(output);
    if (hasAny(text, ["review", "sacred", "avoid", "symbolic", "respectful", "educator"])) {
      return pass("cultural_review", "Visual pack includes cultural or sacred-image review guidance.");
    }
    return fail("cultural_review", "Expected review guidance for sacred or culturally sensitive visuals.");
  },

  visual_purpose(output) {
    const text = textOf(output);
    if (hasAny(text, ["compare", "choose", "notice", "remember", "discuss", "arrange", "reflect", "rehearse"])) {
      return pass("visual_purpose", "Visual materials are tied to student learning actions.");
    }
    return fail("visual_purpose", "Expected visual materials to serve a lesson objective.");
  },

  simple_language(output) {
    if (Array.isArray(output.simplerLanguage) && output.simplerLanguage.length > 0) {
      return pass("simple_language", "Rehearsal includes simpler educator language.");
    }
    return fail("simple_language", "Expected simpler language examples.");
  },

  sensitive_review(output) {
    const text = textOf(output);
    if (hasAny(text, ["review", "careful", "avoid over", "not a transaction", "not just", "educator", "sensitive"])) {
      return pass("sensitive_review", "Output handles sensitive doctrinal framing cautiously.");
    }
    return fail("sensitive_review", "Expected cautious handling of sensitive doctrinal framing.");
  }
};

export function gradeOutput(output, checkNames) {
  return checkNames.map((name) => {
    const check = schemaChecks[name] || productChecks[name];
    if (!check) return fail(name, `Unknown check: ${name}`);
    return check(output);
  });
}
