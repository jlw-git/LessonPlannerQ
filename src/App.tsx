import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  Circle,
  FileText,
  Image,
  Loader2,
  MessageCircle,
  Mic,
  NotebookPen,
  Pencil,
  PlayCircle,
  RefreshCw,
  Save,
  Target,
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
  Rehearsal,
  VisualPack
} from "./types";

type FormState = {
  topic: string;
  lessonObjectives: string;
  planningRequirements: string;
};

type TranscriptEntry = {
  id: string;
  role: "educator" | "planner";
  text: string;
};

type VoiceSignal = "idle" | "connecting" | "listening" | "speaking" | "permission-error" | "api-error";

type FlowStep = {
  label: string;
  detail: string;
  status: "done" | "active" | "idle";
};

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

const initialForm: FormState = {
  topic: "",
  lessonObjectives: "",
  planningRequirements: ""
};

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

function List({ items }: { items: string[] }) {
  return (
    <ul className="stack-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function AgentReviewPanel({
  review,
  title,
  ariaLabel,
  noRevisionCopy
}: {
  review: BriefAgentReview | LessonAgentReview | OptionAgentReview;
  title: string;
  ariaLabel: string;
  noRevisionCopy: string;
}) {
  const revisionItems =
    review.revisionRequired && review.revisionRequests.length > 0
      ? review.revisionRequests
      : [noRevisionCopy];

  return (
    <aside className="agent-review-panel" aria-label={ariaLabel}>
      <div className="agent-review-heading">
        <AlertCircle size={20} />
        <div>
          <span>{title}</span>
          <p>{review.summary}</p>
        </div>
      </div>
      <div className="agent-review-grid">
        <div>
          <strong>Strengths</strong>
          <List items={review.strengths} />
        </div>
        <div>
          <strong>Revisions checked</strong>
          <List items={revisionItems} />
        </div>
        <div>
          <strong>Pedagogy notes</strong>
          <List items={review.pedagogyNotes} />
        </div>
        <div>
          <strong>Tradition review</strong>
          <List items={review.traditionReviewNotes} />
        </div>
      </div>
      {review.educatorReviewNotes.length > 0 && (
        <div className="agent-review-footer">
          <strong>For educator review</strong>
          <List items={review.educatorReviewNotes} />
        </div>
      )}
    </aside>
  );
}

function LessonAgentReviewPanel({ review }: { review: LessonAgentReview }) {
  return (
    <AgentReviewPanel
      review={review}
      title="Plan critic review"
      ariaLabel="Plan critic review"
      noRevisionCopy="No required revision after critic review."
    />
  );
}

function OptionAgentReviewPanel({ review }: { review: OptionAgentReview }) {
  return (
    <AgentReviewPanel
      review={review}
      title="Option critic review"
      ariaLabel="Option critic review"
      noRevisionCopy="No required option revision after critic review."
    />
  );
}

function BriefAgentReviewPanel({ review }: { review: BriefAgentReview }) {
  return (
    <AgentReviewPanel
      review={review}
      title="Brief critic review"
      ariaLabel="Brief critic review"
      noRevisionCopy="No required brief revision after critic review."
    />
  );
}

