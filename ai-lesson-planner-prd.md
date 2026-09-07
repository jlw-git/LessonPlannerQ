# Product Requirements Document: Lesson Planner Q

Last updated: September 7, 2026

## 1. Product Decision And Value Proposition

Lesson Planner Q helps a volunteer educator turn a rough teaching idea into a lesson they can confidently lead: a reviewed 90-minute draft for a small Chinese Mahayana folk Buddhist class, with practical activities, words to try, and classroom observations to inform next week.

The product's unit of value is **a lesson the educator has reviewed and can facilitate**, not the number of generated artifacts. A faster draft is useful only if the educator spends less total effort adapting it and still trusts its classroom and tradition fit. Preparation-time savings and increased confidence are hypotheses to validate, not established product claims.

The initial focus is individual educators teaching approximately four students around age 13 in a weekly 90-minute class. These are defaults, not a reason to ignore an educator's stated class needs. Coordinators may help recruit and review pilot lessons; coordinator administration and expansion to other subjects are outside the current scope.

### The Job To Be Done

“When I am preparing next week's class with a rough topic and limited time, help me choose an approach, work out how to lead it, and prepare for difficult questions, so I can teach a meaningful lesson without inventing every activity and explanation from scratch.”

### What Makes This Worth Choosing

The differentiation hypothesis is a connected preparation workflow for a specific teaching context:

| Customer difficulty | Product response | Evidence needed to justify the value |
| --- | --- | --- |
| A plausible activity still needs substantial adaptation for this class and tradition. | Three comparable approaches, clear tradeoffs, a reviewed outline, and a timed plan that connects Chinese Mahayana folk Buddhist teaching to students' daily lives. | Educators need fewer major revisions and prefer its classroom fit in a matched comparison with their usual planning method. |
| A written plan does not resolve uncertainty about what to say or do. | Concrete educator moves, scaffolded student tasks, likely questions, simpler wording, and feedback on a typed practice attempt. | Educators can explain how to run an activity and answer a difficult question; confidence improves after preparation. |
| Useful observations from last week are easy to lose. | Editable after-class reflections and recent classroom evidence included in future planning. | A subsequent plan makes a relevant adaptation that the educator recognizes and chooses to use. |

Voice reduces the friction of starting; it is an input advantage rather than the whole value proposition. Visual materials are useful when they serve the objective. More images, more model calls, or more time in the app are not success measures. These are product hypotheses, not claims about competitors' capabilities.

## 2. Customer Problem And Context

The educator may be a volunteer or part-time teacher without formal curriculum training. They need to bring together stories, temple practice, community customs, and Buddhist teachings, then make them concrete for young teenagers. Available sources and local practice vary, so the educator remains responsible for checking the chosen teaching anchor against their temple's context.

The recurring preparation burden has three parts:

1. Decide what students should understand or practise and choose a feasible lesson approach.
2. Turn that approach into instructions, activities, materials, discussion, and explanations that work with four students.
3. Remember what actually happened and adapt the next lesson accordingly.

Student benefit is a downstream outcome: students have space to ask questions and practise applying teachings to friendship, anger, family expectations, school stress, compassion, gratitude, and social media. The app serves the educator; students do not interact with an unsupervised AI tutor.

## 3. Prioritized Outcomes And Scope

| Priority | Outcome | Required capability | Scope decision |
| --- | --- | --- | --- |
| P0 | Move from a rough idea to an intentional lesson direction. | Voice-first or typed input, reviewed voice requirements, three distinct options, educator selection, editable outline through feedback. | The primary weekly planning path. |
| P0 | Leave with a reviewed draft the educator can facilitate. | Timed plan, clear educator/student actions, appropriate scaffolding, visible pedagogy and tradition review, browser print/PDF. | Must work without generating an image or using practice. |
| P0 | Understand and retain control over the draft. | Explicit input approval after voice, draft labeling, clear review notes, honest capability and storage copy, recoverable errors. | Applies to the entire experience. |
| P1 | Prepare for a difficult classroom moment. | Optional likely questions, simpler wording, constructive critique of a typed attempt. | Contextual preparation support; never a mandatory gate before the plan. |
| P1 | Improve next week's preparation using classroom evidence. | Save, inspect, edit, and delete reflections; reuse relevant recent observations; inspect synthesis. | Local browser storage for this prototype. |
| P1 | Prepare materials an activity actually needs. | Optional printable visual pack guidance and requested image rendering. | Secondary to a usable lesson plan; all material remains a draft for review. |

