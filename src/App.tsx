import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  Circle,
  Copy,
  FileText,
  Image,
  Loader2,
  MessageCircle,
  Mic,
  NotebookPen,
  Pencil,
  PlayCircle,
  Printer,
  RefreshCw,
  Save,
  Target,
  Users,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Wand2
} from "lucide-react";
import type {
  BriefAgentReview,
  InterviewExtraction,
  LessonAgentReview,
  LessonBrief,
  LessonOption,
  LessonOptionsResponse,
  LessonPlan,
  OptionAgentReview,
  PlanningMetricEvent,
  PlanningMetricEventName,
  ReflectionMemorySynthesis,
  Rehearsal,
  RehearsalCritique,
  VisualPack
} from "./types";
import { referenceNotes } from "./referenceNotes";

type FormState = {
  topic: string;
  lessonObjectives: string;
  planningRequirements: string;
};

type TranscriptEntry = {
  id: string;
  role: "educator" | "planner";
  text: string;
  status: "partial" | "final";
};

type VoiceSignal = "idle" | "connecting" | "listening" | "speaking" | "permission-error" | "api-error";

type FlowStep = {
  label: string;
  detail: string;
  status: "done" | "active" | "idle";
};

type WorkflowStage = "capture" | "review" | "choose" | "brief" | "plan" | "reflect";

type LessonReflection = {
  id: string;
  date: string;
  topic: string;
  lessonPlan: string;
  workedWell: string;
  didNotWork: string;
  studentResponse: string;
  nextTime: string;
};

type ReflectionDraft = Omit<LessonReflection, "id">;

const reflectionStorageKey = "lesson-planner-q-reflections";
const reflectionSynthesisStorageKey = "lesson-planner-q-reflection-synthesis";
const metricsStorageKey = "lesson-planner-q-metrics";
const transcriptStorageKey = "lesson-planner-q-last-voice-transcript";
const voiceStarterItemId = "plannerq-voice-starter";
const realtimeTurnInstructions = `Continue the educator planning conversation.
Ask exactly one concise follow-up question, then wait.
Do not create lesson options, a lesson outline, a lesson plan, visuals, worksheets, handouts, or materials.
Do not label voice replies as "Draft for educator review."
When enough context has been gathered, say that the lesson requirements are ready to review and ask the educator to end the voice chat.`;

const initialForm: FormState = {
  topic: "",
  lessonObjectives: "",
  planningRequirements: ""
};

const lessonStarters: (FormState & { label: string; hint: string })[] = [
  {
    label: "Compassion in everyday choices",
    hint: "Explore a school-day dilemma",
    topic: "Compassion in everyday choices",
    lessonObjectives: "Students can notice when someone needs care and rehearse a compassionate response to a school-day dilemma.",
    planningRequirements: "Use a short role-play and guided reflection. Connect the activity to our Chinese Mahayana folk Buddhist teaching context."
  },
  {
    label: "Gratitude beyond saying thank you",
    hint: "Turn appreciation into action",
    topic: "Gratitude in everyday life",
    lessonObjectives: "Students can recognise the care they receive and choose one practical way to express gratitude.",
    planningRequirements: "Use simple paper-based activities and familiar examples from home or the temple. Model an example before students work in pairs."
  },
  {
    label: "A pause before reacting",
    hint: "Practice a more thoughtful response",
    topic: "Mindful responses to frustration",
    lessonObjectives: "Students can notice frustration, pause, and practice a thoughtful response in an everyday disagreement.",
    planningRequirements: "Keep explanations short. Use a guided demonstration, a shared rehearsal, then a paired scenario. Connect the practice to our Chinese Mahayana folk Buddhist context."
  }
];

function todayString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

const initialReflectionDraft: ReflectionDraft = {
  date: todayString(),
  topic: initialForm.topic,
  lessonPlan: "",
  workedWell: "",
  didNotWork: "",
  studentResponse: "",
  nextTime: ""
};

function loadReflections() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(reflectionStorageKey);
    if (!saved) {
      return [];
    }
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as LessonReflection[]) : [];
  } catch {
    return [];
  }
}

function loadReflectionSynthesis() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(reflectionSynthesisStorageKey);
    if (!saved) {
      return null;
    }
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? (parsed as ReflectionMemorySynthesis) : null;
  } catch {
    return null;
  }
}

function loadMetricEvents() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(metricsStorageKey);
    if (!saved) {
      return [];
    }
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as PlanningMetricEvent[]) : [];
  } catch {
    return [];
  }
}

function loadVoiceTranscript() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(transcriptStorageKey);
    if (!saved) {
      return [];
    }
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (entry): entry is TranscriptEntry =>
          entry &&
          typeof entry.id === "string" &&
          (entry.role === "educator" || entry.role === "planner") &&
          typeof entry.text === "string" &&
          (entry.status === "partial" || entry.status === "final")
      )
      .map((entry) => ({ ...entry, status: "final" as const }));
  } catch {
    return [];
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (error) {
    throw new Error(describeApiConnectionError(error));
  }

  const data = await readJsonResponse<{ error?: string | { message?: string }; message?: string } & T>(
    response,
    apiFallbackMessage(response, url)
  );
  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data) || apiFallbackMessage(response, url));
  }
  return data as T;
}

async function readJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const text = await response.text();

  if (!text) {
    if (!response.ok) {
      throw new Error(fallbackMessage);
    }
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.replace(/\s+/g, " ").trim().slice(0, 180);
    if (!response.ok) {
      throw new Error(preview || fallbackMessage);
    }
    throw new Error(`The API returned an unreadable response. ${preview || fallbackMessage}`);
  }
}

