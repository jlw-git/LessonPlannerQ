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

function listHasText(value) {
  return Array.isArray(value) && value.some((item) => typeof item === "string" && item.trim().length > 0);
}

function agentReviewOf(output) {
  return output?.agentReview && typeof output.agentReview === "object" ? output.agentReview : null;
}

function optionReviewOf(output) {
  return output?.optionReview && typeof output.optionReview === "object" ? output.optionReview : null;
}

function hasReviewShape(review) {
  const required = [
    "summary",
    "strengths",
    "revisionRequired",
    "revisionRequests",
    "pedagogyNotes",
    "traditionReviewNotes",
    "educatorReviewNotes"
  ];
  if (!hasAllKeys(review, required)) return false;
  return (
    typeof review.summary === "string" &&
    typeof review.revisionRequired === "boolean" &&
    Array.isArray(review.strengths) &&
    Array.isArray(review.revisionRequests) &&
    Array.isArray(review.pedagogyNotes) &&
    Array.isArray(review.traditionReviewNotes) &&
    Array.isArray(review.educatorReviewNotes)
  );
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

  options_agent_review_schema(output) {
    const review = optionReviewOf(output);
    const required = [
      "summary",
      "strengths",
      "revisionRequired",
      "revisionRequests",
      "pedagogyNotes",
      "traditionReviewNotes",
      "educatorReviewNotes"
    ];
    if (!hasAllKeys(review, required)) {
      return fail("options_agent_review_schema", "Expected structured optionReview on the options response.");
    }
    if (typeof review.revisionRequired !== "boolean") {
      return fail("options_agent_review_schema", "Expected optionReview.revisionRequired to be a boolean.");
    }
    if (
      !Array.isArray(review.strengths) ||
      !Array.isArray(review.revisionRequests) ||
      !Array.isArray(review.pedagogyNotes) ||
      !Array.isArray(review.traditionReviewNotes) ||
      !Array.isArray(review.educatorReviewNotes)
    ) {
      return fail("options_agent_review_schema", "Expected all optionReview note groups to be arrays.");
    }
    if (review.revisionRequired && !listHasText(review.revisionRequests)) {
      return fail("options_agent_review_schema", "Expected revisionRequests when revisionRequired is true.");
    }
    const reviewText = textOf(review);
    if (!hasAny(reviewText, ["educator", "review", "option", "scaffold", "tradition", "chinese mahayana", "classroom"])) {
      return fail("options_agent_review_schema", "Expected option critic review to name educator review, pedagogy, or tradition concerns.");
    }
    return pass("options_agent_review_schema", "Options response includes structured critic review notes.");
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

  brief_schema(output) {
    const required = [
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
    ];
    if (!hasAllKeys(output, required)) return fail("brief_schema", "Brief is missing one or more required fields.");
    if (!Array.isArray(output.clarifyingQuestions) || !Array.isArray(output.keyChoices) || !Array.isArray(output.suggestedStructure)) {
      return fail("brief_schema", "Expected brief planning lists to be arrays.");
    }
    if (typeof output.visualPackRecommended !== "boolean" || typeof output.rehearsalRecommended !== "boolean") {
      return fail("brief_schema", "Expected visual and rehearsal recommendations to be booleans.");
    }
    return pass("brief_schema", "Brief includes the expected top-level contract.");
  },

  brief_agent_review_schema(output) {
    const review = agentReviewOf(output);
    if (!hasReviewShape(review)) {
      return fail("brief_agent_review_schema", "Expected structured agentReview on the brief.");
    }
    if (review.revisionRequired && !listHasText(review.revisionRequests)) {
      return fail("brief_agent_review_schema", "Expected revisionRequests when revisionRequired is true.");
    }
    const reviewText = textOf(review);
    if (!hasAny(reviewText, ["educator", "review", "brief", "scaffold", "tradition", "chinese mahayana", "classroom"])) {
      return fail("brief_agent_review_schema", "Expected brief critic review to name educator review, pedagogy, or tradition concerns.");
    }
    return pass("brief_agent_review_schema", "Brief includes structured critic review notes.");
  },

  lesson_agent_review_schema(output) {
    const review = agentReviewOf(output);
    if (!hasReviewShape(review)) {
      return fail("lesson_agent_review_schema", "Expected structured agentReview on the lesson plan.");
    }
    if (review.revisionRequired && !listHasText(review.revisionRequests)) {
      return fail("lesson_agent_review_schema", "Expected revisionRequests when revisionRequired is true.");
    }
    const reviewText = textOf(review);
    if (!hasAny(reviewText, ["educator", "review", "scaffold", "tradition", "chinese mahayana", "classroom"])) {
      return fail("lesson_agent_review_schema", "Expected critic review to name educator review, pedagogy, or tradition concerns.");
    }
    return pass("lesson_agent_review_schema", "Lesson plan includes structured critic review notes.");
  },

  lesson_agent_review(output) {
    return schemaChecks.lesson_agent_review_schema(output);
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
  },

  interview_extraction_schema(output) {
    const required = ["topic", "lessonObjectives", "planningRequirements", "openQuestions", "confidenceNotes", "sourceSummary"];
    if (!hasAllKeys(output, required)) {
      return fail("interview_extraction_schema", "Interview extraction is missing one or more required fields.");
    }
    if (
      typeof output.topic !== "string" ||
      typeof output.lessonObjectives !== "string" ||
      typeof output.planningRequirements !== "string" ||
      typeof output.sourceSummary !== "string" ||
      !Array.isArray(output.openQuestions) ||
      !Array.isArray(output.confidenceNotes)
    ) {
      return fail("interview_extraction_schema", "Interview extraction fields have unexpected types.");
    }
    if (!output.topic.trim() || !output.lessonObjectives.trim() || !output.planningRequirements.trim()) {
      return fail("interview_extraction_schema", "Expected extracted topic, objectives, and planning requirements to contain text.");
    }
    return pass("interview_extraction_schema", "Interview extraction includes editable planning fields and review notes.");
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
  },

  interview_extraction_guardrails(output) {
    const text = textOf(output);
    const hasContext = hasAny(text, ["chinese mahayana", "mahayana", "folk buddh", "guanyin", "temple", "merit"]);
    const hasEducatorReview = hasAny(text, ["draft", "review", "educator", "open question", "unclear", "confirm"]);
    const hasCaution =
      hasAny(text, ["unclear", "confirm", "review", "careful", "not a simple", "avoid", "sensitive", "question"]) ||
      listHasText(output.openQuestions) ||
      listHasText(output.confidenceNotes);
    const overconfident = hasAny(text, [
      "all buddhists believe",
      "buddhism teaches that everyone must",
      "this proves",
      "guarantees enlightenment",
      "always creates merit",
      "karma means bad things happen because"
    ]);
    if (hasContext && hasEducatorReview && hasCaution && !overconfident) {
      return pass("interview_extraction_guardrails", "Extraction preserves context and keeps unclear points reviewable.");
    }
    if (overconfident) {
      return fail("interview_extraction_guardrails", "Found overconfident or flattening doctrinal language.");
    }
    return fail("interview_extraction_guardrails", "Expected educator-review language, Buddhist context, and cautious handling of unclear points.");
  },

  brief_pedagogy_signal(output) {
    const review = agentReviewOf(output);
    const briefText = textOf([
      output.briefSummary,
      output.studentTakeaway,
      output.keyChoices,
      output.suggestedStructure,
      output.reviewPrompts,
      output.rehearsalFocus,
      review?.pedagogyNotes,
      review?.educatorReviewNotes
    ]);
    const hasPedagogyLanguage = hasAny(briefText, [
      "scaffold",
      "guided",
      "model",
      "practice",
      "checkpoint",
      "timebox",
      "debrief",
      "self-directed",
      "small class",
      "role-play",
      "cards"
    ]);
    const hasReviewablePlanning =
      listHasText(output.clarifyingQuestions) &&
      listHasText(output.keyChoices) &&
      listHasText(output.suggestedStructure) &&
      listHasText(output.reviewPrompts);
    if (hasReviewablePlanning && hasPedagogyLanguage) {
      return pass("brief_pedagogy_signal", "Brief and review show scaffolded, practical planning signals.");
    }
    return fail("brief_pedagogy_signal", "Expected brief to show scaffolded, practical planning choices.");
  },

  brief_tradition_signal(output) {
    const review = agentReviewOf(output);
    const traditionText = textOf([
      output.briefSummary,
      output.studentTakeaway,
      output.keyChoices,
      output.reviewPrompts,
      review?.traditionReviewNotes,
      review?.educatorReviewNotes
    ]);
    const hasSpecificContext = hasAny(traditionText, [
      "chinese mahayana",
      "folk buddh",
      "guanyin",
      "ksitigarbha",
      "bodhisattva",
      "merit",
      "temple",
      "family practice"
    ]);
    const hasCaution = hasAny(traditionText, [
      "educator review",
      "review",
      "temple",
      "careful",
      "avoid",
      "not all buddhist",
      "doctrinal",
      "tradition",
      "context"
    ]);
    const overconfident = hasAny(traditionText, [
      "all buddhists believe",
      "buddhism teaches that everyone must",
      "this proves",
      "guarantees enlightenment",
      "always creates merit",
      "karma means bad things happen because"
    ]);
    if (hasSpecificContext && hasCaution && !overconfident) {
      return pass("brief_tradition_signal", "Brief and review preserve specific tradition context with cautious framing.");
    }
    if (overconfident) {
      return fail("brief_tradition_signal", "Found overconfident or flattening doctrinal language.");
    }
    return fail("brief_tradition_signal", "Expected specific Chinese Mahayana folk Buddhist context plus cautious review language.");
  },

  brief_revision_trace(output) {
    const review = agentReviewOf(output);
    if (!review) return fail("brief_revision_trace", "Expected agentReview to trace the brief review pass.");
    const briefText = textOf([output.reviewPrompts, output.keyChoices, output.suggestedStructure, output.changeLog]);
    const noteGroups = [
      ...(review.pedagogyNotes || []),
      ...(review.traditionReviewNotes || []),
      ...(review.educatorReviewNotes || []),
      ...(review.revisionRequests || [])
    ].filter((note) => typeof note === "string" && note.trim().length > 0);
    const carriedNote = noteGroups.some((note) => {
      const words = note
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 6);
      return words.some((word) => briefText.includes(word));
    });
    if (carriedNote || (!review.revisionRequired && noteGroups.length > 0 && hasAny(briefText, ["review", "educator", "tradition", "scaffold"]))) {
      return pass("brief_revision_trace", "Brief review is visible and traceable in final brief planning notes.");
    }
    return fail("brief_revision_trace", "Expected final brief fields to carry through the critic review concerns.");
  },

  options_pedagogy_signal(output) {
    const review = optionReviewOf(output);
    const options = Array.isArray(output.options) ? output.options : [];
    const completeOptions = options.every(
      (option) =>
        Array.isArray(option.lessonShape) &&
        option.lessonShape.length > 0 &&
        Array.isArray(option.activities) &&
        option.activities.length > 0 &&
        Array.isArray(option.tradeoffs) &&
        option.tradeoffs.length > 0
    );
    const optionTexts = options.map((option) => textOf(option));
    const optionsWithClassroomMoves = optionTexts.filter((text) =>
      hasAny(text, ["role-play", "cards", "paired", "round-robin", "timebox", "checkpoint", "movement", "sort", "debrief", "practice"])
    ).length;
    const pedagogyText = textOf([output.options, review?.pedagogyNotes, review?.educatorReviewNotes]);
    const hasPedagogyLanguage = hasAny(pedagogyText, [
      "scaffold",
      "guided",
      "model",
      "practice",
      "checkpoint",
      "timebox",
      "debrief",
      "self-directed",
      "small class"
    ]);
    if (completeOptions && optionsWithClassroomMoves >= 2 && hasPedagogyLanguage) {
      return pass("options_pedagogy_signal", "Options and review show concrete scaffolding and classroom practice signals.");
    }
    return fail("options_pedagogy_signal", "Expected option set to show scaffolded, practical classroom choices.");
  },

  options_tradition_signal(output) {
    const review = optionReviewOf(output);
    const traditionText = textOf([
      output.options,
      review?.traditionReviewNotes,
      review?.educatorReviewNotes
    ]);
    const hasSpecificContext = hasAny(traditionText, [
      "chinese mahayana",
      "folk buddh",
      "guanyin",
      "ksitigarbha",
      "bodhisattva",
      "merit",
      "temple",
      "family practice"
    ]);
    const hasCaution = hasAny(traditionText, [
      "educator review",
      "review",
      "temple",
      "careful",
      "avoid",
      "not all buddhist",
      "doctrinal",
      "tradition",
      "context"
    ]);
    const overconfident = hasAny(traditionText, [
      "all buddhists believe",
      "buddhism teaches that everyone must",
      "this proves",
      "guarantees enlightenment",
      "always creates merit",
      "karma means bad things happen because"
    ]);
    if (hasSpecificContext && hasCaution && !overconfident) {
      return pass("options_tradition_signal", "Options and review preserve specific tradition context with cautious framing.");
    }
    if (overconfident) {
      return fail("options_tradition_signal", "Found overconfident or flattening doctrinal language.");
    }
    return fail("options_tradition_signal", "Expected specific Chinese Mahayana folk Buddhist context plus cautious review language.");
  },

  options_revision_trace(output) {
    const review = optionReviewOf(output);
    if (!review) return fail("options_revision_trace", "Expected optionReview to trace the review pass.");
    if (!Array.isArray(output.options) || output.options.length !== 3) {
      return fail("options_revision_trace", "Expected final options to remain visible alongside optionReview.");
    }
    const optionsText = textOf(output.options);
    const noteGroups = [
      ...(review.pedagogyNotes || []),
      ...(review.traditionReviewNotes || []),
      ...(review.educatorReviewNotes || []),
      ...(review.revisionRequests || [])
    ].filter((note) => typeof note === "string" && note.trim().length > 0);
    const carriedNote = noteGroups.some((note) => {
      const words = note
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 6);
      return words.some((word) => optionsText.includes(word));
    });
    if (carriedNote || (!review.revisionRequired && noteGroups.length > 0)) {
      return pass("options_revision_trace", "Option review is returned with final options and traceable concerns.");
    }
    return fail("options_revision_trace", "Expected optionReview concerns to remain traceable to the final option set.");
  },

  lesson_pedagogy_signal(output) {
    const review = agentReviewOf(output);
    const sdl = output.selfDirectedLearning;
    const hasGradualRelease =
      sdl?.iDo?.trim() &&
      sdl?.weDo?.trim() &&
      sdl?.youDo?.trim() &&
      Array.isArray(sdl?.checkpoints) &&
      sdl.checkpoints.length >= 2;
    const lessonFlowHasAction =
      Array.isArray(output.lessonFlow) &&
      output.lessonFlow.length >= 4 &&
      output.lessonFlow.some((segment) => segment?.studentAction?.trim() && segment?.duration?.trim());
    const pedagogyText = textOf([
      output.selfDirectedLearning,
      output.lessonFlow,
      output.playBasedActivity,
      review?.pedagogyNotes,
      review?.educatorReviewNotes
    ]);
    const hasPedagogyLanguage = hasAny(pedagogyText, [
      "scaffold",
      "i do",
      "we do",
      "you do",
      "checkpoint",
      "timebox",
      "model",
      "practice",
      "debrief",
      "self-directed"
    ]);
    if (hasGradualRelease && lessonFlowHasAction && hasPedagogyLanguage) {
      return pass("lesson_pedagogy_signal", "Lesson and review show concrete scaffolding and classroom practice signals.");
    }
    return fail("lesson_pedagogy_signal", "Expected visible scaffolding, checkpoints, and practical pedagogy signals.");
  },

  lesson_tradition_signal(output) {
    const review = agentReviewOf(output);
    const traditionText = textOf([
      output.traditionNote,
      output.teachingAnchor,
      output.educatorNotes,
      output.reviewNotes,
      review?.traditionReviewNotes,
      review?.educatorReviewNotes
    ]);
    const hasSpecificContext = hasAny(traditionText, [
      "chinese mahayana",
      "folk buddh",
      "guanyin",
      "ksitigarbha",
      "bodhisattva",
      "merit",
      "temple",
      "family practice"
    ]);
    const hasCaution = hasAny(traditionText, [
      "educator review",
      "review",
      "temple",
      "careful",
      "avoid",
      "not all buddhist",
      "doctrinal",
      "tradition"
    ]);
    const overconfident = hasAny(traditionText, [
      "all buddhists believe",
      "buddhism teaches that everyone must",
      "this proves",
      "guarantees enlightenment",
      "always creates merit",
      "karma means bad things happen because"
    ]);
    if (hasSpecificContext && hasCaution && !overconfident) {
      return pass("lesson_tradition_signal", "Lesson and review preserve specific tradition context with cautious framing.");
    }
    if (overconfident) {
      return fail("lesson_tradition_signal", "Found overconfident or flattening doctrinal language.");
    }
    return fail("lesson_tradition_signal", "Expected specific Chinese Mahayana folk Buddhist context plus cautious review language.");
  },

  lesson_revision_trace(output) {
    const review = agentReviewOf(output);
    if (!review) return fail("lesson_revision_trace", "Expected agentReview to trace the review pass.");
    if (!Array.isArray(output.reviewNotes) || output.reviewNotes.length === 0) {
      return fail("lesson_revision_trace", "Expected educator-visible reviewNotes from the review pass.");
    }
    const reviewNotesText = textOf(output.reviewNotes);
    const noteGroups = [
      ...(review.pedagogyNotes || []),
      ...(review.traditionReviewNotes || []),
      ...(review.educatorReviewNotes || []),
      ...(review.revisionRequests || [])
    ].filter((note) => typeof note === "string" && note.trim().length > 0);
    const carriedNote = noteGroups.some((note) => {
      const words = note
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 6);
      return words.some((word) => reviewNotesText.includes(word));
    });
    if (carriedNote || (!review.revisionRequired && noteGroups.length > 0 && hasAny(reviewNotesText, ["review", "educator", "tradition", "scaffold"]))) {
      return pass("lesson_revision_trace", "Critic or reviewer notes are visible in final educator review notes.");
    }
    return fail("lesson_revision_trace", "Expected final reviewNotes to carry through the agent review concerns.");
  }
};

export function gradeOutput(output, checkNames) {
  return checkNames.map((name) => {
    const check = schemaChecks[name] || productChecks[name];
    if (!check) return fail(name, `Unknown check: ${name}`);
    return check(output);
  });
}