P0 means a release-blocking requirement for a trustworthy planning pilot. P1 means supporting value to test without delaying or obscuring the main planning path. Existing P1 features should be preserved while pilot evidence determines further investment.

### Explicit Non-Goals

- Unsupervised student interaction, assessment, or grading.
- Doctrinal certification or replacement of educator/temple judgment.
- Covering all Buddhist traditions or expanding to other subjects before proving this weekly use case.
- Multi-year curriculum generation, organizational administration, or shared lesson libraries.
- Live classroom assistance, voice rehearsal, and voice reflection debriefs in the current release.
- Mandatory images, mandatory rehearsal, or a dashboard of activity metrics as the entry experience.
- Accounts, cross-device sync, or a claim that local drafts are saved in a cloud library.

## 4. Current Capability Baseline

This is the implementation baseline for product planning, not proof that all acceptance criteria below have passed. `PROJECT.md` remains the detailed implementation reference.

| Area | Current behavior | Remaining boundary or deferred work |
| --- | --- | --- |
| Planning input | Realtime voice planning with live captions and a retained local transcript; extraction into editable topic, objectives, and planning requirements; explicit educator approval. Typed input is available. | Voice gathers requirements; it does not generate lesson artifacts in the conversation. |
| Class context | Defaults to age 13, four students, and 90 minutes. Educators can describe timing, student needs, and constraints in planning requirements. | Dedicated class-profile configuration and reliable validation of varied durations need further work. |
| Direction and outline | Three lesson options; educator selection; an outline generated and revised from feedback. | “Lesson outline” is the educator-facing term; `LessonBrief` and `/api/brief` remain internal names. |
| Quality review | Options, initial/updated outlines, and full plans receive structured review and at most one revision before display; review notes remain visible. | Model review does not establish source authority or certify accuracy. |
| Lesson output | Structured full lesson draft with browser print/save-as-PDF. | Direct full-plan text editing, editable document export, and a persistent lesson library are not implemented. Refine the outline and regenerate the plan for changes. |
| Practice | Generated likely questions and coaching; critique of a typed educator attempt. | Interactive voice rehearsal is deferred. |
| Materials | Visual pack text, story/scenario/value cards, storyboard and worksheet prompts, one requested generated image; browser print/PDF. | This is not a curated catalog or an automatic production-ready illustrated workbook. |
| Classroom evidence | Local reflection create/edit/delete; up to 20 reflections, with five recent reflections used in planning; inspectable model synthesis of raw reflections. | No cross-device sync; fully editable synthesized memory is deferred. |
| Sources and measurement | Local internal reference notes, deterministic API evals, and local browser planning events. | No vetted source retrieval/citation library, centralized analytics, or measured customer outcome evidence. |

## 5. Core Experience

1. **Talk about it.** The first screen invites a topic, student takeaway, student needs, timing, and constraints. “Type it out” remains easy to find. The default class context is visible without requiring a setup form.
2. **Check the requirements.** After talking, the educator can inspect the transcript, edit the captured requirements, and explicitly approve them. The conversation cannot choose an approach or draft materials on the educator's behalf.
3. **Choose an approach.** Compare three distinct options by classroom fit and tradeoff. Read more only as needed, select one, and continue to the outline.
4. **Shape the outline.** Review the student takeaway, structure, choices, open questions, and quality notes. Give feedback if needed, then generate the full plan. Practice and materials are optional when useful.
5. **Prepare to teach.** Inspect the timed lesson and educator moves, review tradition and pedagogy notes, then print or save as PDF. Use optional practice or materials to resolve a specific preparation need.
6. **Remember what happened.** After class, save a short reflection and use relevant observations in future planning. Starting another draft must not delete saved reflections.

The typed path joins the same option-and-outline workflow. No educator should have to grant microphone access, generate an image, or rehearse to obtain a plan.

## 6. Functional Requirements And Acceptance Criteria

The criteria below are target requirements for implementation and pilot verification. An existing route alone does not demonstrate that a criterion is met.

### P0-1: Capture The Educator's Intent

- Voice is the primary entry action; typing is a visible alternative. Topic, intended takeaway, student needs, timing, and constraints are invited in plain language.
- Optional everyday-topic starters populate editable requirements without making a generation request. They must not overwrite an educator's existing input.
- During voice planning, readable captions identify only “PlannerQ” and “You.” Partial transcripts must not leave duplicate final messages. The educator can clearly end the session.
- After voice planning, extracted requirements are editable and show unresolved questions or uncertainty. No option or outline generation uses unapproved extracted requirements.
- An educator can correct a misheard topic and verify the corrected topic before continuing. The retained transcript is inspectable and copyable as source notes, not treated as an approved plan.
- Denied microphone permission or a failed connection offers an actionable explanation and an accessible typed path without discarding existing input.