function apiFallbackMessage(response: Response, url: string) {
  const route = url.replace(/^\/api\//, "");

  if (response.status === 504 || response.status === 524) {
    return `The ${route} request timed out. Try again, or check that the local API server is still running.`;
  }

  if (response.status === 502 || response.status === 503) {
    return `The ${route} API is unavailable. Check that the local API server is running on port 8787.`;
  }

  return `${route} request failed with HTTP ${response.status}.`;
}

function extractApiErrorMessage(data: { error?: string | { message?: string }; message?: string }) {
  if (typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }

  if (data.error && typeof data.error === "object" && typeof data.error.message === "string") {
    return data.error.message;
  }

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  return null;
}

function describeApiConnectionError(error: unknown) {
  if (error instanceof TypeError && /fetch|network|failed/i.test(error.message)) {
    return "Could not reach the lesson-planning API. Make sure the API server is running on http://127.0.0.1:8787, then try again.";
  }

  return error instanceof Error ? error.message : "Could not reach the lesson-planning API.";
}

function normalizeTranscriptText(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function isMeaningfulEducatorTurn(text: string, latestPlannerSpeech: string) {
  const normalized = normalizeTranscriptText(text);

  if (normalized.length < 8) {
    return false;
  }

  if (
    normalized.startsWith("start a voice lesson planning interview") ||
    normalized.includes("draft for educator review")
  ) {
    return false;
  }

  const words = normalized.match(/[a-z0-9]+/g) || [];
  if (words.length < 3) {
    return false;
  }

  const latestPlanner = normalizeTranscriptText(latestPlannerSpeech);
  return !latestPlanner || (normalized !== latestPlanner && !latestPlanner.includes(normalized));
}

function cleanTranscriptEntries(entries: TranscriptEntry[]) {
  return entries
    .map((entry) => ({ ...entry, text: entry.text.trim() }))
    .filter((entry) => entry.text.length > 0 && !entry.text.startsWith("Start a voice lesson planning interview"));
}

function formatTranscript(entries: TranscriptEntry[]) {
  return cleanTranscriptEntries(entries)
    .map((entry) => `${entry.role === "educator" ? "You" : "PlannerQ"}: ${entry.text}`)
    .join("\n\n");
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="stack-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function TranscriptReviewPanel({
  entries,
  copied,
  onCopy
}: {
  entries: TranscriptEntry[];
  copied: boolean;
  onCopy: () => void;
}) {
  const visibleEntries = cleanTranscriptEntries(entries);

  if (visibleEntries.length === 0) {
    return null;
  }

  return (
    <section className="transcript-review-card" aria-label="Voice transcript">
      <div className="transcript-review-head">
        <div>
          <span className="section-eyebrow">Voice transcript</span>
          <h2>Review what was captured</h2>
          <p>Use this as source notes before trusting the extracted requirements.</p>
        </div>
        <button className="quiet-button compact-button" onClick={onCopy}>
          <Copy size={16} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="transcript-review-log">
        {visibleEntries.map((entry) => (
          <article className={entry.role} key={entry.id}>
            <strong>{entry.role === "educator" ? "You" : "PlannerQ"}</strong>
            <p>{entry.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AgentReviewPanel({
  review,
  title,
  ariaLabel,
  noRevisionCopy,
  compact = false
}: {
  review: BriefAgentReview | LessonAgentReview | OptionAgentReview;
  title: string;
  ariaLabel: string;
  noRevisionCopy: string;
  compact?: boolean;
}) {
  const revisionItems =
    review.revisionRequired && review.revisionRequests.length > 0
      ? review.revisionRequests
      : [noRevisionCopy];

  const details = (
    <>
      <div className="agent-review-grid">
        <div>
          <strong>Strengths</strong>
          <List items={review.strengths} />
        </div>
        <div>
          <strong>Revision check</strong>
          <List items={revisionItems} />
        </div>
        <div>
          <strong>Pedagogy</strong>
          <List items={review.pedagogyNotes} />
        </div>
        <div>
          <strong>Tradition review</strong>
          <List items={review.traditionReviewNotes} />
        </div>
      </div>
      {review.educatorReviewNotes.length > 0 && (
        <div className="agent-review-footer">
          <strong>Educator review</strong>
          <List items={review.educatorReviewNotes} />
        </div>
      )}
    </>
  );

  if (compact) {
    return (
      <details className="agent-review-panel compact-review" aria-label={ariaLabel} open={review.revisionRequired}>
        <summary className="agent-review-heading">
          <AlertCircle size={20} />
          <div>
            <span>{title}</span>
            <p>{review.summary}</p>
          </div>
          <ChevronDown className="agent-review-toggle" size={18} aria-hidden="true" />
        </summary>
        {details}
      </details>
    );
  }

  return (
    <aside className="agent-review-panel" aria-label={ariaLabel}>
      <div className="agent-review-heading">
        <AlertCircle size={20} />
        <div>
          <span>{title}</span>
          <p>{review.summary}</p>
        </div>
      </div>
      {details}
    </aside>
  );
}

function LessonAgentReviewPanel({ review }: { review: LessonAgentReview }) {
  return (
    <AgentReviewPanel
      review={review}
      title="Plan review"
      ariaLabel="Plan review"
      noRevisionCopy="No required revision."
    />
  );
}

function OptionAgentReviewPanel({ review }: { review: OptionAgentReview }) {
  return (
    <AgentReviewPanel
      review={review}
      title="Option review"
      ariaLabel="Option review"
      noRevisionCopy="No required revision."
      compact
    />
  );
}

function BriefAgentReviewPanel({ review }: { review: BriefAgentReview }) {
  return (
    <AgentReviewPanel
      review={review}
      title="Outline review"
      ariaLabel="Outline review"
      noRevisionCopy="No required revision."
    />
  );
}

function LessonQualityGate({ review }: { review: LessonAgentReview }) {
  const revisionItems =
    review.revisionRequired && review.revisionRequests.length > 0 ? review.revisionRequests : ["No required revision."];

  return (
    <aside className="quality-gate" aria-label="Lesson draft quality review">
      <div className="quality-gate-heading">
        <CheckCircle2 size={20} />
        <div>
          <span>Quality check</span>
          <strong>{review.revisionRequired ? "Needs educator attention" : "Ready for your review"}</strong>
          <p>{review.summary}</p>
        </div>
      </div>
      <div className="quality-gate-grid">
        <div>
          <strong>Pedagogy</strong>
          <List items={review.pedagogyNotes} />
        </div>
        <div>
          <strong>Tradition fit</strong>
          <List items={review.traditionReviewNotes} />
        </div>
        <div>
          <strong>Revision</strong>
          <List items={revisionItems} />
        </div>
      </div>
      {review.educatorReviewNotes.length > 0 && (
        <div className="quality-gate-footer">
          <strong>Educator review</strong>
          <List items={review.educatorReviewNotes} />
        </div>
      )}
    </aside>
  );
}

function InterviewExtractionReview({
  draft,
  onUpdate,
  onApply,
  onDismiss,
  containerRef
}: {
  draft: InterviewExtraction;
  onUpdate: (field: "topic" | "lessonObjectives" | "planningRequirements", value: string) => void;
  onApply: () => void;
  onDismiss: () => void;
  containerRef?: React.Ref<HTMLElement>;
}) {
  return (
    <section className="interview-review-card" aria-label="Review lesson requirements" ref={containerRef}>
      <div className="interview-review-head">
        <div>
          <span className="section-eyebrow">Lesson requirements</span>
          <h2>Review requirements</h2>
        </div>
        <button className="icon-button" onClick={onDismiss} aria-label="Dismiss interview extraction">
          <X size={18} />
        </button>
      </div>
      <p>{draft.sourceSummary}</p>
      <label>
        Topic
        <input value={draft.topic} onChange={(event) => onUpdate("topic", event.target.value)} />
      </label>
      <label>
        <Target size={16} />
        Lesson objectives
        <textarea value={draft.lessonObjectives} onChange={(event) => onUpdate("lessonObjectives", event.target.value)} rows={3} />
      </label>
      <label>
        <MessageCircle size={16} />
        Planning requirements
        <textarea value={draft.planningRequirements} onChange={(event) => onUpdate("planningRequirements", event.target.value)} rows={4} />
      </label>
      {draft.openQuestions.length > 0 && (
        <aside className="review-attention" aria-label="Open questions to review">
          <div>
            <AlertCircle size={19} />
            <div>
              <strong>Check these before you continue</strong>
              <p>They may change the lesson direction or classroom fit.</p>
            </div>
          </div>
          <List items={draft.openQuestions} />
        </aside>
      )}
      <details className="inference-details">
        <summary>
          <div>
            <strong>Conversation notes</strong>
            <small>{draft.confidenceNotes.length > 0 ? "Review what may need a second look" : "No additional notes to review"}</small>
          </div>
          <ChevronDown size={18} aria-hidden="true" />
        </summary>
        <List items={draft.confidenceNotes.length > 0 ? draft.confidenceNotes : ["No additional confidence concerns."]} />
      </details>
      <div className="inline-actions">
        <button onClick={onApply} className="primary">
          <CheckCircle2 size={18} />
          Use these requirements
        </button>
      </div>
    </section>
  );
}

function LessonRequirementsReady({
  form,
  onUpdate,
  onGenerateOptions,
  loading
}: {
  form: FormState;
  onUpdate: (field: keyof FormState, value: string) => void;
  onGenerateOptions: () => void;
  loading: string | null;
}) {
  return (
    <section className="approved-notes-card" aria-label="Lesson requirements ready">
      <div>
        <span className="section-eyebrow">Lesson requirements</span>
        <h2>Ready for options</h2>
        <p>Review or adjust the requirements, then create options.</p>
      </div>
      <div className="typed-fallback-fields">
        <label>
          Topic
          <input value={form.topic} onChange={(event) => onUpdate("topic", event.target.value)} disabled={Boolean(loading)} />
        </label>
        <label>
          <Target size={16} />
          Learning goals
          <textarea value={form.lessonObjectives} onChange={(event) => onUpdate("lessonObjectives", event.target.value)} rows={2} disabled={Boolean(loading)} />
        </label>
        <label>
          <MessageCircle size={16} />
          Constraints
          <textarea value={form.planningRequirements} onChange={(event) => onUpdate("planningRequirements", event.target.value)} rows={3} disabled={Boolean(loading)} />
        </label>
      </div>
      <div className="inline-actions">
        <button onClick={onGenerateOptions} disabled={Boolean(loading)} className="primary">
          {loading === "options" ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
          Create options
        </button>
      </div>
    </section>
  );
}

function FreshStartPrompt({ onConfirm, onDismiss, busy }: { onConfirm: () => void; onDismiss: () => void; busy: boolean }) {
  return (
    <section className="fresh-start-prompt" aria-label="Start another lesson">
      <div>
        <span className="section-eyebrow">New lesson</span>
        <h2>Start a fresh draft?</h2>
        <p>This clears the current requirements and lesson draft. Saved reflections stay available for the next plan.</p>
      </div>
      <div className="inline-actions">
        <button onClick={onDismiss} className="quiet-button">
          Keep current lesson
        </button>
        <button onClick={onConfirm} className="primary" disabled={busy}>
          <RefreshCw size={18} />
          Start fresh
        </button>
      </div>
    </section>
  );
}

function ArtifactStage({ id, summary, completed, children }: {
  id: string;
  summary: string;
  completed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="artifact-stage" tabIndex={-1}>
      {completed ? (
        <details className="completed-stage">
          <summary><CheckCircle2 size={18} /><span>{summary}</span><span className="stage-revisit">Revisit</span><ChevronDown size={17} /></summary>
          {children}
        </details>
      ) : children}
    </div>
  );
}

function Section({
  title,
  icon,
  eyebrow,
  actions,
  children
}: {
  title: string;
  icon?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
          <div className="section-title">
            {icon}
            <h2>{title}</h2>
          </div>
        </div>
        {actions && <div className="section-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

function WorkflowRail({ steps }: { steps: FlowStep[] }) {
  return (
    <nav className="workflow-rail" aria-label="Planning workflow">
      {steps.map((step, index) => (
        <div className={`workflow-step ${step.status}`} key={step.label} aria-current={step.status === "active" ? "step" : undefined}>
          <span className="workflow-marker">
            {step.status === "done" ? <CheckCircle2 size={16} /> : step.status === "active" ? index + 1 : <Circle size={13} />}
          </span>
          <span>
            <strong>{step.label}</strong>
            <small>{step.detail}</small>
          </span>
        </div>
      ))}
    </nav>
  );
}

function LoadingState({ title, description }: { title: string; description: string }) {
  return (
    <section className="panel drafting-state" aria-live="polite">
      <div className="section-title">
        <Loader2 className="spin" size={22} />
        <h2>{title}</h2>
      </div>
      <p>{description}</p>
      <div className="draft-preview" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

function describeRealtimeError(err: unknown) {
  if (err instanceof Error && /local api server|failed to fetch|load failed|networkerror/i.test(err.message)) {
    return err.message;
  }

  if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError")) {
    return "Microphone access is blocked for this browser. Check site permissions for this preview, or type it out.";
  }

  if (err instanceof DOMException && err.name === "NotFoundError") {
    return "No microphone was found. Connect or enable a microphone, or type it out.";
  }

  if (err instanceof Error && /permission denied|notallowed/i.test(err.message)) {
    return "Microphone access is blocked for this browser. Check site permissions for this preview, or type it out.";
  }

  return err instanceof Error ? err.message : "Could not start realtime voice session";
}

export default function App() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [brief, setBrief] = useState<LessonBrief | null>(null);
  const [lessonOptions, setLessonOptions] = useState<LessonOption[]>([]);
  const [optionReview, setOptionReview] = useState<OptionAgentReview | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [expandedOptionIndex, setExpandedOptionIndex] = useState<number | null>(null);
  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [visuals, setVisuals] = useState<VisualPack | null>(null);
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceSignal, setVoiceSignal] = useState<VoiceSignal>("idle");
  const [showLessonMemory, setShowLessonMemory] = useState(false);
  const [reflectionDraft, setReflectionDraft] = useState<ReflectionDraft>(initialReflectionDraft);
  const [reflections, setReflections] = useState<LessonReflection[]>(loadReflections);
  const [reflectionSynthesis, setReflectionSynthesis] = useState<ReflectionMemorySynthesis | null>(loadReflectionSynthesis);
  const [synthesisStale, setSynthesisStale] = useState(false);
  const [editingReflectionId, setEditingReflectionId] = useState<string | null>(null);
  const [metricEvents, setMetricEvents] = useState<PlanningMetricEvent[]>(loadMetricEvents);
  const [practiceQuestion, setPracticeQuestion] = useState("");
  const [practiceAttempt, setPracticeAttempt] = useState("");
  const [rehearsalCritique, setRehearsalCritique] = useState<RehearsalCritique | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"idle" | "connecting" | "live">("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(loadVoiceTranscript);
  const [transcriptCopied, setTranscriptCopied] = useState(false);
  const [interviewDraft, setInterviewDraft] = useState<InterviewExtraction | null>(null);
  const [approvedInterviewDraft, setApprovedInterviewDraft] = useState<InterviewExtraction | null>(null);
  const [interviewApplied, setInterviewApplied] = useState(false);
  const [showFreshStartPrompt, setShowFreshStartPrompt] = useState(false);
  const [plannerMuted, setPlannerMuted] = useState(false);
  const [typedOpen, setTypedOpen] = useState(false);
  const [artifactToFocus, setArtifactToFocus] = useState<string | null>(null);
  const typedTopicRef = useRef<HTMLInputElement | null>(null);
  const requestInFlight = useRef(false);
  const realtimePeer = useRef<RTCPeerConnection | null>(null);
  const realtimeStream = useRef<MediaStream | null>(null);
  const realtimeAudio = useRef<HTMLAudioElement | null>(null);
  const realtimeChannel = useRef<RTCDataChannel | null>(null);
  const realtimeResponseInFlight = useRef(false);
  const latestPlannerSpeech = useRef("");
  const handledEducatorTurnIds = useRef<Set<string>>(new Set());
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const interviewReviewRef = useRef<HTMLElement | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const visualPackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!artifactToFocus) return;
    const artifact = document.getElementById(artifactToFocus);
    artifact?.focus({ preventScroll: true });
    artifact?.scrollIntoView({ behavior: "smooth", block: "start" });
    setArtifactToFocus(null);
  }, [artifactToFocus]);

  useEffect(() => {
    const cleaned = cleanTranscriptEntries(transcript).map((entry) => ({ ...entry, status: "final" as const }));
    if (cleaned.length === 0) {
      window.localStorage.removeItem(transcriptStorageKey);
      return;
    }
    window.localStorage.setItem(transcriptStorageKey, JSON.stringify(cleaned));
  }, [transcript]);

  const educatorTranscriptEntries = useMemo(
    () =>
      transcript.filter((entry) => {
        const text = entry.text.trim();
        return entry.role === "educator" && text.length > 0 && !text.startsWith("Start a voice lesson planning interview");
      }),
    [transcript]
  );
  const hasEducatorTranscript = educatorTranscriptEntries.length > 0;
  const hasReviewableTranscript = realtimeStatus === "idle" && cleanTranscriptEntries(transcript).length > 0;
  const selectedOption = selectedOptionIndex === null ? null : lessonOptions[selectedOptionIndex] ?? null;
  const hasTypedBrief = Boolean(form.topic.trim() || form.lessonObjectives.trim() || form.planningRequirements.trim());
  const hasApprovedVoiceNotes = Boolean(approvedInterviewDraft);
  const hasResettableDraft =
    hasTypedBrief ||
    hasEducatorTranscript ||
    Boolean(interviewDraft) ||
    hasApprovedVoiceNotes ||
    lessonOptions.length > 0 ||
    Boolean(brief) ||
    Boolean(lesson) ||
    Boolean(visuals) ||
    Boolean(rehearsal);
  const workflowStage: WorkflowStage = showLessonMemory
    ? "reflect"
    : lesson
      ? "plan"
      : brief
        ? "brief"
        : lessonOptions.length > 0
          ? "choose"
          : interviewDraft || hasApprovedVoiceNotes || (hasEducatorTranscript && realtimeStatus === "idle")
            ? "review"
            : "capture";
  const firstPlanningEvent = metricEvents
    .filter((event) => event.name === "planning_started")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  const firstUsablePlanEvent = metricEvents
    .filter((event) => event.name === "lesson_generated")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  const timeToUsablePlan =
    firstPlanningEvent && firstUsablePlanEvent
      ? Math.max(
          0,
          Math.round((new Date(firstUsablePlanEvent.createdAt).getTime() - new Date(firstPlanningEvent.createdAt).getTime()) / 60000)
        )
      : null;

  const workflowSteps: FlowStep[] = [
    {
      label: "Your idea",
      detail: realtimeStatus !== "idle" ? "Captions live" : hasTypedBrief || hasEducatorTranscript ? "Context captured" : "Capture requirements",
      status: workflowStage === "capture" ? "active" : "done"
    },
    {
      label: "Requirements",
      detail: hasApprovedVoiceNotes ? "Requirements approved" : interviewDraft ? "Review requirements" : "Confirm context",
      status: workflowStage === "review" ? "active" : hasApprovedVoiceNotes || lessonOptions.length > 0 || brief || lesson ? "done" : "idle"
    },
    {
      label: "Choose",
      detail: lessonOptions.length > 0 ? `${lessonOptions.length} approaches ready` : "Compare approaches",
      status: workflowStage === "choose" || loading === "options" ? "active" : brief || lesson ? "done" : "idle"
    },
    {
      label: "Outline",
      detail: brief ? "Outline ready" : "Draft and refine",
      status: workflowStage === "brief" || loading === "brief" || loading === "brief-update" ? "active" : lesson ? "done" : "idle"
    },
    {
      label: "Plan",
      detail: lesson ? "Draft for review" : "Draft lesson",
      status: workflowStage === "plan" || loading === "lesson" ? "active" : "idle"
    },
    {
      label: "Reflect",
      detail: reflections.length > 0 ? `${reflections.length} saved` : "Save reflection",
      status: workflowStage === "reflect" ? "active" : "idle"
    }
  ];

  const requestPayload = useMemo(
    () => ({
      ...form,
      outcome: form.lessonObjectives,
      classContext: form.planningRequirements,
      tradition: "Chinese Mahayana folk Buddhism",
      studentAge: "13",
      classSize: "4",
      duration: "90 minutes",
      teachingStyle: "Play-based learning and scaffolded self-directed learning",
      requiredScaffold: "Gradual release of responsibility: I do, We do, You do",
      selectedOption: selectedOptionIndex === null ? null : lessonOptions[selectedOptionIndex],
      lessonMemory: reflections.slice(0, 5).map((reflection) => ({
        id: reflection.id,
        date: reflection.date,
        topic: reflection.topic,
        lessonPlan: reflection.lessonPlan,
        workedWell: reflection.workedWell,
        didNotWork: reflection.didNotWork,
        studentResponse: reflection.studentResponse,
        nextTime: reflection.nextTime
      })),
      lessonMemoryInstruction:
        reflections.length > 0
          ? "Use lessonMemory as prior classroom evidence. Carry forward what worked, avoid or adapt what did not, and explicitly consider nextTime notes when drafting options, briefs, visuals, rehearsal, and the full lesson."
          : "No prior lesson memory has been logged yet.",
      reflectionSynthesis,
      referenceNotes,
      safety: "Educator-facing draft. No unsupervised student-agent interaction."
    }),
    [form, lessonOptions, reflectionSynthesis, reflections, selectedOptionIndex]
  );

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setApprovedInterviewDraft(null);
    setInterviewApplied(false);
  };

  const updateApprovedRequirements = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateInterviewDraft = (field: "topic" | "lessonObjectives" | "planningRequirements", value: string) => {
    setInterviewDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const clearGeneratedArtifacts = () => {
    setLessonOptions([]);
    setOptionReview(null);
    setSelectedOptionIndex(null);
    setExpandedOptionIndex(null);
    setBrief(null);
    setLesson(null);
    setVisuals(null);
    setGeneratedImage(null);
    setRehearsal(null);
    setRehearsalCritique(null);
    setPracticeAttempt("");
    setFeedback("");
  };

  const startFreshLesson = () => {
    if (requestInFlight.current) return;
    clearGeneratedArtifacts();
    setForm(initialForm);
    setPracticeQuestion("");
    setPracticeAttempt("");
    setRehearsalCritique(null);
    setTranscript([]);
    setTranscriptCopied(false);
    setInterviewDraft(null);
    setApprovedInterviewDraft(null);
    setInterviewApplied(false);
    setVoiceSignal("idle");
    setPlannerMuted(false);
    setShowLessonMemory(false);
    setEditingReflectionId(null);
    setReflectionDraft({ ...initialReflectionDraft, date: todayString() });
    setError(null);
    setShowFreshStartPrompt(false);
    setTypedOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateReflectionDraft = (field: keyof ReflectionDraft, value: string) => {
    setReflectionDraft((current) => ({ ...current, [field]: value }));
  };

  const trackMetric = (name: PlanningMetricEventName, detail?: string) => {
    const event: PlanningMetricEvent = {
      id: crypto.randomUUID(),
      name,
      detail,
      createdAt: new Date().toISOString()
    };
    setMetricEvents((current) => {
      const next = [event, ...current].slice(0, 200);
      window.localStorage.setItem(metricsStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const metricCount = (name: PlanningMetricEventName) => metricEvents.filter((event) => event.name === name).length;

  const persistReflections = (nextReflections: LessonReflection[]) => {
    setReflections(nextReflections);
    window.localStorage.setItem(reflectionStorageKey, JSON.stringify(nextReflections));
    setSynthesisStale(Boolean(reflectionSynthesis));
  };

  const resetReflectionDraft = () => {
    setReflectionDraft({
      date: todayString(),
      topic: form.topic,
      lessonPlan: lesson?.title || brief?.title || "",
      workedWell: "",
      didNotWork: "",
      studentResponse: "",
      nextTime: ""
    });
    setEditingReflectionId(null);
  };

  const saveReflection = () => {
    if (
      !reflectionDraft.topic.trim() ||
      (!reflectionDraft.lessonPlan.trim() &&
        !reflectionDraft.workedWell.trim() &&
        !reflectionDraft.didNotWork.trim() &&
        !reflectionDraft.studentResponse.trim() &&
        !reflectionDraft.nextTime.trim())
    ) {
      return;
    }

    if (editingReflectionId) {
      persistReflections(
        reflections.map((reflection) =>
          reflection.id === editingReflectionId ? { ...reflectionDraft, id: editingReflectionId } : reflection
        )
      );
      trackMetric("reflection_saved", "updated");
      resetReflectionDraft();
      return;
    }

    persistReflections([{ ...reflectionDraft, id: crypto.randomUUID() }, ...reflections].slice(0, 20));
    trackMetric("reflection_saved", "created");
    resetReflectionDraft();
  };

  const editReflection = (reflection: LessonReflection) => {
    const { id: _id, ...draft } = reflection;
    setReflectionDraft(draft);
    setEditingReflectionId(reflection.id);
    setShowLessonMemory(true);
  };

  const deleteReflection = (id: string) => {
    persistReflections(reflections.filter((reflection) => reflection.id !== id));
    if (editingReflectionId === id) {
      resetReflectionDraft();
    }
  };

  const seedReflectionFromCurrentPlan = () => {
    setReflectionDraft({
      date: todayString(),
      topic: form.topic,
      lessonPlan: lesson?.title || brief?.title || "",
      workedWell: "",
      didNotWork: "",
      studentResponse: "",
      nextTime: ""
    });
    setEditingReflectionId(null);
    setShowLessonMemory(true);
    window.setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 0);
  };

  const run = async <T,>(
    key: string,
    action: () => Promise<T>,
    onSuccess: (value: T) => void
  ) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setLoading(key);
    setError(null);
    try {
      const result = await action();
      onSuccess(result);
      const artifactId: Record<string, string> = {
        options: "options-stage", brief: "outline-stage", "brief-update": "outline-stage", lesson: "lesson-stage"
      };
      if (artifactId[key]) {
        setArtifactToFocus(artifactId[key]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      requestInFlight.current = false;
      setLoading(null);
    }
  };

  const printArtifact = (artifact: "lesson" | "visuals") => {
    document.body.dataset.printArtifact = artifact;
    trackMetric("artifact_printed", artifact);
    window.print();
    window.setTimeout(() => {
      delete document.body.dataset.printArtifact;
    }, 500);
  };

  const generateBrief = () => {
    setBrief(null);
    setLesson(null);
    setVisuals(null);
    setGeneratedImage(null);
    setRehearsal(null);
    setRehearsalCritique(null);
    setPracticeAttempt("");
    outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    return run("brief", () => postJson<LessonBrief>("/api/brief", requestPayload), (nextBrief) => {
      setBrief(nextBrief);
      trackMetric("brief_generated", nextBrief.title);
    });
  };

  const generateOptions = () => {
    setLessonOptions([]);
    setOptionReview(null);
    setSelectedOptionIndex(null);
    setExpandedOptionIndex(null);
    setBrief(null);
    setLesson(null);
    setVisuals(null);
    setGeneratedImage(null);
    setRehearsal(null);
    setRehearsalCritique(null);
    setPracticeAttempt("");
    outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (metricCount("planning_started") === 0) {
      trackMetric("planning_started", "typed or approved notes");
    }
    return run("options", () => postJson<LessonOptionsResponse>("/api/options", requestPayload), (result) => {
      setLessonOptions(result.options);
      setOptionReview(result.optionReview ?? null);
      trackMetric("options_generated", `${result.options.length} options`);
    });
  };

  const extractInterviewNotes = () => {
    if (!hasEducatorTranscript) return;

    return run(
      "interview-extract",
      () =>
        postJson<InterviewExtraction>("/api/interview/extract", {
          transcriptEntries: transcript
            .map((entry) => ({ role: entry.role, text: entry.text.trim() }))
            .filter((entry) => entry.text.length > 0),
          currentForm: form,
          lessonMemory: requestPayload.lessonMemory,
          tradition: requestPayload.tradition,
          studentAge: requestPayload.studentAge,
          classSize: requestPayload.classSize,
          duration: requestPayload.duration,
          safety: requestPayload.safety
        }),
      (draft) => {
        setApprovedInterviewDraft(null);
        setInterviewDraft(draft);
        setInterviewApplied(false);
        window.setTimeout(() => interviewReviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      }
    );
  };

  const copyTranscript = async () => {
    const text = formatTranscript(transcript);
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setTranscriptCopied(true);
      window.setTimeout(() => setTranscriptCopied(false), 1800);
    } catch {
      setError("Could not copy the transcript in this browser. You can still select and copy the text.");
    }
  };

  const applyInterviewDraft = () => {
    if (!interviewDraft) return;

    setForm({
      topic: interviewDraft.topic,
      lessonObjectives: interviewDraft.lessonObjectives,
      planningRequirements: interviewDraft.planningRequirements
    });
    clearGeneratedArtifacts();
    setApprovedInterviewDraft(interviewDraft);
    setInterviewDraft(null);
    setInterviewApplied(true);
    trackMetric("voice_notes_approved", interviewDraft.topic);
    outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectOption = (index: number) => {
    if (requestInFlight.current || selectedOptionIndex === index) return;
    setSelectedOptionIndex(index);
    setExpandedOptionIndex(index);
    setBrief(null);
    setLesson(null);
    setVisuals(null);
    setGeneratedImage(null);
    setRehearsal(null);
    setRehearsalCritique(null);
    setPracticeAttempt("");
    trackMetric("option_selected", `Option ${index + 1}`);
  };

  const updateBrief = () =>
    brief
      ? run(
          "brief-update",
          () => postJson<LessonBrief>("/api/brief/update", { context: requestPayload, brief, feedback }),
          (updatedBrief) => {
            setBrief(updatedBrief);
            setLesson(null);
            setVisuals(null);
            setGeneratedImage(null);
            setRehearsal(null);
            setRehearsalCritique(null);
            setPracticeAttempt("");
            setFeedback("");
            trackMetric("brief_refined", updatedBrief.title);
          }
        )
      : undefined;

  const generateLesson = () => {
    setLesson(null);
    setVisuals(null);
    setGeneratedImage(null);
    setRehearsal(null);
    setRehearsalCritique(null);
    setPracticeAttempt("");
    outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    return run("lesson", () => postJson<LessonPlan>("/api/lesson", { ...requestPayload, brief }), (nextLesson) => {
      setLesson(nextLesson);
      trackMetric("lesson_generated", nextLesson.title);
    });
  };

  const generateVisuals = () => {
    setVisuals(null);
    setGeneratedImage(null);
    window.setTimeout(() => visualPackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    return run("visuals", () => postJson<VisualPack>("/api/visuals", { ...requestPayload, brief, lesson }), (nextVisuals) => {
      setVisuals(nextVisuals);
      trackMetric("visuals_generated", nextVisuals.packTitle);
    });
  };

  const generateRehearsal = () =>
    run(
      "rehearsal",
      () =>
        postJson<Rehearsal>("/api/rehearsal", {
          ...requestPayload,
          brief,
          rehearsalPrompt: `Pretend you are a skeptical 13-year-old. Ask hard questions about ${form.topic}.`
        }),
      (nextRehearsal) => {
        setRehearsal(nextRehearsal);
        setPracticeQuestion(nextRehearsal.studentQuestions[0] || "");
        setRehearsalCritique(null);
        trackMetric("rehearsal_generated", nextRehearsal.scenario);
      }
    );

  const critiqueRehearsalAttempt = () => {
    if (!practiceQuestion.trim() || !practiceAttempt.trim()) return;

    return run(
      "rehearsal-critique",
      () =>
        postJson<RehearsalCritique>("/api/rehearsal/critique", {
          ...requestPayload,
          brief,
          lesson,
          rehearsal,
          practicedQuestion: practiceQuestion,
          educatorAttempt: practiceAttempt
        }),
      (critique) => {
        setRehearsalCritique(critique);
        trackMetric("rehearsal_critiqued", critique.practicedQuestion);
      }
    );
  };

  const synthesizeReflectionMemory = () => {
    if (reflections.length === 0) return;

    return run(
      "reflection-synthesis",
      () =>
        postJson<ReflectionMemorySynthesis>("/api/reflections/synthesize", {
          reflections,
          existingSynthesis: reflectionSynthesis,
          referenceNotes
        }),
      (synthesis) => {
        setReflectionSynthesis(synthesis);
        setSynthesisStale(false);
        window.localStorage.setItem(reflectionSynthesisStorageKey, JSON.stringify(synthesis));
      }
    );
  };

  const generateImage = () =>
    visuals?.imagePrompt
      ? run(
          "image",
          () => postJson<{ b64: string | null; url: string | null }>("/api/image", { prompt: visuals.imagePrompt }),
          (result) => {
            setGeneratedImage(result.b64 ? `data:image/png;base64,${result.b64}` : result.url);
            trackMetric("image_generated", visuals.packTitle);
          }
        )
      : undefined;

  const stopRealtime = () => {
    realtimeChannel.current?.close();
    realtimeChannel.current = null;
    realtimeResponseInFlight.current = false;
    latestPlannerSpeech.current = "";
    handledEducatorTurnIds.current = new Set();
    realtimePeer.current?.close();
    realtimePeer.current = null;
    realtimeStream.current?.getTracks().forEach((track) => track.stop());
    realtimeStream.current = null;
    if (realtimeAudio.current) {
      realtimeAudio.current.srcObject = null;
    }
    setRealtimeStatus("idle");
    setVoiceSignal("idle");
  };

  const togglePlannerAudio = () => {
    setPlannerMuted((current) => {
      const next = !current;
      if (realtimeAudio.current) {
        realtimeAudio.current.muted = next;
      }
      return next;
    });
  };

  const upsertTranscript = (
    id: string,
    role: TranscriptEntry["role"],
    text: string,
    mode: "append" | "replace",
    status: TranscriptEntry["status"]
  ) => {
    setTranscript((current) => {
      const existingIndex = current.findIndex((entry) => entry.id === id);
      if (existingIndex === -1) {
        return [...current, { id, role, text, status }];
      }

      const next = [...current];
      const existing = next[existingIndex];
      next[existingIndex] = {
        ...existing,
        role,
        text: mode === "append" ? `${existing.text}${text}` : text,
        status
      };
      return next;
    });
    window.setTimeout(() => transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight }), 0);
  };

  const requestPlannerVoiceResponse = (channel = realtimeChannel.current) => {
    if (!channel || channel.readyState !== "open" || realtimeResponseInFlight.current) {
      return;
    }

    realtimeResponseInFlight.current = true;
    channel.send(
      JSON.stringify({
        type: "response.create",
        response: {
          instructions: realtimeTurnInstructions
        }
      })
    );
  };

  const handleRealtimeEvent = (event: MessageEvent<string>) => {
    try {
      const data = JSON.parse(event.data);
      const type = data.type || "";

      if (
        type === "response.output_audio_transcript.delta" ||
        type === "response.audio_transcript.delta" ||
        type === "response.output_text.delta"
      ) {
        setVoiceSignal("speaking");
        const id = data.item_id || data.response_id || "planner-live";
        if (typeof data.delta === "string") {
          upsertTranscript(id, "planner", data.delta, "append", "partial");
        }
        return;
      }

      if (
        type === "response.output_audio_transcript.done" ||
        type === "response.audio_transcript.done" ||
        type === "response.output_text.done"
      ) {
        setVoiceSignal("listening");
        const id = data.item_id || data.response_id || "planner-live";
        if (typeof data.transcript === "string" || typeof data.text === "string") {
          const text = data.transcript || data.text;
          latestPlannerSpeech.current = text;
          upsertTranscript(id, "planner", text, "replace", "final");
        }
        return;
      }

      if (type === "response.done" || type === "response.cancelled") {
        realtimeResponseInFlight.current = false;
        return;
      }

      if (type === "conversation.item.input_audio_transcription.completed") {
        setVoiceSignal("listening");
        const id = data.item_id || `educator-${Date.now()}`;
        if (typeof data.transcript === "string") {
          upsertTranscript(id, "educator", data.transcript, "replace", "final");
          if (!handledEducatorTurnIds.current.has(id) && isMeaningfulEducatorTurn(data.transcript, latestPlannerSpeech.current)) {
            handledEducatorTurnIds.current.add(id);
            requestPlannerVoiceResponse();
          }
        }
        return;
      }

      if (type === "conversation.item.input_audio_transcription.delta") {
        setVoiceSignal("listening");
        const id = data.item_id || "educator-live";
        if (typeof data.delta === "string") {
          upsertTranscript(id, "educator", data.delta, "append", "partial");
        }
        return;
      }

      if (type === "conversation.item.created") {
        if (data.item?.id === voiceStarterItemId) {
          return;
        }
        const role = data.item?.role === "user" ? "educator" : "planner";
        const content = data.item?.content?.find((part: { transcript?: string; text?: string }) => part.transcript || part.text);
        const text = content?.transcript || content?.text;
        if (role === "educator" && typeof text === "string" && text.startsWith("Start a voice lesson planning interview")) {
          return;
        }
        const id = data.item?.id || `${role}-${Date.now()}`;
        if (typeof text === "string") {
          upsertTranscript(id, role, text, "replace", "final");
        }
      }
    } catch {
      // Realtime event shapes can vary. Ignore non-JSON or non-transcript events.
    }
  };

  const startRealtime = async () => {
    if (realtimeStatus === "live") {
      stopRealtime();
      return;
    }

    setRealtimeStatus("connecting");
    setVoiceSignal("connecting");
    setError(null);
    if (metricCount("planning_started") === 0) {
      trackMetric("planning_started", "voice");
    }
    window.localStorage.removeItem(transcriptStorageKey);
    setTranscript([]);
    setInterviewDraft(null);
    setApprovedInterviewDraft(null);
    setInterviewApplied(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support microphone access here. Use a browser with microphone support, or type it out.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      realtimeStream.current = stream;

      const healthResponse = await fetch("/api/health");
      if (!healthResponse.ok) {
        throw new Error("Local API server is not running. Start the API server, then try voice planning again.");
      }

      const tokenResponse = await fetch("/api/realtime/client-secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: requestPayload })
      });
      const tokenData = await readJsonResponse<{
        error?: string;
        value?: string;
        client_secret?: { value?: string };
        session?: { client_secret?: { value?: string } };
      }>(tokenResponse, "Could not start realtime session");
      if (!tokenResponse.ok) {
        throw new Error(tokenData.error || "Could not start realtime session");
      }

      const ephemeralKey = tokenData.value || tokenData.client_secret?.value || tokenData.session?.client_secret?.value;
      if (!ephemeralKey) {
        throw new Error("Realtime client secret response did not include a usable token");
      }

      const peer = new RTCPeerConnection();
      realtimePeer.current = peer;

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.muted = plannerMuted;
      realtimeAudio.current = audio;
      peer.ontrack = (event) => {
        audio.srcObject = event.streams[0];
      };

      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      const channel = peer.createDataChannel("oai-events");
      realtimeChannel.current = channel;
      channel.addEventListener("message", handleRealtimeEvent);
      channel.addEventListener("open", () => {
        channel.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              id: voiceStarterItemId,
              type: "message",
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `Start an educator planning conversation for this 90-minute lesson. Ask concise follow-up questions for any missing context, gather lesson requirements, and stop at captured requirements. Do not generate lesson options, a lesson outline, a full lesson plan, visuals, worksheets, or materials in this voice conversation. Topic: ${form.topic}. Lesson objectives: ${form.lessonObjectives}. Planning requirements: ${form.planningRequirements}.`
                }
              ]
            }
          })
        );
        requestPlannerVoiceResponse(channel);
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        }
      });
      if (!sdpResponse.ok) {
        throw new Error("Realtime WebRTC connection failed");
      }

      await peer.setRemoteDescription({
        type: "answer",
        sdp: await sdpResponse.text()
      });
      setRealtimeStatus("live");
      setVoiceSignal("listening");
    } catch (err) {
      stopRealtime();
      setVoiceSignal(describeRealtimeError(err).toLowerCase().includes("microphone") ? "permission-error" : "api-error");
      setError(describeRealtimeError(err));
    }
  };

  const showStartComposer =
    realtimeStatus === "idle" &&
    lessonOptions.length === 0 &&
    !brief &&
    !lesson &&
    !interviewDraft &&
    !hasEducatorTranscript &&
    !hasApprovedVoiceNotes;
  const showWorkflowRail = !showStartComposer && (
    realtimeStatus !== "idle" ||
    hasTypedBrief ||
    hasEducatorTranscript ||
    Boolean(interviewDraft) ||
    hasApprovedVoiceNotes ||
    lessonOptions.length > 0 ||
    Boolean(brief) ||
    Boolean(lesson) ||
    Boolean(rehearsal) ||
    Boolean(visuals) ||
    showLessonMemory ||
    reflections.length > 0);

  const useStarter = (starter: FormState) => {
    if (loading || hasTypedBrief) return;
    setForm({ topic: starter.topic, lessonObjectives: starter.lessonObjectives, planningRequirements: starter.planningRequirements });
    setTypedOpen(true);
    window.setTimeout(() => typedTopicRef.current?.focus(), 0);
  };

  return (
    <main className={`app-shell teaching-workspace ${showWorkflowRail ? "with-workflow" : "without-workflow"}`}>
      <a className="skip-link" href="#planning-content">Skip to lesson planning</a>
      <header className="app-sidebar">
        <div className="brand-lockup">
          <span className="brand-mark">
            <BookOpen size={22} />
          </span>
          <div><strong>PlannerQ</strong><span className="brand-caption">A little preparation. A meaningful lesson.</span></div>
        </div>
        <div className="sidebar-footer">
          {reflections.length > 0 ? (
            <button className="quiet-button" onClick={() => {
              setShowLessonMemory((current) => !current);
              if (!showLessonMemory) window.setTimeout(() => document.getElementById("reflection-workspace")?.scrollIntoView({ behavior: "smooth" }), 0);
            }}><NotebookPen size={17} />{showLessonMemory ? "Close reflections" : `Class reflections (${reflections.length})`}</button>
          ) : <span>Made for educators</span>}
        </div>
      </header>

      <div className="planner-workspace" id="planning-content" tabIndex={-1}>
        {showWorkflowRail && <WorkflowRail steps={workflowSteps} />}
        <div className="planner-grid solo">
          <section className="planner-main">

        {realtimeStatus === "idle" && hasResettableDraft && (
          showFreshStartPrompt ? (
            <FreshStartPrompt onConfirm={startFreshLesson} onDismiss={() => setShowFreshStartPrompt(false)} busy={Boolean(loading)} />
          ) : (
            <div className="fresh-start-action">
              <button onClick={() => setShowFreshStartPrompt(true)} className="quiet-button" disabled={Boolean(loading)}>
                <RefreshCw size={17} />
                Start another lesson
              </button>
            </div>
          )
        )}

        {showStartComposer && (
          <section className="brief-composer feature-section" aria-label="Start lesson plan">
            <div className="composer-head">
              <span className="section-eyebrow">Your next lesson starts here</span>
              <h1>What will you teach next?</h1>
              <p>Turn a rough idea into a thoughtful lesson you feel ready to lead.</p>
            </div>

            <div className="planning-context" aria-label="Default lesson context">
              <span className="tradition-context"><BookOpen size={15} />Chinese Mahayana folk Buddhist education</span>
              <span>
                <CalendarDays size={15} />
                90 minutes
              </span>
              <span>
                <Users size={15} />
                4 students · Age 13
              </span>
            </div>

            <div className="entry-layout">
            <div className="start-stack">
              <section className={`voice-primary-card mic-cta ${voiceSignal.includes("error") ? "has-error" : ""}`} aria-label="Voice planning">
                <div className="voice-cta-copy">
                  <span className="voice-cta-icon" aria-hidden="true"><Mic size={27} /></span>
                  <div>
                    <h2>Let’s talk about your lesson.</h2>
                    <p>Share your topic, what students should learn, and what your class needs. Include timing and any limits.</p>
                  </div>
                </div>
                <button onClick={startRealtime} className="primary voice-start-button" disabled={Boolean(loading)}>
                  <Mic size={18} />
                  Talk about it
                  <ArrowRight size={18} />
                </button>
                <p className="voice-review-note">You’ll review your requirements before creating options.</p>
              </section>

              <details className="typed-brief secondary-brief-card" open={typedOpen} onToggle={(event) => setTypedOpen(event.currentTarget.open)}>
                <summary>
                  <FileText size={18} />
                  <span>
                    <strong>Type it out</strong>
                    <small>Your ideas, in your own words.</small>
                  </span>
                  <ChevronDown size={18} className="typed-chevron" />
                </summary>

                <div className="typed-fallback-fields">
                  <label>
                    Topic
                    <input
                      ref={typedTopicRef}
                      disabled={Boolean(loading)}
                      value={form.topic}
                      onChange={(event) => update("topic", event.target.value)}
                      placeholder="Example: compassion in daily life"
                    />
                  </label>

                  <label>
                    <Target size={16} />
                    Learning goals
                    <textarea
                      disabled={Boolean(loading)}
                      value={form.lessonObjectives}
                      onChange={(event) => update("lessonObjectives", event.target.value)}
                      rows={2}
                      placeholder="What should students understand or practice?"
                    />
                  </label>

                  <label>
                    <MessageCircle size={16} />
                    Your class and practical needs
                    <textarea
                      disabled={Boolean(loading)}
                      value={form.planningRequirements}
                      onChange={(event) => update("planningRequirements", event.target.value)}
                      rows={3}
                      placeholder="Timing, student needs, materials, or limits."
                    />
                  </label>

                  <div className="typed-actions">
                    <button onClick={generateOptions} disabled={Boolean(loading) || !hasTypedBrief} className="primary">
                      {loading === "options" ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
                      Create three approaches
                    </button>
                  </div>
                </div>
              </details>
            </div>
            <aside className="lesson-starters" aria-label="Lesson starting points">
              <span className="section-eyebrow">A little inspiration</span>
              <h2>Start with an everyday moment.</h2>
              <p>Choose an idea to make your own.</p>
              <div className="starter-list">
                {lessonStarters.map((starter, index) => (
                  <button key={starter.label} onClick={() => useStarter(starter)} disabled={Boolean(loading) || hasTypedBrief}>
                    <span className="starter-number">0{index + 1}</span>
                    <span><strong>{starter.label}</strong><small>{starter.hint}</small></span>
                    <ArrowRight size={17} />
                  </button>
                ))}
              </div>
              <span className="starter-footnote">Starting ideas, ready for your changes.</span>
            </aside>
            </div>
            <div className="entry-outcomes" aria-label="What you can prepare">
              <span><FileText size={17} />A plan you can teach</span>
              <span><MessageCircle size={17} />Explanations you can practice</span>
              <span><NotebookPen size={17} />Reflections for next time</span>
            </div>
          </section>
        )}

        {error && (
          <div className="content notice-content">
            <div className="error status-notice" role="alert">
              <AlertCircle size={20} />
              <div>
                <strong>{voiceSignal === "permission-error" ? "Microphone permission needed" : "Something needs attention"}</strong>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {realtimeStatus !== "idle" && (
          <section className="voice-stage" aria-label="Voice planning conversation">
            <div className="voice-stage-top">
              <span>Voice planning</span>
              <strong>{realtimeStatus === "connecting" ? "Connecting" : "Listening"}</strong>
            </div>

            <div className="conversation-shell">
              <div className="voice-stage-center">
                <div className="stage-mic" aria-hidden="true">
                  <Mic size={24} />
                </div>
                <p>{realtimeStatus === "connecting" ? "Connecting your conversation" : "Go ahead — PlannerQ is listening"}</p>
                <button
                  aria-pressed={plannerMuted}
                  className="quiet-button compact-button mute-output-button"
                  onClick={togglePlannerAudio}
                >
                  {plannerMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  {plannerMuted ? "Unmute PlannerQ" : "Mute PlannerQ"}
                </button>
                <button onClick={stopRealtime} className="end-session">
                  Finish conversation
                </button>
              </div>

              <aside className="transcript-drawer">
                <div className="transcript-head">
                  <h2>Conversation notes</h2>
                </div>
                <div className="transcript-log" ref={transcriptRef} aria-live="polite" aria-relevant="additions text">
                  {transcript.length === 0 ? (
                    <p className="conversation-empty">
                      Captions will appear here as PlannerQ speaks and your microphone input is transcribed.
                    </p>
                  ) : (
                    transcript.map((entry) => (
                      <article className={`${entry.role} ${entry.status === "partial" ? "live-caption" : ""}`} key={entry.id}>
                        <strong>{entry.role === "educator" ? "You" : "PlannerQ"}</strong>
                        <p>{entry.text}</p>
                      </article>
                    ))
                  )}
                </div>
              </aside>
            </div>
          </section>
        )}

        <div className="content" ref={outputRef}>
          {realtimeStatus === "idle" && hasEducatorTranscript && !interviewApplied && !interviewDraft && (
            <>
              <TranscriptReviewPanel entries={transcript} copied={transcriptCopied} onCopy={copyTranscript} />
              <section className="inline-draft interview-ready-card">
                <div>
                  <span className="section-eyebrow">Lesson requirements</span>
                  <h2>Review requirements</h2>
                  <p>Turn the transcript into editable lesson requirements.</p>
                </div>
                <button onClick={extractInterviewNotes} disabled={Boolean(loading) || !hasEducatorTranscript} className="primary">
                  {loading === "interview-extract" ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
                  Review requirements
                </button>
              </section>
            </>
          )}

          {hasReviewableTranscript && (interviewDraft || (approvedInterviewDraft && lessonOptions.length === 0 && !brief && !lesson)) && (
            <TranscriptReviewPanel entries={transcript} copied={transcriptCopied} onCopy={copyTranscript} />
          )}

          {interviewDraft && (
            <InterviewExtractionReview
              draft={interviewDraft}
              onUpdate={updateInterviewDraft}
              onApply={applyInterviewDraft}
              onDismiss={() => setInterviewDraft(null)}
              containerRef={interviewReviewRef}
            />
          )}

          {realtimeStatus === "idle" && approvedInterviewDraft && lessonOptions.length === 0 && !brief && !lesson && (
            <LessonRequirementsReady form={form} onUpdate={updateApprovedRequirements} onGenerateOptions={generateOptions} loading={loading} />
          )}

          {loading === "interview-extract" && (
            <LoadingState
              title="Reviewing requirements"
              description="Turning captions into editable lesson requirements."
            />
          )}

          {loading === "options" && (
            <LoadingState
              title="Creating options"
              description="Drafting three approaches for review."
            />
          )}

          {(loading === "brief" || loading === "brief-update") && (
            <LoadingState
              title={loading === "brief-update" ? "Updating outline" : "Creating outline"}
              description="Turning the selected approach into a concise lesson outline."
            />
          )}

          {loading === "lesson" && (
            <LoadingState
              title="Drafting lesson plan"
              description="Building the full draft for educator review."
            />
          )}

          {lessonOptions.length > 0 && (
            <ArtifactStage id="options-stage" summary={`Approach: ${selectedOption?.title || "Compare your options"}`} completed={Boolean(brief || lesson)}>
            <Section
              title="Choose an approach"
              eyebrow="Options"
              icon={<FileText size={22} />}
              actions={
                <button onClick={generateOptions} disabled={Boolean(loading)} className="quiet-button">
                  {loading === "options" ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
                  Regenerate
                </button>
              }
            >
              <p className="muted">Compare the tradeoffs, then choose one direction to turn into an editable outline.</p>
              {optionReview && <OptionAgentReviewPanel review={optionReview} />}
              <div className="option-picker">
                {lessonOptions.map((option, index) => {
                  const isSelected = selectedOptionIndex === index;
                  const isExpanded = expandedOptionIndex === index;

                  return (
                    <article
                      className={`option-summary-card ${isSelected ? "selected" : ""} ${isExpanded ? "expanded" : ""}`}
                      key={`${option.title}-${index}`}
                    >
                      <div className="option-card-head">
                        <span className="option-kicker">Option {index + 1}</span>
                      </div>
                      <h3>{option.title}</h3>
                      <p>{option.bestFor}</p>
                      <dl className="option-compare-list">
                        <div>
                          <dt>Materials</dt>
                          <dd>{option.visualPackRecommended ? "Recommended" : "Optional"}</dd>
                        </div>
                        <div>
                          <dt>Practice</dt>
                          <dd>{option.rehearsalFocus}</dd>
                        </div>
                        <div>
                          <dt>Tradeoff</dt>
                          <dd>{option.tradeoffs[0]}</dd>
                        </div>
                      </dl>
                      <div className="activity-chips" aria-label={`Sample activities for ${option.title}`}>
                        {option.activities.slice(0, 2).map((activity, activityIndex) => (
                          <span key={`${activity}-${activityIndex}`}>{activity}</span>
                        ))}
                        {option.activities.length > 2 && <span>+{option.activities.length - 2} more</span>}
                      </div>
                      <div className="option-card-actions">
                        <button onClick={() => selectOption(index)} aria-pressed={isSelected} disabled={Boolean(loading)}>
                          {isSelected ? <CheckCircle2 size={18} /> : <FileText size={18} />}
                          {isSelected ? "Selected approach" : "Choose this approach"}
                        </button>
                        {isSelected && (
                          <button onClick={generateBrief} disabled={Boolean(loading)} className="primary">
                            {loading === "brief" ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
                            Create lesson outline
                          </button>
                        )}
                        <button
                          aria-expanded={isExpanded}
                          className="quiet-button"
                          onClick={() => setExpandedOptionIndex(isExpanded ? null : index)}
                        >
                          <ChevronDown className={isExpanded ? "rotate" : ""} size={18} />
                          {isExpanded ? "Collapse" : "Read more"}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="option-expanded">
                          <div className="option-detail-header">
                            <span className="option-pill">
                              {option.visualPackRecommended ? "Materials recommended" : "Materials optional"}
                            </span>
                          </div>
                          <p>{option.approach}</p>
                          <div className="option-detail-grid">
                            <div>
                              <strong>Lesson shape</strong>
                              <List items={option.lessonShape} />
                            </div>
                            <div>
                              <strong>Activities</strong>
                              <List items={option.activities} />
                            </div>
                            <div>
                              <strong>Tradeoffs</strong>
                              <List items={option.tradeoffs} />
                            </div>
                            <div>
                              <strong>Rehearsal focus</strong>
                              <p>{option.rehearsalFocus}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </Section>
            </ArtifactStage>
          )}

          {brief && (
            <ArtifactStage id="outline-stage" summary={`Outline: ${brief.title}`} completed={Boolean(lesson)}>
            <Section
              title={brief.title}
              eyebrow="Lesson outline"
              icon={<FileText size={22} />}
              actions={
                <button onClick={generateBrief} disabled={Boolean(loading)} className="quiet-button">
                  {loading === "brief" ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
                  Regenerate
                </button>
              }
            >
              <div className="brief-hero">
                <div>
                  <span>Outline summary</span>
                  <p>{brief.briefSummary}</p>
                </div>
                <div>
                  <span>Student takeaway</span>
                  <p>{brief.studentTakeaway}</p>
                </div>
              </div>

              {brief.agentReview && <BriefAgentReviewPanel review={brief.agentReview} />}

              <div>
                <h3>Key choices</h3>
                <List items={brief.keyChoices} />
              </div>

              <label className="feedback-box">
                Revision notes
                <textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  rows={4}
                  placeholder="Add changes for the outline."
                />
              </label>

              <div className="inline-actions">
                <button onClick={updateBrief} disabled={Boolean(loading) || !feedback.trim()}>
                  {loading === "brief-update" ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
                  Apply refinement
                </button>
                <button onClick={generateLesson} disabled={Boolean(loading)} className="primary">
                  {loading === "lesson" ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
                  Create lesson plan
                </button>
              </div>
            </Section>
            </ArtifactStage>
          )}

          {loading === "rehearsal" && (
            <LoadingState
              title="Preparing practice"
              description="Creating likely questions and practice language."
            />
          )}

          {rehearsal && (
            <Section
              title="Practice explanation"
              eyebrow="Practice"
              icon={<Mic size={22} />}
              actions={
                <button onClick={generateRehearsal} disabled={Boolean(loading)} className="quiet-button">
                  {loading === "rehearsal" ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
                  Regenerate
                </button>
              }
            >
              <div className="brief-hero single">
                <div>
                  <span>Scenario</span>
                  <p>{rehearsal.scenario}</p>
                </div>
              </div>
              <div className="two-col">
                <div>
                  <h3>Student questions</h3>
                  <List items={rehearsal.studentQuestions} />
                </div>
                <div>
                  <h3>Plain language</h3>
                  <List items={rehearsal.simplerLanguage} />
                </div>
              </div>
              <h3>Suggested responses</h3>
              <List items={rehearsal.suggestedResponses} />
              <section className="practice-loop" aria-label="Practice explanation critique">
                <div>
                  <span className="section-eyebrow">Practice attempt</span>
                  <h3>Practice an answer</h3>
                  <p className="muted">Type an answer to check clarity, tone, age fit, and tradition fit.</p>
                </div>
                <label>
                  Student question
                  <select value={practiceQuestion} onChange={(event) => setPracticeQuestion(event.target.value)}>
                    <option value="">Choose a question</option>
                    {rehearsal.studentQuestions.map((question) => (
                      <option value={question} key={question}>
                        {question}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Question
                  <input value={practiceQuestion} onChange={(event) => setPracticeQuestion(event.target.value)} />
                </label>
                <label>
                  Your answer
                  <textarea
                    value={practiceAttempt}
                    onChange={(event) => setPracticeAttempt(event.target.value)}
                    rows={4}
                    placeholder="Write what you would say to the class."
                  />
                </label>
                <button onClick={critiqueRehearsalAttempt} disabled={Boolean(loading) || !practiceQuestion.trim() || !practiceAttempt.trim()}>
                  {loading === "rehearsal-critique" ? <Loader2 className="spin" size={18} /> : <MessageCircle size={18} />}
                  Review answer
                </button>
                {rehearsalCritique && (
                  <div className="critique-result">
                    <span className="section-eyebrow">Answer review</span>
                    <h3>{rehearsalCritique.summary}</h3>
                    <div className="two-col">
                      <div>
                        <strong>Strengths</strong>
                        <List items={rehearsalCritique.strengths} />
                      </div>
                      <div>
                        <strong>Clarity</strong>
                        <List items={rehearsalCritique.clarityNotes} />
                      </div>
                      <div>
                        <strong>Tone and age fit</strong>
                        <List items={rehearsalCritique.toneAndAgeFitNotes} />
                      </div>
                      <div>
                        <strong>Tradition fit</strong>
                        <List items={rehearsalCritique.traditionCautionNotes} />
                      </div>
                    </div>
                    <div className="suggested-revision">
                      <strong>Suggested version</strong>
                      <p>{rehearsalCritique.suggestedRevision}</p>
                    </div>
                    <p className="muted">{rehearsalCritique.nextPracticePrompt}</p>
                  </div>
                )}
              </section>
              <div className="inline-actions">
                <button onClick={generateLesson} disabled={Boolean(loading) || !brief} className="primary">
                  {loading === "lesson" ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
                  Create lesson plan
                </button>
                <button onClick={seedReflectionFromCurrentPlan} className="quiet-button">
                  <Save size={18} />
                  Save reflection
                </button>
              </div>
            </Section>
          )}

          {lesson && (
            <section id="lesson-stage" tabIndex={-1} className="lesson-document panel" aria-label="Lesson plan draft">
              <div className="lesson-document-header">
                <div>
                  <span className="section-eyebrow">Lesson plan draft</span>
                  <div className="section-title">
                    <BookOpen size={22} />
                    <h2>{lesson.title}</h2>
                  </div>
                  <p>Draft for educator review</p>
                </div>
                <div className="section-actions">
                  <button onClick={() => printArtifact("lesson")} className="primary">
                    <Printer size={18} />
                    Print / Save as PDF
                  </button>
                  <button onClick={generateLesson} disabled={Boolean(loading)} className="quiet-button">
                    {loading === "lesson" ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
                    Regenerate
                  </button>
                  <button onClick={generateVisuals} disabled={Boolean(loading)} className="quiet-button">
                    {loading === "visuals" ? <Loader2 className="spin" size={18} /> : <Image size={18} />}
                    Create materials
                  </button>
                  <button onClick={generateRehearsal} disabled={Boolean(loading)} className="quiet-button">
                    {loading === "rehearsal" ? <Loader2 className="spin" size={18} /> : <Mic size={18} />}
                    Practice explanation
                  </button>
                  <button onClick={seedReflectionFromCurrentPlan} className="quiet-button">
                    <Save size={18} />
                    Save reflection
                  </button>
                </div>
              </div>

              <div className="lesson-document-grid">
                <article className="lesson-draft-body">
                  <section>
                    <h3>Overview</h3>
                    <div className="lesson-overview">
                      <article>
                        <span>Summary</span>
                        <p>{lesson.summary}</p>
                      </article>
                      <article>
                        <span>Tradition note</span>
                        <p>{lesson.traditionNote}</p>
                      </article>
                      <article>
                        <span>Real-life application</span>
                        <p>{lesson.realLifeApplication}</p>
                      </article>
                      <article>
                        <span>Take-home</span>
                        <p>{lesson.takeHome}</p>
                      </article>
                    </div>
                  </section>

                  <section className="two-col">
                    <div>
                      <h3>Learning objectives</h3>
                      <List items={lesson.learningObjectives} />
                    </div>
                    <div>
                      <h3>Teaching anchor</h3>
                      <p>{lesson.teachingAnchor}</p>
                    </div>
                  </section>

                  <section>
                    <h3>Lesson flow</h3>
                    <div className="timeline">
                      {lesson.lessonFlow.map((item, index) => (
                        <article key={`${item.segment}-${index}`}>
                          <strong>{item.segment}</strong>
                          <span>{item.duration}</span>
                          <p>{item.educatorMove}</p>
                          <p className="muted">{item.studentAction}</p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="two-col">
                    <div>
                      <h3>{lesson.playBasedActivity.name}</h3>
                      <List items={lesson.playBasedActivity.instructions} />
                    </div>
                    <div>
                      <h3>Self-directed scaffold</h3>
                      <p>
                        <strong>{lesson.selfDirectedLearning.framework}</strong>
                      </p>
                      <dl className="scaffold-list">
                        <div>
                          <dt>I do</dt>
                          <dd>{lesson.selfDirectedLearning.iDo}</dd>
                        </div>
                        <div>
                          <dt>We do</dt>
                          <dd>{lesson.selfDirectedLearning.weDo}</dd>
                        </div>
                        <div>
                          <dt>You do</dt>
                          <dd>{lesson.selfDirectedLearning.youDo}</dd>
                        </div>
                      </dl>
                    </div>
                  </section>

                  <section className="two-col">
                    <div>
                      <h3>Reflection</h3>
                      <List items={lesson.reflection} />
                    </div>
                    <div>
                      <h3>Educator notes</h3>
                      <List items={lesson.reviewNotes} />
                    </div>
                  </section>
                </article>

                <aside className="lesson-document-aside">
                  {lesson.agentReview && <LessonQualityGate review={lesson.agentReview} />}
                </aside>
              </div>
            </section>
          )}

          {(loading === "visuals" || visuals) && (
            <div className="embedded-output" ref={visualPackRef}>
              {loading === "visuals" && (
                <section className="drafting-state inline-draft" aria-live="polite">
                  <div className="section-title">
                    <Loader2 className="spin" size={20} />
                    <h3>Creating materials</h3>
                  </div>
                  <p>Creating printable classroom materials for this lesson.</p>
                  <div className="draft-preview" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                </section>
              )}

              {visuals && (
                <section className="inline-result visual-pack-printable">
                  <div className="artifact-heading">
                    <div className="section-title">
                      <Image size={20} />
                      <h3>{visuals.packTitle}</h3>
                    </div>
                    <button onClick={() => printArtifact("visuals")} className="quiet-button">
                      <Printer size={18} />
                      Print / Save as PDF
                    </button>
                  </div>
                  <p>{visuals.styleGuidance}</p>
                  <div className="image-prompt">
                    <p>{visuals.imagePrompt}</p>
                    <button onClick={generateImage} disabled={Boolean(loading)}>
                      {loading === "image" ? <Loader2 className="spin" size={18} /> : <PlayCircle size={18} />}
                      Create image
                    </button>
                  </div>
                  {generatedImage && (
                    <div className="generated-image">
                      <img src={generatedImage} alt="Generated lesson visual" />
                    </div>
                  )}
                  <div className="two-col">
                    <div>
                      <h3>Scenario cards</h3>
                      <List items={visuals.scenarioCards} />
                    </div>
                    <div>
                      <h3>Value cards</h3>
                      <List items={visuals.valueCards} />
                    </div>
                  </div>
                  <h3>Storyboard panels</h3>
                  <div className="cards-grid">
                    {visuals.storyboardPanels.map((panel, index) => (
                      <article key={`${panel.panel}-${index}`}>
                        <strong>{panel.panel}</strong>
                        <p>{panel.caption}</p>
                        <span>{panel.studentPrompt}</span>
                      </article>
                    ))}
                  </div>
                  <h3>Worksheet prompts</h3>
                  <List items={visuals.worksheetPrompts} />
                </section>
              )}
            </div>
          )}

          {realtimeStatus === "idle" && (lesson || showLessonMemory) && (
            <div id="reflection-workspace">
            <Section
              title="Save reflection"
              eyebrow="Reflection"
              icon={<NotebookPen size={22} />}
              actions={<span className="saved-count">{reflections.length} saved</span>}
            >
              <p className="muted">
                Save what happened after class. Your five latest reflections help shape future plans. Saved in this browser.
              </p>

              {reflections.length > 0 && (
                <section className={`classroom-evidence ${synthesisStale ? "stale" : ""}`} aria-label="Classroom evidence memory">
                  <div className="artifact-heading">
                    <div>
                      <span className="section-eyebrow">Classroom evidence</span>
                      <h3>{reflectionSynthesis ? "Reflection summary" : "No summary yet"}</h3>
                    </div>
                    <button onClick={synthesizeReflectionMemory} disabled={Boolean(loading)}>
                      {loading === "reflection-synthesis" ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
                      {reflectionSynthesis ? "Update summary" : "Summarize reflections"}
                    </button>
                  </div>
                  {reflectionSynthesis ? (
                    <>
                      {synthesisStale && <p className="muted">Reflections changed after this synthesis. Regenerate when ready.</p>}
                      <p>{reflectionSynthesis.summary}</p>
                      <div className="evidence-grid">
                        <div>
                          <strong>Carry forward</strong>
                          <List items={reflectionSynthesis.workedWellPatterns} />
                        </div>
                        <div>
                          <strong>Adjust or avoid</strong>
                          <List items={reflectionSynthesis.avoidOrAdjustPatterns} />
                        </div>
                        <div>
                          <strong>Student response</strong>
                          <List items={reflectionSynthesis.studentResponseThemes} />
                        </div>
                        <div>
                          <strong>Next-time guidance</strong>
                          <List items={reflectionSynthesis.nextTimeGuidance} />
                        </div>
                      </div>
                      {reflectionSynthesis.cautionNotes.length > 0 && (
                        <div className="suggested-revision">
                          <strong>Cautions</strong>
                          <List items={reflectionSynthesis.cautionNotes} />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="muted">Summarize saved reflections into planning evidence.</p>
                  )}
                </section>
              )}

              <div className="inline-actions">
                <button className="primary" onClick={() => setShowLessonMemory((current) => !current)}>
                  <NotebookPen size={18} />
                  {showLessonMemory ? "Hide form" : "Add reflection"}
                </button>
                {(brief || lesson) && (
                  <button className="quiet-button" onClick={seedReflectionFromCurrentPlan}>
                    <Save size={18} />
                    Use this plan
                  </button>
                )}
              </div>

              {showLessonMemory && (
                <div className="reflection-composer">
                  {editingReflectionId && (
                    <div className="edit-banner">
                      <span>Editing saved reflection</span>
                      <button className="quiet-button" onClick={resetReflectionDraft}>
                        <X size={16} />
                        Cancel edit
                      </button>
                    </div>
                  )}
                  <div className="field-grid">
                    <label>
                      <CalendarDays size={16} />
                      Lesson date
                      <input
                        type="date"
                        value={reflectionDraft.date}
                        onChange={(event) => updateReflectionDraft("date", event.target.value)}
                      />
                    </label>
                    <label>
                      <BookOpen size={16} />
                      Lesson topic
                      <input
                        value={reflectionDraft.topic}
                        onChange={(event) => updateReflectionDraft("topic", event.target.value)}
                      />
                    </label>
                  </div>

                  <label>
                    <FileText size={16} />
                    Plan used
                    <textarea
                      value={reflectionDraft.lessonPlan}
                      onChange={(event) => updateReflectionDraft("lessonPlan", event.target.value)}
                      rows={3}
                      placeholder="Name the plan or activity flow used."
                    />
                  </label>

                  <div className="two-col">
                    <label>
                      <CheckCircle2 size={16} />
                      What worked well
                      <textarea
                        value={reflectionDraft.workedWell}
                        onChange={(event) => updateReflectionDraft("workedWell", event.target.value)}
                        rows={4}
                        placeholder="Example: Role-play helped the students connect compassion to school conflict."
                      />
                    </label>
                    <label>
                      <MessageCircle size={16} />
                      What to adjust
                      <textarea
                        value={reflectionDraft.didNotWork}
                        onChange={(event) => updateReflectionDraft("didNotWork", event.target.value)}
                        rows={4}
                        placeholder="Example: The story introduction was too long."
                      />
                    </label>
                  </div>

                  <div className="two-col">
                    <label>
                      <Target size={16} />
                      Student response
                      <textarea
                        value={reflectionDraft.studentResponse}
                        onChange={(event) => updateReflectionDraft("studentResponse", event.target.value)}
                        rows={4}
                        placeholder="What did students understand, resist, enjoy, or ask?"
                      />
                    </label>
                    <label>
                      <Wand2 size={16} />
                      Next time
                      <textarea
                        value={reflectionDraft.nextTime}
                        onChange={(event) => updateReflectionDraft("nextTime", event.target.value)}
                        rows={4}
                        placeholder="What should the next lesson repeat, avoid, or deepen?"
                      />
                    </label>
                  </div>

                  <button onClick={saveReflection} className="primary" disabled={!reflectionDraft.topic.trim()}>
                    <Save size={18} />
                    {editingReflectionId ? "Update reflection" : "Save reflection"}
                  </button>
                </div>
              )}

              {reflections.length > 0 && (
                <div className="reflection-list">
                  <h3>Saved reflections</h3>
                  {reflections.map((reflection) => (
                    <article key={reflection.id}>
                      <div>
                        <span>{reflection.date}</span>
                        <strong>{reflection.topic}</strong>
                      </div>
                      <p>
                        {[reflection.lessonPlan, reflection.workedWell, reflection.didNotWork, reflection.nextTime]
                          .filter(Boolean)
                          .slice(0, 2)
                          .join(" ")}
                      </p>
                      <div className="reflection-actions">
                        <button className="quiet-button" onClick={() => editReflection(reflection)}>
                          <Pencil size={16} />
                          Edit
                        </button>
                        <button
                          aria-label={`Delete reflection for ${reflection.topic}`}
                          className="quiet-button danger-button"
                          onClick={() => deleteReflection(reflection.id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Section>
            </div>
          )}

        </div>
          </section>

        </div>
      </div>
    </main>
  );
}