function InterviewExtractionReview({
  draft,
  onUpdate,
  onApply,
  onDismiss
}: {
  draft: InterviewExtraction;
  onUpdate: (field: "topic" | "lessonObjectives" | "planningRequirements", value: string) => void;
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <section className="interview-review-card" aria-label="Review extracted interview notes">
      <div className="interview-review-head">
        <div>
          <span className="section-eyebrow">Interview notes</span>
          <h2>Review extracted planning fields</h2>
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
      <div className="interview-review-grid">
        <div>
          <strong>Open questions</strong>
          <List items={draft.openQuestions.length > 0 ? draft.openQuestions : ["No open questions extracted."]} />
        </div>
        <div>
          <strong>Confidence notes</strong>
          <List items={draft.confidenceNotes.length > 0 ? draft.confidenceNotes : ["No additional confidence notes."]} />
        </div>
      </div>
      <div className="typed-actions">
        <button onClick={onApply} className="primary">
          <CheckCircle2 size={18} />
          Apply to typed brief
        </button>
      </div>
    </section>
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
        <div className={`workflow-step ${step.status}`} key={step.label}>
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
    return "Microphone access is blocked for this browser. Check site permissions for this preview, or use \"Write it out\".";
  }

  if (err instanceof DOMException && err.name === "NotFoundError") {
    return "No microphone was found. Connect or enable a microphone, or use \"Write it out\".";
  }

  if (err instanceof Error && /permission denied|notallowed/i.test(err.message)) {
    return "Microphone access is blocked for this browser. Check site permissions for this preview, or use \"Write it out\".";
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
  const [editingReflectionId, setEditingReflectionId] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"idle" | "connecting" | "live">("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interviewDraft, setInterviewDraft] = useState<InterviewExtraction | null>(null);
  const [interviewApplied, setInterviewApplied] = useState(false);
  const [plannerMuted, setPlannerMuted] = useState(false);
  const realtimePeer = useRef<RTCPeerConnection | null>(null);
  const realtimeStream = useRef<MediaStream | null>(null);
  const realtimeAudio = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const visualPackRef = useRef<HTMLDivElement | null>(null);

  const workflowSteps: FlowStep[] = [
    {
      label: "Start",
      detail: voiceSignal === "listening" || voiceSignal === "speaking" ? "Voice planning live" : "Voice conversation",
      status: lessonOptions.length > 0 || brief || rehearsal || lesson ? "done" : "active"
    },
    {
      label: "Choose",
      detail: lessonOptions.length > 0 ? `${lessonOptions.length} approaches ready` : "Compare approaches",
      status: brief || rehearsal || lesson ? "done" : lessonOptions.length > 0 || loading === "options" ? "active" : "idle"
    },
    {
      label: "Prepare",
      detail: rehearsal ? "Rehearsal ready" : brief ? "Brief ready" : "Brief and rehearsal",
      status: lesson ? "done" : brief || rehearsal || loading === "brief" || loading === "brief-update" || loading === "rehearsal" ? "active" : "idle"
    },
    {
      label: "Build",
      detail: visuals ? "Plan and visuals ready" : lesson ? "90-minute plan drafted" : "Full plan and visuals",
      status: lesson || visuals ? "done" : loading === "lesson" || loading === "visuals" || loading === "image" ? "active" : "idle"
    },
    {
      label: "Reflection",
      detail: reflections.length > 0 ? `${reflections.length} saved` : "Log what happened",
      status: showLessonMemory ? "active" : "idle"
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
      safety: "Educator-facing draft. No unsupervised student-agent interaction."
    }),
    [form, lessonOptions, reflections, selectedOptionIndex]
  );

  const update = (field: keyof FormState, value: string) => {
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
    setRehearsal(null);
    setGeneratedImage(null);
    setFeedback("");
  };

  const updateReflectionDraft = (field: keyof ReflectionDraft, value: string) => {
    setReflectionDraft((current) => ({ ...current, [field]: value }));
  };

  const persistReflections = (nextReflections: LessonReflection[]) => {
    setReflections(nextReflections);
    window.localStorage.setItem(reflectionStorageKey, JSON.stringify(nextReflections));
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
      resetReflectionDraft();
      return;
    }

    persistReflections([{ ...reflectionDraft, id: crypto.randomUUID() }, ...reflections].slice(0, 20));
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
    setLoading(key);
    setError(null);
    try {
      const result = await action();
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  const generateBrief = () => {
    setBrief(null);
    setLesson(null);
    setVisuals(null);
    setRehearsal(null);
    outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    return run("brief", () => postJson<LessonBrief>("/api/brief", requestPayload), setBrief);
  };

  const generateOptions = () => {
    setLessonOptions([]);
    setOptionReview(null);
    setSelectedOptionIndex(null);
    setExpandedOptionIndex(null);
    setBrief(null);
    setLesson(null);
    setVisuals(null);
    setRehearsal(null);
    outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    return run("options", () => postJson<LessonOptionsResponse>("/api/options", requestPayload), (result) => {
      setLessonOptions(result.options);
      setOptionReview(result.optionReview ?? null);
    });
  };

  const educatorTranscriptEntries = useMemo(
    () =>
      transcript.filter((entry) => {
        const text = entry.text.trim();
        return entry.role === "educator" && text.length > 0 && !text.startsWith("Start a voice lesson planning interview");
      }),
    [transcript]
  );
  const hasEducatorTranscript = educatorTranscriptEntries.length > 0;

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
      setInterviewDraft
    );
  };

  const applyInterviewDraft = () => {
    if (!interviewDraft) return;

    setForm({
      topic: interviewDraft.topic,
      lessonObjectives: interviewDraft.lessonObjectives,
      planningRequirements: interviewDraft.planningRequirements
    });
    clearGeneratedArtifacts();
    setInterviewDraft(null);
    setInterviewApplied(true);
    outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectOption = (index: number) => {
    setSelectedOptionIndex(index);
    setExpandedOptionIndex(index);
    setBrief(null);
    setLesson(null);
    setVisuals(null);
    setRehearsal(null);
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
            setRehearsal(null);
            setFeedback("");
          }
        )
      : undefined;

  const generateLesson = () => {
    setLesson(null);
    outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    return run("lesson", () => postJson<LessonPlan>("/api/lesson", { ...requestPayload, brief }), setLesson);
  };

  const generateVisuals = () => {
    setVisuals(null);
    window.setTimeout(() => visualPackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    return run("visuals", () => postJson<VisualPack>("/api/visuals", { ...requestPayload, brief, lesson }), setVisuals);
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
      setRehearsal
    );

  const generateImage = () =>
    visuals?.imagePrompt
      ? run(
          "image",
          () => postJson<{ b64: string | null; url: string | null }>("/api/image", { prompt: visuals.imagePrompt }),
          (result) => setGeneratedImage(result.b64 ? `data:image/png;base64,${result.b64}` : result.url)
        )
      : undefined;

  const stopRealtime = () => {
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

  const addTranscript = (entry: Omit<TranscriptEntry, "id">) => {
    setTranscript((current) => [
      ...current,
      {
        ...entry,
        id: `${Date.now()}-${current.length}`
      }
    ]);
    window.setTimeout(() => transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight }), 0);
  };

  const upsertTranscript = (id: string, role: TranscriptEntry["role"], text: string, mode: "append" | "replace") => {
    setTranscript((current) => {
      const existingIndex = current.findIndex((entry) => entry.id === id);
      if (existingIndex === -1) {
        return [...current, { id, role, text }];
      }

      const next = [...current];
      const existing = next[existingIndex];
      next[existingIndex] = {
        ...existing,
        role,
        text: mode === "append" ? `${existing.text}${text}` : text
      };
      return next;
    });
    window.setTimeout(() => transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight }), 0);
  };

  const handleRealtimeEvent = (event: MessageEvent<string>) => {
    try {
      const data = JSON.parse(event.data);
      const type = data.type || "";

      if (type === "response.audio_transcript.delta" || type === "response.output_text.delta") {
        setVoiceSignal("speaking");
        const id = data.item_id || data.response_id || "planner-live";
        if (typeof data.delta === "string") {
          upsertTranscript(id, "planner", data.delta, "append");
        }
        return;
      }

      if (type === "response.audio_transcript.done" || type === "response.output_text.done") {
        setVoiceSignal("listening");
        const id = data.item_id || data.response_id || "planner-live";
        if (typeof data.transcript === "string" || typeof data.text === "string") {
          upsertTranscript(id, "planner", data.transcript || data.text, "replace");
        }
        return;
      }

      if (type === "conversation.item.input_audio_transcription.completed") {
        setVoiceSignal("listening");
        const id = data.item_id || `educator-${Date.now()}`;
        if (typeof data.transcript === "string") {
          upsertTranscript(id, "educator", data.transcript, "replace");
        }
        return;
      }

      if (type === "conversation.item.input_audio_transcription.delta") {
        setVoiceSignal("listening");
        const id = data.item_id || "educator-live";
        if (typeof data.delta === "string") {
          upsertTranscript(id, "educator", data.delta, "append");
        }
        return;
      }

      if (type === "conversation.item.created") {
        const role = data.item?.role === "user" ? "educator" : "planner";
        const content = data.item?.content?.find((part: { transcript?: string; text?: string }) => part.transcript || part.text);
        const text = content?.transcript || content?.text;
        const id = data.item?.id || `${role}-${Date.now()}`;
        if (typeof text === "string") {
          upsertTranscript(id, role, text, "replace");
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
    setTranscript([]);
    setInterviewDraft(null);
    setInterviewApplied(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support microphone access here. Use a browser with microphone support, or choose \"Write it out\".");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      channel.addEventListener("message", handleRealtimeEvent);
      channel.addEventListener("open", () => {
        channel.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `Start a voice lesson planning interview for this 90-minute lesson. Topic: ${form.topic}. Lesson objectives: ${form.lessonObjectives}. Planning requirements: ${form.planningRequirements}.`
                }
              ]
            }
          })
        );
        channel.send(JSON.stringify({ type: "response.create" }));
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

  const selectedOption = selectedOptionIndex === null ? null : lessonOptions[selectedOptionIndex] ?? null;
  const hasPlanContext = Boolean(brief || selectedOption || lessonOptions.length > 0);
  const showPlanningShortcuts = hasPlanContext || lesson || rehearsal || visuals || showLessonMemory || reflections.length > 0;
  const showWorkflowRail = Boolean(lesson);
  const hasTypedBrief = Boolean(form.topic.trim() || form.lessonObjectives.trim() || form.planningRequirements.trim());

  return (
    <main className={`app-shell ${showWorkflowRail ? "with-workflow" : "without-workflow"}`}>
      <aside className="app-sidebar">
        <div className="brand-lockup">
          <span className="brand-mark">
            <BookOpen size={22} />
          </span>
          <strong>Lesson Planner Q</strong>
        </div>
        {showWorkflowRail && <WorkflowRail steps={workflowSteps} />}
        <div className="sidebar-footer">
          <span>Educator workspace</span>
          <strong>{reflections.length} saved reflections</strong>
        </div>
      </aside>

      <div className="planner-workspace">
        <div className={`planner-grid ${showPlanningShortcuts ? "with-shortcuts" : "solo"}`}>
          <section className="planner-main">

        {realtimeStatus === "idle" && (
          <section className="brief-composer feature-section" aria-label="Start lesson plan">
            <div className="composer-head">
              <div className="section-title">
                <NotebookPen size={22} />
                <h2>Let&apos;s plan</h2>
              </div>
              <p>Share three things: lesson goal, what students are like, and any must-haves or limits.</p>
            </div>

            <div className="start-stack">
              <section className={`voice-primary-card mic-cta ${voiceSignal.includes("error") ? "has-error" : ""}`} aria-label="Voice planning">
                <button onClick={startRealtime} className="primary voice-start-button" disabled={Boolean(loading)}>
                  <Mic size={18} />
                  Talk it through
                </button>
              </section>

              <details className="typed-brief secondary-brief-card">
                <summary>
                  <FileText size={18} />
                  <span>Write it out</span>
                </summary>

                <div className="typed-fallback-fields">
                  <label>
                    Lesson goal
                    <input
                      value={form.topic}
                      onChange={(event) => update("topic", event.target.value)}
                      placeholder="Example: compassion in daily life"
                    />
                  </label>

                  <label>
                    <Target size={16} />
                    What students should learn
                    <textarea
                      value={form.lessonObjectives}
                      onChange={(event) => update("lessonObjectives", event.target.value)}
                      rows={2}
                      placeholder="What should students understand or be able to do?"
                    />
                  </label>

                  <label>
                    <MessageCircle size={16} />
                    Students, must-haves, and limits
                    <textarea
                      value={form.planningRequirements}
                      onChange={(event) => update("planningRequirements", event.target.value)}
                      rows={3}
                      placeholder="Student needs, activity preferences, materials, timing, or limits."
                    />
                  </label>

                  <div className="typed-actions">
                    <button onClick={generateOptions} disabled={Boolean(loading) || !hasTypedBrief} className="primary">
                      {loading === "options" ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
                      {lessonOptions.length > 0 ? "Regenerate lesson options" : "Generate lesson options"}
                    </button>
                  </div>
                </div>
              </details>
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
          <section className="voice-stage" aria-live="polite">
            <div className="voice-stage-top">
              <span>Planning chat</span>
              <strong>{realtimeStatus === "connecting" ? "Connecting" : "Live"}</strong>
            </div>

            <div className="conversation-shell">
              <div className="voice-stage-center">
                <button onClick={startRealtime} className="stage-mic" aria-label="End voice planning">
                  <Mic size={24} />
                </button>
                <p>{realtimeStatus === "connecting" ? "Connecting to PlannerQ..." : "PlannerQ is listening"}</p>
                <button
                  aria-pressed={plannerMuted}
                  className="quiet-button compact-button mute-output-button"
                  onClick={togglePlannerAudio}
                >
                  {plannerMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  {plannerMuted ? "Unmute PlannerQ" : "Mute PlannerQ"}
                </button>
                <button onClick={stopRealtime} className="end-session">
                  End
                </button>
              </div>

              <aside className="transcript-drawer">
                <div className="transcript-head">
                  <h2>Conversation</h2>
                  {hasEducatorTranscript && (
                    <button onClick={extractInterviewNotes} disabled={Boolean(loading)} className="quiet-button compact-button">
                      {loading === "interview-extract" ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                      Use notes
                    </button>
                  )}
                </div>
                <div className="transcript-log" ref={transcriptRef}>
                  {transcript.length === 0 ? (
                    <p className="conversation-empty">
                      The dialogue will appear here as PlannerQ speaks and your microphone input is transcribed.
                    </p>
                  ) : (
                    transcript.map((entry) => (
                      <article className={entry.role} key={entry.id}>
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
          {realtimeStatus === "idle" && hasEducatorTranscript && !interviewApplied && (
            <section className="inline-draft interview-ready-card">
              <div>
                <span className="section-eyebrow">Voice interview</span>
                <h2>Interview transcript is ready</h2>
                <p>Extract editable planning fields from the transcript, then review them before generating lesson options.</p>
              </div>
              <button onClick={extractInterviewNotes} disabled={Boolean(loading) || !hasEducatorTranscript} className="primary">
                {loading === "interview-extract" ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
                Use interview notes
              </button>
            </section>
          )}

          {interviewDraft && (
            <InterviewExtractionReview
              draft={interviewDraft}
              onUpdate={updateInterviewDraft}
              onApply={applyInterviewDraft}
              onDismiss={() => setInterviewDraft(null)}
            />
          )}

          {loading === "interview-extract" && (
            <LoadingState
              title="Extracting interview notes"
              description="Turning the voice transcript into editable planning fields for educator review."
            />
          )}

          {loading === "options" && (
            <LoadingState
              title="Preparing lesson options"
              description="Creating distinct ways to run the 90-minute lesson so you can compare before choosing."
            />
          )}

          {(loading === "brief" || loading === "brief-update") && (
            <LoadingState
              title={loading === "brief-update" ? "Updating lesson brief" : "Drafting lesson brief"}
              description="Turning the selected approach into a structured brief, clarifying questions, and recommended next steps."
            />
          )}

          {loading === "lesson" && (
            <LoadingState
              title="Drafting 90-minute lesson plan"
              description="Building the teaching anchor, play activity, self-directed scaffold, reflection prompts, and educator review notes."
            />
          )}

          {lessonOptions.length > 0 && (
            <Section
              title="Choose lesson approach"
              eyebrow="Options"
              icon={<FileText size={22} />}
              actions={
                <button onClick={generateOptions} disabled={Boolean(loading)} className="quiet-button">
                  {loading === "options" ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
                  Regenerate
                </button>
              }
            >
              <p className="muted">Compare fit, tradeoffs, visual needs, and rehearsal focus before choosing.</p>
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
                          <dt>Visuals</dt>
                          <dd>{option.visualPackRecommended ? "Recommended" : "Optional"}</dd>
                        </div>
                        <div>
                          <dt>Rehearsal</dt>
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
                        <button onClick={() => selectOption(index)}>
                          {isSelected ? <CheckCircle2 size={18} /> : <FileText size={18} />}
                          {isSelected ? "Selected" : "Select"}
                        </button>
                        {isSelected && (
                          <button onClick={generateBrief} disabled={Boolean(loading)} className="primary">
                            {loading === "brief" ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
                            Draft brief
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
                              {option.visualPackRecommended ? "Visuals recommended" : "Visuals optional"}
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
          )}

          {brief && (
            <Section
              title={brief.title}
              eyebrow="Brief"
              icon={<FileText size={22} />}
              actions={
                <>
                  <button onClick={generateBrief} disabled={Boolean(loading)} className="quiet-button">
                    {loading === "brief" ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
                    Regenerate brief
                  </button>
                  <button onClick={seedReflectionFromCurrentPlan} className="quiet-button">
                    <Save size={18} />
                    Save note
                  </button>
                </>
              }
            >
              <div className="brief-hero">
                <div>
                  <span>Brief summary</span>
                  <p>{brief.briefSummary}</p>
                </div>
                <div>
                  <span>Student takeaway</span>
                  <p>{brief.studentTakeaway}</p>
                </div>
              </div>

              {brief.agentReview && <BriefAgentReviewPanel review={brief.agentReview} />}

              <div className="two-col">
                <div>
                  <h3>Clarifying questions</h3>
                  <List items={brief.clarifyingQuestions} />
                </div>
                <div>
                  <h3>Suggested structure</h3>
                  <List items={brief.suggestedStructure} />
                </div>
              </div>

              <div className="two-col">
                <div>
                  <h3>Key choices</h3>
                  <List items={brief.keyChoices} />
                </div>
                <div>
                  <h3>Recommended next move</h3>
                  <p className="muted">
                    Rehearse the explanation before drafting the full plan, then use feedback to refine the brief.
                  </p>
                </div>
              </div>

              <div className="recommendation-grid">
                <article>
                  <strong>{brief.visualPackRecommended ? "Visual pack recommended" : "Visual pack optional"}</strong>
                  <p>{brief.visualPackRationale}</p>
                  <button onClick={generateVisuals} disabled={Boolean(loading)}>
                    {loading === "visuals" ? <Loader2 className="spin" size={18} /> : <Image size={18} />}
                    Create visual pack
                  </button>
                </article>
                <article>
                  <strong>{brief.rehearsalRecommended ? "Rehearsal recommended" : "Rehearsal optional"}</strong>
                  <p>{brief.rehearsalFocus}</p>
                  <button onClick={generateRehearsal} disabled={Boolean(loading)}>
                    {loading === "rehearsal" ? <Loader2 className="spin" size={18} /> : <Mic size={18} />}
                    Practice with coach
                  </button>
                </article>
              </div>

              <div className="embedded-output" ref={visualPackRef}>
                {loading === "visuals" && (
                  <section className="drafting-state inline-draft" aria-live="polite">
                    <div className="section-title">
                      <Loader2 className="spin" size={20} />
                      <h3>Creating visual pack</h3>
                    </div>
                    <p>Creating story cards, scenario cards, storyboard panels, and worksheet prompts for this brief.</p>
                    <div className="draft-preview" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  </section>
                )}

                {visuals && (
                  <section className="inline-result">
                    <div className="section-title">
                      <Image size={20} />
                      <h3>{visuals.packTitle}</h3>
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

              <label className="feedback-box">
                Refine the brief
                <textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  rows={4}
                  placeholder="Answer clarifying questions, adjust the activity, change the tone, or add notes from rehearsal."
                />
              </label>

              <div className="inline-actions">
                <button onClick={updateBrief} disabled={Boolean(loading) || !feedback.trim()}>
                  {loading === "brief-update" ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
                  Apply refinement
                </button>
                <button onClick={generateLesson} disabled={Boolean(loading)}>
                  {loading === "lesson" ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
                  Draft full lesson plan
                </button>
              </div>
            </Section>
          )}

          {loading === "rehearsal" && (
            <LoadingState
              title="Preparing rehearsal coach"
              description="Creating likely student questions, simpler language, and practice responses for the selected brief."
            />
          )}

          {rehearsal && (
            <Section
              title="Rehearsal coach"
              eyebrow="Rehearse"
              icon={<Mic size={22} />}
              actions={
                <button onClick={generateRehearsal} disabled={Boolean(loading)} className="quiet-button">
                  {loading === "rehearsal" ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
                  Regenerate coach
                </button>
              }
            >
              <div className="brief-hero single">
                <div>
                  <span>Practice scenario</span>
                  <p>{rehearsal.scenario}</p>
                </div>
              </div>
              <div className="two-col">
                <div>
                  <h3>Student questions</h3>
                  <List items={rehearsal.studentQuestions} />
                </div>
                <div>
                  <h3>Simpler language</h3>
                  <List items={rehearsal.simplerLanguage} />
                </div>
              </div>
              <h3>Suggested responses</h3>
              <List items={rehearsal.suggestedResponses} />
              <div className="inline-actions">
                <button onClick={generateLesson} disabled={Boolean(loading)} className="primary">
                  {loading === "lesson" ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
                  Draft full lesson plan
                </button>
                <button onClick={seedReflectionFromCurrentPlan} className="quiet-button">
                  <Save size={18} />
                  Save rehearsal note
                </button>
              </div>
            </Section>
          )}

          {lesson && (
            <Section
              title={lesson.title}
              eyebrow="Full Plan"
              icon={<BookOpen size={22} />}
              actions={
                <>
                  <button onClick={generateLesson} disabled={Boolean(loading)} className="quiet-button">
                    {loading === "lesson" ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
                    Regenerate plan
                  </button>
                  <button onClick={seedReflectionFromCurrentPlan} className="primary">
                    <Save size={18} />
                    Save for reflection
                  </button>
                </>
              }
            >
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

              {lesson.agentReview && <LessonAgentReviewPanel review={lesson.agentReview} />}

              <div className="two-col">
                <div>
                  <h3>Learning objectives</h3>
                  <List items={lesson.learningObjectives} />
                </div>
                <div>
                  <h3>Teaching anchor</h3>
                  <p>{lesson.teachingAnchor}</p>
                </div>
              </div>

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

              <div className="two-col">
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
              </div>

              <div className="two-col">
                <div>
                  <h3>Reflection</h3>
                  <List items={lesson.reflection} />
                </div>
                <div>
                  <h3>Educator review</h3>
                  <List items={lesson.reviewNotes} />
                </div>
              </div>
            </Section>
          )}

          {realtimeStatus === "idle" && (lesson || showLessonMemory || reflections.length > 0) && (
            <Section
              title="Log lesson reflections"
              eyebrow="Reflection"
              icon={<NotebookPen size={22} />}
              actions={<span className="saved-count">{reflections.length} saved</span>}
            >
              <p className="muted">
                Save what happened after class. Recent reflections are included in future planning context.
              </p>

              <div className="inline-actions">
                <button className="primary" onClick={() => setShowLessonMemory((current) => !current)}>
                  <NotebookPen size={18} />
                  {showLessonMemory ? "Hide reflection form" : "Log reflection"}
                </button>
                {(brief || lesson) && (
                  <button className="quiet-button" onClick={seedReflectionFromCurrentPlan}>
                    <Save size={18} />
                    Use current plan
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
                    Lesson plan used
                    <textarea
                      value={reflectionDraft.lessonPlan}
                      onChange={(event) => updateReflectionDraft("lessonPlan", event.target.value)}
                      rows={3}
                      placeholder="Name the plan, activity flow, or teaching approach that was actually used."
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
                      What did not work
                      <textarea
                        value={reflectionDraft.didNotWork}
                        onChange={(event) => updateReflectionDraft("didNotWork", event.target.value)}
                        rows={4}
                        placeholder="Example: The story introduction was too long and students got restless."
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
                        placeholder="What did students understand, resist, enjoy, or ask about?"
                      />
                    </label>
                    <label>
                      <Wand2 size={16} />
                      Next time
                      <textarea
                        value={reflectionDraft.nextTime}
                        onChange={(event) => updateReflectionDraft("nextTime", event.target.value)}
                        rows={4}
                        placeholder="What should the next lesson repeat, avoid, deepen, or follow up on?"
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
          )}

        </div>
          </section>

          {showPlanningShortcuts && (
            <aside className="context-panel" aria-label="Planning shortcuts">
              <section className="context-card">
                <div className="context-card-head">
                  <div className="section-title compact">
                    <NotebookPen size={20} />
                    <h2>Lesson memory</h2>
                  </div>
                  <span>{reflections.length}</span>
                </div>
                <p>Recent reflections become classroom evidence for the next plan.</p>
                <button className="context-action" onClick={() => setShowLessonMemory((current) => !current)}>
                  <Save size={18} />
                  {showLessonMemory ? "Hide memory form" : "Log reflection"}
                </button>
              </section>

              <section className="context-card">
                <div className="context-card-head">
                  <div className="section-title compact">
                    <Mic size={20} />
                    <h2>Rehearse</h2>
                  </div>
                  <span>{rehearsal ? "Ready" : "Next"}</span>
                </div>
                <p>Practice likely student questions before turning the brief into a full plan.</p>
                <button className="context-action" onClick={generateRehearsal} disabled={Boolean(loading) || !hasPlanContext}>
                  {loading === "rehearsal" ? <Loader2 className="spin" size={18} /> : <MessageCircle size={18} />}
                  Start rehearsal
                </button>
              </section>

              <section className="context-card">
                <div className="context-card-head">
                  <div className="section-title compact">
                    <CheckCircle2 size={20} />
                    <h2>Next actions</h2>
                  </div>
                </div>
                <div className="next-action-list">
                  <button onClick={generateBrief} disabled={Boolean(loading) || selectedOptionIndex === null}>
                    <FileText size={18} />
                    <span>
                      <strong>Draft brief</strong>
                      <small>{brief ? "Refresh the current brief" : "Use the selected option"}</small>
                    </span>
                  </button>
                  <button onClick={generateLesson} disabled={Boolean(loading) || !brief}>
                    <BookOpen size={18} />
                    <span>
                      <strong>Draft full plan</strong>
                      <small>Create the 90-minute lesson</small>
                    </span>
                  </button>
                  <button onClick={generateVisuals} disabled={Boolean(loading) || !brief}>
                    <Image size={18} />
                    <span>
                      <strong>Create visuals</strong>
                      <small>Cards, prompts, and image direction</small>
                    </span>
                  </button>
                </div>
              </section>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