### P0-2: Make A Meaningful Choice

- Generate exactly three options with visibly different activity structures, not title-only variations.
- Every option includes its approach, best fit, lesson shape, sample activities, a concrete tradeoff, material recommendation, and practice focus.
- A first comparison view exposes the decision-making information; longer details can expand without changing selection.
- Selection is explicit and visually clear, and the next action names the outline being created. Generating a new set of options clears an obsolete selection and downstream artifacts.
- Run bounded pedagogy/tradition review and one revision when requested; display `optionReview` so the educator can assess unresolved issues.

### P0-3: Refine Before Expanding

- Generate an outline from the approved/typed context and chosen approach. Include a student takeaway, key choices, suggested structure, open questions, review prompts, material recommendation, and practice focus.
- Educator feedback revises the outline and shows what changed. Both initial generation and updates retain visible `agentReview`.
- Label the outline as a draft. Let the educator continue to a full lesson without mandatory rehearsal or image generation.
- When the outline changes, later artifacts must be regenerated or clearly identified as based on an earlier version. A printable plan must not silently contradict the outline the educator just reviewed.

### P0-4: Deliver A Lesson Draft The Educator Can Facilitate

- A lesson includes objectives, a contextualized teaching anchor, timed flow, educator moves, student actions, play-based activity instructions/materials/debrief, scaffolded self-directed learning, reflection, everyday application, an optional take-home activity, and educator/review notes.
- Required segments fit the requested duration, default 90 minutes; optional extensions are marked separately. An educator can explain what to do, what students do, and what materials to prepare for each core activity.
- Student tasks work with the stated class size and needs. For the default four students, participation must not depend on large teams or extensive equipment the educator did not request.
- Self-directed work includes a model (“I do”), guided practice (“We do”), a bounded independent/pair task (“You do”), choices, a checkpoint, and a debrief. Play and visual content must advance the objective.
- Full-plan generation applies bounded review and one revision when requested and shows `agentReview`. Remaining educator judgment calls are easy to locate.
- The reviewed plan can be printed or saved through the browser PDF dialog with readable flow and without workspace controls. Describe this as browser printing, not editable document export or automatic cloud saving.

### P0-5: Preserve Cultural Context And Educator Authority

- Outputs default to Chinese Mahayana folk Buddhist context and acknowledge variation where relevant; do not collapse traditions into generic Buddhism.
- Do not invent scripture quotations, source citations, temple approval, or claims of authoritative religious validation. Local reference notes are internal guidance, not a vetted source library.
- Repair requests for generic framing, unsupported karma/merit certainty, fear-based moralizing, or unscaffolded self-directed tasks through the review process rather than treating them as preferences to obey.
- Distinguish practical classroom examples from doctrinal claims. Flag teaching anchors, rituals, and sacred imagery requiring educator/temple review.
- All generated artifacts are drafts for educator review. Review notes must remain visible in the option, outline, and full-plan flows; the app must not imply that model review makes classroom review unnecessary.
- Keep every AI interaction educator-facing. Do not introduce direct unsupervised student use.

### P1-1: Prepare Words To Use In Class

- Practice is tied to the lesson topic or outline and offers realistic questions from a 13-year-old, suggested responses, and simpler language.
- The educator can select a question, type an answer, and receive specific feedback on clarity, tone, age fit, and tradition caution, with a suggested revision.
- Feedback addresses teaching language rather than judging the educator's personal faith. It is a coaching draft, not a test score.
- Label the current interaction accurately as typed practice; do not imply that live voice rehearsal is available.

### P1-2: Reuse Classroom Evidence

- Reflection entry supports lesson date, topic, plan used, what worked, what did not, student response, and what to try next. A short useful note should be possible without filling every field.
- Educators can inspect, edit, and delete raw reflections. Explain that storage is local to this browser and avoid asking for student full names.
- Include up to five recent reflections in planning as evidence, not instructions that override current requirements or tradition safeguards. Avoid interpreting a small set of observations as permanent student traits.
- Show an empty state when there is no memory. Inspectable synthesis must preserve its source reflections and be marked stale when those sources change.
- For a fixture such as “students struggled with long explanations; next time use a short model and paired role play,” the next relevant lesson should visibly incorporate an appropriate adjustment that the educator can identify. Irrelevant history should not be forced into a plan.

### P1-3: Make Necessary Materials Easier To Prepare

