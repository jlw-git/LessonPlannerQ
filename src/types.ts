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
