import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ClipboardList,
  Image,
  Loader2,
  Mic,
  PlayCircle,
  Sparkles,
  Wand2
} from "lucide-react";
import type { LessonPlan, Rehearsal, VisualPack } from "./types";

type FormState = {
  topic: string;
  duration: string;
  classSize: string;
  studentAge: string;
  teachingStyle: string;
  outcome: string;
  classContext: string;
  voiceNotes: string;
};

const initialForm: FormState = {
  topic: "Compassion in daily life",
  duration: "90 minutes",
  classSize: "4",
  studentAge: "13",
  teachingStyle: "Play-based learning and scaffolded self-directed learning",
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

export default function App() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [visuals, setVisuals] = useState<VisualPack | null>(null);
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"idle" | "connecting" | "live">("idle");
  const realtimePeer = useRef<RTCPeerConnection | null>(null);
  const realtimeStream = useRef<MediaStream | null>(null);
  const realtimeAudio = useRef<HTMLAudioElement | null>(null);

  const requestPayload = useMemo(
    () => ({
      ...form,
      tradition: "Chinese Mahayana folk Buddhism",
      requiredScaffold: "Gradual release of responsibility: I do, We do, You do",
      safety: "Educator-facing draft. No unsupervised student-agent interaction."
    }),
    [form]
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

  const generateLesson = () =>
    run("lesson", () => postJson<LessonPlan>("/api/lesson", requestPayload), setLesson);

  const generateVisuals = () =>
    run("visuals", () => postJson<VisualPack>("/api/visuals", { ...requestPayload, lesson }), setVisuals);

  const generateRehearsal = () =>
    run(
      "rehearsal",
      () =>
        postJson<Rehearsal>("/api/rehearsal", {
          ...requestPayload,
          rehearsalPrompt: `Pretend you are a skeptical ${form.studentAge}-year-old. Ask hard questions about ${form.topic}.`
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

  const startRealtime = async () => {
    if (realtimeStatus === "live") {
      stopRealtime();
      return;
    }

    setRealtimeStatus("connecting");
    setError(null);
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
    } catch (err) {
      stopRealtime();
      setError(err instanceof Error ? err.message : "Could not start realtime voice session");
    }
  };

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Lesson Planner Q</p>
          <h1>Weekly Buddhist lesson preparation studio</h1>
          <p className="lede">
            Generate structured lesson plans, rehearse tricky explanations, and prepare printable visual materials for a
            small class of 13-year-old students.
          </p>
        </div>
        <div className="status-pill">
          <Sparkles size={18} />
          Educator-facing MVP
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar" aria-label="Lesson setup">
          <div className="sidebar-head">
            <ClipboardList size={20} />
            <h2>Lesson Setup</h2>
          </div>

          <label>
            Topic
            <input value={form.topic} onChange={(event) => update("topic", event.target.value)} />
          </label>

          <div className="field-grid">
            <label>
              Age
              <input value={form.studentAge} onChange={(event) => update("studentAge", event.target.value)} />
            </label>
            <label>
              Class size
              <input value={form.classSize} onChange={(event) => update("classSize", event.target.value)} />
            </label>
          </div>

          <label>
            Duration
            <input value={form.duration} onChange={(event) => update("duration", event.target.value)} />
          </label>

          <label>
            Teaching style
            <input value={form.teachingStyle} onChange={(event) => update("teachingStyle", event.target.value)} />
          </label>

          <label>
            Desired outcome
            <textarea value={form.outcome} onChange={(event) => update("outcome", event.target.value)} rows={4} />
          </label>

          <label>
            Class context
            <textarea
              value={form.classContext}
              onChange={(event) => update("classContext", event.target.value)}
              rows={4}
            />
          </label>

          <label>
            Voice planning notes
            <textarea value={form.voiceNotes} onChange={(event) => update("voiceNotes", event.target.value)} rows={4} />
          </label>

          <div className="action-stack">
            <button onClick={startRealtime} disabled={realtimeStatus === "connecting"}>
              {realtimeStatus === "connecting" ? <Loader2 className="spin" size={18} /> : <Mic size={18} />}
              {realtimeStatus === "live" ? "Stop voice coach" : "Start voice coach"}
            </button>
            <button onClick={generateLesson} disabled={Boolean(loading)} className="primary">
              {loading === "lesson" ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
              Generate lesson
            </button>
            <button onClick={generateRehearsal} disabled={Boolean(loading)}>
              {loading === "rehearsal" ? <Loader2 className="spin" size={18} /> : <Mic size={18} />}
              Rehearsal coach
            </button>
            <button onClick={generateVisuals} disabled={Boolean(loading)}>
              {loading === "visuals" ? <Loader2 className="spin" size={18} /> : <Image size={18} />}
              Visual pack
            </button>
          </div>
        </aside>

        <div className="content">
          {error && <div className="error">{error}</div>}

          {!lesson && !visuals && !rehearsal && (
            <section className="empty-state">
              <BookOpen size={32} />
              <h2>Start with a weekly topic</h2>
              <p>
                The first flow creates a classroom-ready draft with a teaching anchor, play activity, self-directed
                scaffold, educator notes, and review reminders.
              </p>
            </section>
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

          {visuals && (
            <Section title={visuals.packTitle} icon={<Image size={22} />}>
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
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}