- Recommend materials when their learning purpose is clear, with a brief rationale. Core planning remains usable without them.
- Generate printable story/scenario/value cards, storyboard prompts, and worksheet guidance suited to the activity and age group. Image rendering is a separate educator action.
- Include cultural/visual review notes, especially for sacred figures, rituals, or offerings. Text-heavy prompts and generated image text require educator checking before classroom use.
- Printed material must be readable and omit application controls. A visual pack should match the current outline/plan or disclose that it needs regeneration.

## 7. Frontend Design Requirements

The interface should make an educator feel ready to make the next planning decision. Use calm hierarchy, generous spacing, readable type, restrained color, and clear selected states. Do not make decorative styling compete with the lesson content.

- **Entry:** A single dominant “Talk about it” action, a clear “Type it out” fallback, a concise benefit, and compact default-class context. A new user should be able to identify the audience, benefit, and next step without scrolling through a feature list.
- **Progress:** Present only steps and secondary tools useful at the current stage. Keep metrics, reference notes, and detailed memory out of the initial workspace.
- **Comparison:** Give option cards a consistent structure. Keep the current selection, tradeoff, and next action clear; use progressive disclosure for long explanations.
- **Artifacts:** Make the outline and plan read like teaching documents, with a clear summary, scannable sequence, and review notes beside the decision they inform. Optional practice and materials should not compete with the main continue/print action.
- **Continuity:** Collapse completed options and outlines into accessible summaries when the next artifact is ready, retain a way to revisit them, and move keyboard focus to the new artifact. Prevent requirement changes, option switching, or draft resets from racing with an in-flight request.
- **States:** Loading explains which artifact is being prepared; failures retain input and offer a retry. Draft reset explains what it clears and preserves saved classroom reflections.
- **Accessibility:** Use labeled controls, semantic headings, visible keyboard focus, adequate text contrast, keyboard-operable disclosure, and primary touch targets of at least 44px. Voice cannot be the only input.
- **Responsive behavior:** At 375px, 768px, and desktop widths, primary content fits without horizontal scrolling; forms and options remain readable; the current main action is discoverable. Printed artifacts must be checked separately from screen layout.
- **Language:** Use “lesson outline,” “Talk about it,” “Type it out,” and “Practice.” Avoid internal language such as agents, critic, signals, MVP, or prompt caching in educator action copy. Review notes can describe practical classroom and tradition considerations without exposing implementation mechanics.

## 8. Quality, Reliability, And Data Boundaries

Structured model output must remain aligned with TypeScript types and JSON schemas. The application owns workflow, selection, approval, storage limits, and artifact state; models draft, review, and revise content inside those boundaries. One revision is the maximum automatic review loop, with remaining concerns shown to the educator.

Voice requires microphone permission only. Saved reflections and the latest voice transcript are local browser data; relevant inputs and recent reflections are sent to the API/model for generation. “Saved locally” must not imply that generation happens entirely on-device. No account, sync, or centralized analytics should be implied. Production storage and sharing require an explicit privacy, retention, and deletion design before implementation.

Performance targets are hypotheses to instrument during the pilot: a standard outline within two minutes and a full plan within five minutes, excluding optional image generation. Record model wait separately from active educator preparation and report the median and slowest observed pilot case. Useful loading states and retry behavior are required even when these targets are missed. Keep caching and model configuration in implementation documentation, not the customer value proposition.

## 9. Validation Plan And Success Measures

### Pilot Design

The product lead should recruit 6–8 educators from the target context for a four-week pilot before expanding scope. This is a proposed research plan, not a completed study. Establish each educator's usual weekly planning method and active preparation time. Use at least one paired preparation exercise with comparable lesson needs and the same supplied class context; vary method order where practical. Ask a suitable educator/temple reviewer to assess tradition fit without relying on the app's own model review.

Collect minimal, volunteered evidence: preparation time, whether the draft was used, major changes needed, readiness before/after, and a short post-class reflection. Do not collect student identities or infer learning impact from generation events. A small pilot provides directional product decisions, not statistically conclusive efficacy claims.

### Operational Definition Of A Useful Plan

A plan counts as educator-approved when the educator has checked the teaching anchor and review notes, can explain how to run the timed flow, can prepare its materials, and would use it with only minor wording or context changes. Replacing the main activity, rebuilding the scaffold/timing, or correcting a core tradition claim counts as a major revision.

The primary outcome is the **proportion of started pilot planning sessions that produce an educator-approved plan subsequently used or adapted for class**. Record approval and actual use separately; a generated or printed artifact alone does not satisfy this measure.

