export type LessonPlan = {
  title: string;
  traditionNote: string;
  summary: string;
  learningObjectives: string[];
  teachingAnchor: string;
  lessonFlow: Array<{
    segment: string;
    duration: string;
    educatorMove: string;
    studentAction: string;
  }>;
  playBasedActivity: {
    name: string;
    materials: string[];
    instructions: string[];
    debriefQuestions: string[];
  };
  selfDirectedLearning: {
    framework: string;
    iDo: string;
    weDo: string;
    youDo: string;
    checkpoints: string[];
  };
  reflection: string[];
  realLifeApplication: string;
  takeHome: string;
  educatorNotes: string[];
  reviewNotes: string[];
  agentReview?: LessonAgentReview;
};

export type LessonAgentReview = {
  summary: string;
  strengths: string[];
  revisionRequired: boolean;
  revisionRequests: string[];
  pedagogyNotes: string[];
  traditionReviewNotes: string[];
  educatorReviewNotes: string[];
};

export type OptionAgentReview = LessonAgentReview;
export type BriefAgentReview = LessonAgentReview;

export type LessonBrief = {
  title: string;
  briefSummary: string;
  studentTakeaway: string;
  clarifyingQuestions: string[];
  keyChoices: string[];
  suggestedStructure: string[];
  visualPackRecommended: boolean;
  visualPackRationale: string;
  rehearsalRecommended: boolean;
  rehearsalFocus: string;
  changeLog: string[];
  reviewPrompts: string[];
  agentReview?: BriefAgentReview;
};

export type InterviewExtraction = {
  topic: string;
  lessonObjectives: string;
  planningRequirements: string;
  openQuestions: string[];
  confidenceNotes: string[];
  sourceSummary: string;
};

export type LessonOption = {
  title: string;
  approach: string;
  bestFor: string;
  lessonShape: string[];
  activities: string[];
  tradeoffs: string[];
  visualPackRecommended: boolean;
  rehearsalFocus: string;
};

export type LessonOptionsResponse = {
  options: LessonOption[];
  optionReview?: OptionAgentReview;
};

export type VisualPack = {
  packTitle: string;
  imagePrompt: string;
  styleGuidance: string;
  storyCards: string[];
  scenarioCards: string[];
  valueCards: string[];
  storyboardPanels: Array<{
    panel: string;
    caption: string;
    studentPrompt: string;
  }>;
  worksheetPrompts: string[];
  reviewNotes: string[];
};

export type Rehearsal = {
  scenario: string;
  studentQuestions: string[];
  suggestedResponses: string[];
  simplerLanguage: string[];
  coachingNotes: string[];
};

export type RehearsalCritique = {
  practicedQuestion: string;
  educatorAttempt: string;
  summary: string;
  strengths: string[];
  clarityNotes: string[];
  toneAndAgeFitNotes: string[];
  traditionCautionNotes: string[];
  suggestedRevision: string;
  nextPracticePrompt: string;
  briefFeedbackSuggestion: string;
  educatorReviewNotes: string[];
};
