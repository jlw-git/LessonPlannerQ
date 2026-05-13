import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  CheckCircle2,
  FileText,
  Image,
  Loader2,
  MessageCircle,
  Mic,
  PlayCircle,
  Target,
  Wand2
} from "lucide-react";
import type { LessonBrief, LessonOption, LessonOptionsResponse, LessonPlan, Rehearsal, VisualPack } from "./types";

type FormState = {
  topic: string;
  outcome: string;
  classContext: string;
  voiceNotes: string;
};

type TranscriptEntry = {
  id: string;
  role: "educator" | "planner";
  text: string;
};

const initialForm: FormState = {
  topic: "Compassion in daily life",
  outcome: "Students can notice suffering in everyday situations and choose one compassionate response.",
  classContext: "Students are energetic and enjoy role-play, but they can struggle to connect teachings to school life.",
  voiceNotes: "Next week I want to teach compassion, but my students are restless and I want an activity."
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data as T;
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

function Section({
  title,
  icon,
  children
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="section-title">
        {icon}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function describeRealtimeError(err: unknown) {
  if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError")) {
    return "Microphone permission was denied. Allow microphone access for this browser or use \"Type brief instead\".";
  }

  if (err instanceof DOMException && err.name === "NotFoundError") {
    return "No microphone was found. Connect or enable a microphone, or use \"Type brief instead\".";
  }

  if (err instanceof Error && /permission denied|notallowed/i.test(err.message)) {
    return "Microphone permission was denied. Allow microphone access for this browser or use \"Type brief instead\".";
  }

  return err instanceof Error ? err.message : "Could not start realtime voice session";
}

export default function App() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [brief, setBrief] = useState<LessonBrief | null>(null);
  const [lessonOptions, setLessonOptions] = useState<LessonOption[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [expandedOptionIndex, setExpandedOptionIndex] = useState<number | null>(null);
  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [visuals, setVisuals] = useState<VisualPack | null>(null);
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTypedBrief, setShowTypedBrief] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<"idle" | "connecting" | "live">("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const realtimePeer = useRef<RTCPeerConnection | null>(null);
  const realtimeStream = useRef<MediaStream | null>(null);
  const realtimeAudio = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const visualPackRef = useRef<HTMLDivElement | null>(null);

  const requestPayload = useMemo(
    () => ({
      ...form,
      tradition: "Chinese Mahayana folk Buddhism",
      studentAge: "13",
      classSize: "4",
      duration: "90 minutes",
      teachingStyle: "Play-based learning and scaffolded self-directed learning",
      requiredScaffold: "Gradual release of responsibility: I do, We do, You do",
      selectedOption: selectedOptionIndex === null ? null : lessonOptions[selectedOptionIndex],
      safety: "Educator-facing draft. No unsupervised student-agent interaction."
    }),
    [form, lessonOptions, selectedOptionIndex]
  );

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
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
    setSelectedOptionIndex(null);
    setExpandedOptionIndex(null);
    setBrief(null);
    setLesson(null);
    setVisuals(null);
    setRehearsal(null);
    outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    return run("options", () => postJson<LessonOptionsResponse>("/api/options", requestPayload), (result) => {
      setLessonOptions(result.options);
    });
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
        const id = data.item_id || data.response_id || "planner-live";
        if (typeof data.delta === "string") {
          upsertTranscript(id, "planner", data.delta, "append");
        }
        return;
      }

      if (type === "response.audio_transcript.done" || type === "response.output_text.done") {
        const id = data.item_id || data.response_id || "planner-live";
        if (typeof data.transcript === "string" || typeof data.text === "string") {
          upsertTranscript(id, "planner", data.transcript || data.text, "replace");
        }
        return;
      }

      if (type === "conversation.item.input_audio_transcription.completed") {
        const id = data.item_id || `educator-${Date.now()}`;
        if (typeof data.transcript === "string") {
          upsertTranscript(id, "educator", data.transcript, "replace");
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
    setError(null);
    setTranscript([]);
    addTranscript({
      role: "planner",
      text: "Starting voice interview. Allow microphone access if your browser asks."
    });
    try {
      const tokenResponse = await fetch("/api/realtime/client-secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: requestPayload })
      });
      const tokenData = await tokenResponse.json();
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
      realtimeAudio.current = audio;
      peer.ontrack = (event) => {
        audio.srcObject = event.streams[0];
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      realtimeStream.current = stream;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      const channel = peer.createDataChannel("oai-events");
      channel.addEventListener("message", handleRealtimeEvent);
      channel.addEventListener("open", () => {
        addTranscript({
          role: "planner",
          text: "Connected. The planner will ask clarifying questions one at a time."
        });
        channel.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `Start a voice lesson planning interview for this 90-minute lesson. The educator notes are: ${form.voiceNotes}`
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
      addTranscript({
        role: "planner",
        text: "Voice interview is live. Speak naturally; the transcript will appear here when text events are available."
      });
    } catch (err) {
      stopRealtime();
      setError(describeRealtimeError(err));
    }
  };

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Lesson Planner Q</p>
          <h1>Weekly Lesson Planner</h1>
          <p className="lede">
            Generate structured lesson plans, rehearse tricky explanations, and prepare printable visual materials for a
            small class of 13-year-old students.
          </p>
        </div>
      </header>

      <div className="workspace">
        {realtimeStatus === "idle" && (
        <section className="brief-composer" aria-label="Lesson input">
          <section className="voice-first">
            <span className="voice-orb">
              <Mic size={26} />
            </span>
            <div>
              <h2>Start by voice</h2>
              <p>Talk through the lesson idea, class context, and what you want students to take away.</p>
            </div>
            <button onClick={startRealtime} className="voice-primary">
              <Mic size={18} />
              Start voice interview
            </button>
          </section>

          <button className="typed-toggle compact-toggle" onClick={() => setShowTypedBrief((current) => !current)}>
            <span>Type brief instead</span>
            <ChevronDown className={showTypedBrief ? "rotate" : ""} size={18} />
          </button>

          {showTypedBrief && (
            <div className="typed-brief">
              <label>
                Topic
                <input value={form.topic} onChange={(event) => update("topic", event.target.value)} />
              </label>

              <label>
                <Target size={16} />
                Desired outcome
                <textarea value={form.outcome} onChange={(event) => update("outcome", event.target.value)} rows={4} />
              </label>

              <label>
                <MessageCircle size={16} />
                Class context
                <textarea
                  value={form.classContext}
                  onChange={(event) => update("classContext", event.target.value)}
                  rows={4}
                />
              </label>

              <label>
                <Mic size={16} />
                Voice planning notes
                <textarea
                  value={form.voiceNotes}
                  onChange={(event) => update("voiceNotes", event.target.value)}
                  rows={4}
                />
              </label>

              <div className="typed-actions">
                <button onClick={generateOptions} disabled={Boolean(loading)}>
                  {loading === "options" ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
                  Review lesson options
                </button>
              </div>
            </div>
          )}
        </section>
        )}

        {realtimeStatus !== "idle" && (
          <section className="voice-stage" aria-live="polite">
            <div className="voice-stage-top">
              <span>Voice interview</span>
              <strong>{realtimeStatus === "connecting" ? "Connecting" : "Live"}</strong>
            </div>
            <div className="voice-stage-center">
              <button onClick={startRealtime} className="stage-mic" aria-label="Stop voice interview">
                <Mic size={42} />
              </button>
              <p>{realtimeStatus === "connecting" ? "Connecting to the lesson planner..." : "Planner is listening"}</p>
              <button onClick={stopRealtime} className="end-session">
                End session
              </button>
            </div>
            <aside className="transcript-drawer">
              <h2>Transcript</h2>
              <div className="transcript-log" ref={transcriptRef}>
                {transcript.map((entry) => (
                  <article className={entry.role} key={entry.id}>
                    <strong>{entry.role === "educator" ? "You" : "PlannerQ"}</strong>
                    <p>{entry.text}</p>
                  </article>
                ))}
              </div>
            </aside>
          </section>
        )}

        <div className="content" ref={outputRef}>
          {error && <div className="error">{error}</div>}

          {loading === "options" && (
            <section className="panel drafting-state" aria-live="polite">
              <div className="section-title">
                <Loader2 className="spin" size={22} />
                <h2>Generating lesson options</h2>
              </div>
              <p>Creating distinct ways to run the 90-minute lesson so you can compare before choosing.</p>
              <div className="draft-preview" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </section>
          )}

          {(loading === "brief" || loading === "brief-update") && (
            <section className="panel drafting-state" aria-live="polite">
              <div className="section-title">
                <Loader2 className="spin" size={22} />
                <h2>{loading === "brief-update" ? "Updating the lesson brief" : "Generating the lesson brief"}</h2>
              </div>
              <p>
                Turning the voice interview into a structured brief, clarifying questions, and recommended next steps.
              </p>
              <div className="draft-preview" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </section>
          )}

          {loading === "lesson" && (
            <section className="panel drafting-state" aria-live="polite">
              <div className="section-title">
                <Loader2 className="spin" size={22} />
                <h2>Drafting the 90-minute lesson plan</h2>
              </div>
              <p>
                Building the teaching anchor, play activity, self-directed scaffold, reflection prompts, and educator
                review notes.
              </p>
              <div className="draft-preview" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </section>
          )}

          {lessonOptions.length > 0 && (
            <Section title="Choose a lesson approach" icon={<FileText size={22} />}>
              <p className="muted">Scan the options, select one, then review the details before generating the brief.</p>
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
                        <button
                          aria-expanded={isExpanded}
                          className="quiet-button"
                          onClick={() => setExpandedOptionIndex(isExpanded ? null : index)}
                        >
                          <ChevronDown className={isExpanded ? "rotate" : ""} size={18} />
                          {isExpanded ? "Hide plan" : "Read plan"}
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
                          {isSelected && (
                            <button onClick={generateBrief} disabled={Boolean(loading)}>
                              {loading === "brief" ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
                              Generate brief from selected option
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </Section>
          )}

          {brief && (
            <Section title={brief.title} icon={<FileText size={22} />}>
              <div className="next-steps" aria-label="Lesson planning next steps">
                <h3>Next steps</h3>
                <ol>
                  <li className="done">
                    <CheckCircle2 size={16} />
                    <span>
                      <strong>Brief created</strong>
                      <small>Review the draft and answer clarifying questions.</small>
                    </span>
                  </li>
                  <li className={visuals ? "done" : "active"}>
                    <span className="step-number">2</span>
                    <span>
                      <strong>{brief.visualPackRecommended ? "Generate visual pack" : "Visual pack is optional"}</strong>
                      <small>Appears below this brief when generated.</small>
                    </span>
                  </li>
                  <li className={rehearsal ? "done" : ""}>
                    <span className="step-number">3</span>
                    <span>
                      <strong>Practise with rehearsal coach</strong>
                      <small>Use feedback from practice to update the brief.</small>
                    </span>
                  </li>
                  <li className={lesson ? "done" : ""}>
                    <span className="step-number">4</span>
                    <span>
                      <strong>Generate full lesson plan</strong>
                      <small>Use the revised brief as the source of truth.</small>
                    </span>
                  </li>
                </ol>
              </div>

              <p>{brief.briefSummary}</p>
              <div className="two-col">
                <div>
                  <h3>Student Takeaway</h3>
                  <p>{brief.studentTakeaway}</p>
                </div>
                <div>
                  <h3>Clarifying Questions</h3>
                  <List items={brief.clarifyingQuestions} />
                </div>
              </div>

              <div className="two-col">
                <div>
                  <h3>Key Choices</h3>
                  <List items={brief.keyChoices} />
                </div>
                <div>
                  <h3>Suggested Structure</h3>
                  <List items={brief.suggestedStructure} />
                </div>
              </div>

              <div className="recommendation-grid">
                <article>
                  <strong>{brief.visualPackRecommended ? "Visual pack recommended" : "Visual pack optional"}</strong>
                  <p>{brief.visualPackRationale}</p>
                  <button onClick={generateVisuals} disabled={Boolean(loading)}>
                    {loading === "visuals" ? <Loader2 className="spin" size={18} /> : <Image size={18} />}
                    Generate visual pack
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
                      <h3>Generating visual pack</h3>
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
                        Generate image
                      </button>
                    </div>
                    {generatedImage && (
                      <div className="generated-image">
                        <img src={generatedImage} alt="Generated lesson visual" />
                      </div>
                    )}
                    <div className="two-col">
                      <div>
                        <h3>Scenario Cards</h3>
                        <List items={visuals.scenarioCards} />
                      </div>
                      <div>
                        <h3>Value Cards</h3>
                        <List items={visuals.valueCards} />
                      </div>
                    </div>
                    <h3>Storyboard Panels</h3>
                    <div className="cards-grid">
                      {visuals.storyboardPanels.map((panel, index) => (
                        <article key={`${panel.panel}-${index}`}>
                          <strong>{panel.panel}</strong>
                          <p>{panel.caption}</p>
                          <span>{panel.studentPrompt}</span>
                        </article>
                      ))}
                    </div>
                    <h3>Worksheet Prompts</h3>
                    <List items={visuals.worksheetPrompts} />
                  </section>
                )}
              </div>

              <label className="feedback-box">
                Educator feedback and changes
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
                  Update brief
                </button>
                <button onClick={generateLesson} disabled={Boolean(loading)}>
                  {loading === "lesson" ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
                  Generate full lesson plan
                </button>
              </div>
            </Section>
          )}

          {lesson && (
            <Section title={lesson.title} icon={<BookOpen size={22} />}>
              <p className="muted">{lesson.traditionNote}</p>
              <p>{lesson.summary}</p>

              <div className="two-col">
                <div>
                  <h3>Learning Objectives</h3>
                  <List items={lesson.learningObjectives} />
                </div>
                <div>
                  <h3>Teaching Anchor</h3>
                  <p>{lesson.teachingAnchor}</p>
                </div>
              </div>

              <h3>Lesson Flow</h3>
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
                  <h3>Self-Directed Scaffold</h3>
                  <p>
                    <strong>{lesson.selfDirectedLearning.framework}</strong>
                  </p>
                  <p>{lesson.selfDirectedLearning.iDo}</p>
                  <p>{lesson.selfDirectedLearning.weDo}</p>
                  <p>{lesson.selfDirectedLearning.youDo}</p>
                </div>
              </div>

              <div className="two-col">
                <div>
                  <h3>Reflection</h3>
                  <List items={lesson.reflection} />
                </div>
                <div>
                  <h3>Educator Review</h3>
                  <List items={lesson.reviewNotes} />
                </div>
              </div>
            </Section>
          )}

          {rehearsal && (
            <Section title="Rehearsal Coach" icon={<Mic size={22} />}>
              <p>{rehearsal.scenario}</p>
              <div className="two-col">
                <div>
                  <h3>Student Questions</h3>
                  <List items={rehearsal.studentQuestions} />
                </div>
                <div>
                  <h3>Simpler Language</h3>
                  <List items={rehearsal.simplerLanguage} />
                </div>
              </div>
              <h3>Suggested Responses</h3>
              <List items={rehearsal.suggestedResponses} />
            </Section>
          )}

        </div>
      </div>
    </main>
  );
}