| Measure | Proposed pilot decision threshold | Collection method |
| --- | --- | --- |
| First-session usability | At least 80% of participants reach and review a full plan without facilitator rescue. | Observed task; log friction and errors. |
| Lesson usefulness | At least 70% of completed pilot plans meet the useful-plan definition without major revision. | Educator review plus revision notes. |
| Weekly value | At least 60% of participants use a reviewed plan for two or more classes in the pilot. | Voluntary post-class check-in; denominator is all enrolled participants. |
| Preparation effort | Median active preparation time improves by at least 25% versus the participant's baseline, with quality thresholds maintained. | Start/stop diary including review, adaptation, practice, and materials; record model wait separately. This is a decision target, not a marketing promise. |
| Preparation confidence | At least 70% of participants report an improvement of at least one point on a five-point readiness scale. | Before/after question plus an example of what became easier to teach. |
| Tradition and classroom quality | No unresolved critical misrepresentation, harmful doctrinal certainty, or unsupervised-student pathway in the release corpus. | Human review plus targeted adversarial evals; block release and repair critical failures. |
| Reflection utility | At least 70% of tested next-lesson drafts with relevant saved evidence include a useful, recognizable adaptation. | Educator comparison against the source reflection; report the number of eligible drafts. |

No time-saving percentage should be presented as a proven benefit until evidence supports it. Thresholds are provisional and should be revisited after baseline data, without retrospectively presenting revised targets as original results.

### Diagnostic Measures

Track option generation, selection, outline generation/refinement, full-plan generation, practice, reflection, and print events to locate friction. Current events are local browser data only. They do not establish a unique user count, retention, actual classroom use, or time saved. A pilot diary/manual review supplies missing outcome evidence; adding analytics requires a separate product decision.

Voice uptake, visual-pack count, and practice frequency are diagnostics, not adoption quotas. If typed planning works better for an educator or a lesson needs no visuals, that is compatible with success.

### Verification Before Pilot Release

- Run `npm run build` and targeted `npm run eval:local -- --case ...` checks when changing prompt contracts, schemas, or review behavior.
- Exercise voice approval, typed fallback, option selection, outline feedback, full-plan generation, and browser print. Verify review notes at each applicable stage.
- Inspect mobile/desktop layouts and keyboard focus; test empty, loading, error, and selected states.
- Check adversarial generic-Buddhism, weak-scaffolding, and overconfident karma/merit cases. Human review remains necessary beyond deterministic checks.
- Confirm reflection save/edit/delete and relevant next-lesson reuse, with honest local-storage disclosure.
- Log known gaps rather than presenting target acceptance criteria as implemented behavior.

## 10. Rollout And Investment Decisions

1. **Validate the weekly loop:** Complete P0 usability/reliability checks and run the focused pilot with existing practice, materials, and reflection support. Fix abandonment points and major rewrite causes first.
2. **Invest in the demonstrated bottleneck:** If educators cannot adapt/export drafts, prioritize editable output and document export. If tradition checking dominates preparation, prioritize a vetted source layer with temple reviewers. If difficult explanations dominate uncertainty, test voice practice. Do not add all three merely to broaden the feature list.
3. **Deepen repeat use:** Improve inspectable/editable reflection synthesis and lesson continuity after evidence shows educators return weekly. Consider persistent storage only with an explicit privacy and migration plan.
4. **Expand only after value is demonstrated:** Multi-week curriculum, coordinators, other traditions/subjects, and live classroom support require separate discovery and requirements. They are not promises in the current entry experience.

If pilot quality is strong but preparation time does not improve, investigate review and adaptation effort before adding more generation. If the main value is confidence rather than speed, revise positioning using observed evidence. Do not scale the breadth of the product until the narrow weekly preparation problem is working.

## 11. Open Product Decisions

| Decision | Who should resolve it | Evidence and timing |
| --- | --- | --- |
| Which teaching anchors and local practices need vetted references? | Product lead with participating educators and temple reviewers. | Catalogue recurring review concerns during the pilot; resolve before claiming source authority. |
| Are English outputs with Chinese terms sufficient? | Product lead with target educators. | Observe explanation and material edits before committing to bilingual scope. |
| Which edit/export step blocks classroom use? | Product/design lead. | Observe actual print-and-prepare tasks; choose a format based on use, not breadth. |
| How well do age, class-size, and duration overrides work? | Product/engineering lead. | Test representative non-default cases before promising broader customization. |
| Which sacred-image categories should be supported? | Product lead with temple reviewers. | Review real material requests; establish boundaries before expanding image presets. |
| What data may be persisted or shared beyond the browser? | Product/engineering lead with privacy review. | Define consent, retention, deletion, and migration before adding accounts or sync. |
