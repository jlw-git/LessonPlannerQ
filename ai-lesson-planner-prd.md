# Product Requirements Document: Lesson Planner Q

Last updated: May 20, 2026

## 1. Overview

### Product Name

Lesson Planner Q

Primary user-facing surface: Weekly Lesson Planner

### Product Summary

Lesson Planner Q is a voice-first weekly lesson planning tool for Buddhist educators. It helps educators generate lesson plans, rehearse tricky explanations, and log reflections after each lesson to improve future lessons.

The core MVP surface is organized around those three jobs:

- Generate lesson plan: talk through the lesson with PlannerQ, or type thoughts out.
- Rehearse tricky explanations: practise likely student questions and simpler wording.
- Log lesson reflections: capture what worked, what did not, and what to try next.

The first version focuses on Chinese Mahayana folk Buddhism, 90-minute lessons, and small classes of around four 13-year-old students. Visual packs remain part of the lesson planning workflow when a lesson would benefit from printable or illustrated materials, but the core product promise is lesson plan generation plus educator rehearsal.

### Product Vision

Help community and volunteer educators walk into class prepared, confident, and able to make Buddhist teachings feel relevant to students' lives.

Over time, Lesson Planner Q can become a broader curriculum assistant for values education, culture, history, language learning, and other subjects.

## 2. Problem Statement

Educators teaching Buddhist classes face a recurring weekly preparation burden. They often need to create fresh lessons from scratch, while Buddhist teachings and stories are spread across multiple sources rather than organized into a single classroom-ready curriculum.

For Chinese Mahayana folk Buddhism, relevant teaching material may come from sutras, commentaries, temple practices, festivals, stories, devotional figures, oral traditions, and community customs. Educators then need to turn those materials into age-appropriate activities for 13-year-old students.

Many educators also want to use play-based learning and self-directed learning, but feel ill-equipped. This concern is valid: self-directed learning requires upfront scaffolding, clear instructions, reflection prompts, resources, checkpoints, and facilitation guidance.

The educator also learns from each class, but those observations are easy to lose. If a lesson activity worked well, if students struggled with a concept, or if the educator found a better explanation, the next lesson should benefit from that memory.

## 3. Goals And Non-Goals

### Goals

- Reduce weekly lesson preparation time for Buddhist educators.
- Generate age-appropriate weekly 90-minute lesson plans grounded in Chinese Mahayana folk Buddhism.
- Make voice the primary input for planning, with typing as a secondary entry point.
- Help students connect Buddhist teachings to daily life, including friendship, anger, family expectations, school stress, compassion, gratitude, and social media behavior.
- Support play-based learning and scaffolded self-directed learning.
- Let educators compare lesson plan options before committing to a brief.
- Give educators facilitation notes that make lessons easier to run.
- Help educators rehearse difficult explanations and skeptical student questions.
- Prompt visual pack generation when the chosen lesson plan would benefit from classroom materials.
- Capture post-class reflections so future lesson plans build on past classroom experience.
- Preserve educator control and review before classroom use.

### Non-Goals For MVP

- Cover all Buddhist traditions.
- Replace the educator as facilitator.
- Provide unsupervised AI interaction directly to students.
- Guarantee doctrinal authority without curated source review.
- Build a complete multi-year curriculum.
- Support every subject area at launch.
- Automate classroom assessment or grading.

## 4. Target Users

### Primary User

A Buddhist educator, volunteer teacher, or part-time instructor teaching a small weekly class of 13-year-old students.

The educator may not be formally trained in curriculum design. They want lessons that are meaningful, practical, and engaging, but they have limited time to prepare.

### Secondary Users

- Temple education coordinators who want more consistent lesson quality.
- Buddhist education groups that support volunteer educators.
- Future educators in adjacent subjects such as values education, culture, language, or history.

### Student Context

- Age: 13 years old.
- Class size: approximately four students.
- Lesson length: usually 90 minutes.
- Learning goal: see the relevance of Buddhist teachings and apply them in everyday life.
- Preferred lesson style: play-based learning and scaffolded self-directed learning.

## 5. Differentiation

Generic AI lesson planners can generate activities, worksheets, and lesson outlines. For this educator, that is helpful but incomplete. The harder problem is not just producing content; it is turning scattered Buddhist teachings into respectful, age-appropriate, practice-oriented lessons that a volunteer educator can confidently facilitate for 90 minutes.

Lesson Planner Q is differentiated in nine ways:

- Voice-first planning: Educators can think aloud while the planner asks clarifying questions.
- Tradition-specific: It defaults to Chinese Mahayana folk Buddhism and avoids presenting Buddhism as one uniform tradition.
- 90-minute lesson design: It structures lessons for the actual weekly class length rather than assuming a short school period.
- Small-class fit: It designs activities for four students, where discussion, role play, and turn-taking can be more personal.
- Option review: It presents multiple lesson approaches so the educator can choose what fits the class.
- Application-first: It connects teachings to school, family, friendship, stress, social media, and moral choices.
- Scaffolded pedagogy: It uses gradual release of responsibility so self-directed learning is supported rather than vague.
- Educator confidence: It includes rehearsal coaching for difficult questions, skeptical students, and simpler explanations.
- Lesson memory: It captures what worked and what did not, then uses those reflections to improve future lessons.

The product should be evaluated against generic AI lesson planners not only on output speed, but on whether the educator feels more prepared to teach respectfully, facilitate discussion, and help students apply Buddhist teachings in daily life.

## 6. User Needs

### Educator Needs

- I need a fresh lesson plan every week without starting from a blank page.
- I need to talk through a rough idea before I know exactly what I want.
- I need Buddhist source material translated into age-appropriate teaching content.
- I need confidence that the lesson is respectful and aligned with Chinese Mahayana folk Buddhism.
- I need activities that work for a small class.
- I need help using self-directed learning without leaving students unsupported.
- I need ways to make abstract teachings feel practical.
- I need printable or display-ready materials when the lesson needs them.
- I need to rehearse how to answer difficult student questions.
- I need to capture what happened after class so next week's lesson can build on it.

### Student Needs

- I need lessons that feel connected to my actual life.
- I need activities that let me discuss, play, reflect, and apply ideas.
- I need Buddhist teachings explained in language I can understand.
- I need room to ask questions without feeling judged.

## 7. Core User Journey

1. The educator starts by voice.
2. The planner asks clarifying questions about the topic, class context, desired takeaway, and constraints.
3. The planner generates several lesson plan options.
4. The educator reviews the options in bite-sized chunks and selects the best approach.
5. The planner generates a structured lesson brief.
6. The educator gives feedback or edits the brief.
7. The planner updates the brief.
8. If visual materials are useful, the planner prompts the educator to generate a visual pack.
9. The planner prompts the educator to rehearse tricky explanations with the rehearsal coach.
10. The educator practices, then makes further changes to the brief if needed.
11. The planner updates the lesson plan and regenerates the visual pack if the plan changed.
12. After the lesson, the educator logs reflections about what worked, what did not, student response, and what to try next.
13. Future lesson options, briefs, visuals, rehearsal prompts, and full lesson plans use the saved lesson memory.

Typing a brief remains available as a secondary entry point for educators who already know the lesson direction.

## 8. Core Use Cases

### Use Case 1: Plan A Lesson By Voice

The educator speaks naturally:

> "Next week I want to teach compassion, but my students are restless and I want an activity."

The product asks follow-up questions, clarifies constraints, and generates lesson options. This supports educators who think through lessons aloud more naturally than they complete forms.

### Use Case 2: Type A Lesson Brief

The educator opens the secondary typed brief panel and enters the topic, desired outcome, class context, and planning notes. The product uses the typed brief to generate lesson options.

### Use Case 3: Review Lesson Options

The product shows several possible lesson approaches, such as a role-play lesson, a station-based lesson, or a story-and-reflection lesson. Each option shows the core idea, best fit, sample activities, tradeoffs, and whether visuals or rehearsal are recommended.

### Use Case 4: Generate A Weekly Lesson Brief

After the educator selects an option, the product generates a structured brief with summary, student takeaway, teaching anchor, clarifying questions, facilitation guidance, visual recommendation, and rehearsal recommendation.

### Use Case 5: Generate A Full Lesson Plan

The educator generates a complete 90-minute lesson plan from the reviewed brief. The plan includes timing, objectives, activities, discussion prompts, reflection questions, facilitation notes, materials, and optional extension or take-home activity.

### Use Case 6: Generate Lesson Visual Packs

When the selected plan would benefit from visual materials, the product generates classroom-ready visual pack guidance such as scenario cards, story cards, reflection prompts, classroom posters, role-play cards, matching cards, and worksheet prompts.

Example:

> "Create four comic-style panels showing a student choosing compassion during a school conflict."

### Use Case 7: Rehearse Before Class

The educator practices with a voice-based rehearsal coach.

Example:

> "Pretend you are a skeptical 13-year-old. Ask me hard questions about karma."

The product simulates student responses, helps the educator practice explanations, and suggests simpler language.

### Use Case 8: Capture Post-Class Reflection

After class, the educator logs what happened:

- lesson plan used
- what worked well
- what did not work
- student response
- what to try next time

The product stores this as lesson memory and uses it when drafting future lessons.

### Use Case 9: Get Live Facilitation Support

During class, the educator quietly asks:

> "Give me a 5-minute backup activity because the students finished early."

This is deferred from the core MVP unless implemented as a limited educator-only beta. The product must not support unsupervised student-agent interaction in MVP.

## 9. MVP Scope

### Included In MVP

- Voice-first lesson planning interview.
- Secondary typed brief entry.
- Topic-based weekly lesson option generation.
- Lesson option comparison and selection.
- Chinese Mahayana folk Buddhism as the initial tradition focus.
- Student age and class size customization.
- 90-minute lesson default with lesson duration customization.
- Play-based activity generation.
- Scaffolded self-directed learning generation using gradual release of responsibility: "I do, we do, you do."
- Structured lesson brief generation and update flow.
- Agentic critic review and one-pass revision for lesson options before educator display.
- Full 90-minute lesson plan generation.
- Agentic critic review and one-pass revision for full lesson plans before educator display.
- Educator facilitation notes.
- Discussion prompts and reflection questions.
- Real-life application exercises.
- Educator rehearsal coach for practicing explanations and student questions.
- Visual pack recommendation and generation when useful for the selected lesson.
- Educator review before finalizing generated materials.
- Lesson memory for post-class reflection and future planning context.
- Local persistence for saved lesson reflections in the prototype.
- Small curated pedagogy library used as lesson-design guardrails.
- Educator-visible rationale explaining why the generated lesson design fits the class context.
- Educator-visible review notes from the pedagogy critic and tradition reviewer.
- Professional, calm, Apple-inspired interface principles: clarity, hierarchy, spaciousness, direct manipulation, and minimum 44px touch targets.

### Deferred From MVP

- Live facilitation copilot, unless implemented as a limited educator-only beta.
- Voice-based post-class reflection debrief.
- Multi-week curriculum planning.
- Full curated Buddhist source library.
- Support for multiple Buddhist traditions.
- Direct student-facing AI tutor.
- Multi-subject expansion.
- Organization-level lesson libraries and coordinator workflows.

## 10. Functional Requirements

### Voice-Based Lesson Planning

- The system must make voice the primary planning input.
- The system should allow educators to speak a lesson planning request naturally.
- The system should display a readable conversation transcript during voice planning.
- The transcript should show only two speakers: PlannerQ and You.
- The system should avoid showing partial word-by-word duplicate transcript blocks as final messages.
- The system should ask clarifying questions when important details are missing.
- The system should convert the voice conversation into structured lesson inputs.
- The system should generate lesson options from the structured inputs.
- The system should allow educators to review and edit the resulting brief.

### Typed Brief Entry

- The system must provide a secondary path for typed planning.
- The typed brief entry should appear inside the typed brief panel when expanded.
- The typed brief should support topic, desired outcome, class context, and planning notes.
- The system should generate lesson options from typed input.

### Lesson Option Review

- The system must generate multiple lesson plan options before generating a final brief.
- The system must display lesson options in bite-sized cards.
- Each option should include the title, short description, best-fit context, sample activities, tradeoffs, visual recommendation, and rehearsal focus.
- The educator must be able to select an option.
- Selected state should appear once and be visually unambiguous.
- The educator should be able to expand or collapse option details without losing their place.

### Lesson Brief Generator

- The system must generate a structured lesson brief from the selected option.
- The brief must include a summary, student takeaway, teaching anchor, clarifying questions, facilitation notes, visual recommendation, and rehearsal recommendation.
- The educator must be able to provide feedback and update the brief.
- The brief should clearly label generated content as draft material requiring educator review.

### Full Lesson Plan Generator

- The system must default lesson duration to 90 minutes.
- The system must generate a complete weekly lesson plan.
- The system should run a pedagogy critic and tradition reviewer over the draft plan before showing it.
- The system should revise the plan once when the critic identifies concrete improvements.
- The lesson plan must include learning objectives, timing, opening activity, main activity, discussion prompts, reflection questions, facilitation notes, materials, and optional take-home activity.
- The lesson plan should include visible review notes about pedagogy, tradition handling, and educator judgment calls.
- The system must support play-based and self-directed lesson formats.
- The system must allow the educator to edit generated content.

### Buddhist Teaching Support

- The system must default to Chinese Mahayana folk Buddhism for MVP.
- The system must avoid presenting Buddhism as a single uniform tradition.
- The system should include tradition labels and context notes where relevant.
- The system should avoid overconfident doctrinal claims when source support is limited.
- The system should prefer curated or approved source material when available.

### Self-Directed Learning Support

- The system must scaffold self-directed learning activities.
- The system must include educator guidance for how to introduce, monitor, and debrief self-directed tasks.
- The system should include checkpoints, student prompts, and reflection tasks.
- The system should adapt self-directed learning activities for a small class of four students.

### Educator Rehearsal Coach

- The system should allow educators to rehearse explanations before class.
- The system should simulate realistic 13-year-old student questions.
- The system should help the educator simplify abstract Buddhist concepts.
- The system should provide constructive feedback on clarity, tone, and age appropriateness.
- The system should avoid judging the educator's personal faith or practice.

### Visual Material Generator

- The system should recommend visual materials only when they add value to the selected lesson.
- The system should generate age-appropriate visual aid plans.
- The system should generate printable story cards, scenario cards, value cards, role-play cards, matching cards, classroom posters, activity sheets, and reflection worksheet prompts.
- The system should support comic-style panels for everyday moral scenarios.
- The system should support Buddhist storyboards for arrange-discuss-reflect activities.
- The system must require educator review before generated visuals are used in class.

### Lesson Memory

- The system must let educators log post-class reflections.
- Reflections must include lesson date, topic, lesson plan used, what worked well, what did not work, student response, and what to try next.
- The system must let educators review saved reflections.
- The system must let educators edit or delete saved reflections.
- The interface should clearly explain where reflections are saved. In the prototype, reflections are saved in the educator's browser local storage.
- The system should include recent reflections when generating future options, briefs, visuals, rehearsal prompts, and full lesson plans.
- The system should make it clear when no reflections have been saved.
- The prototype may store reflections locally; production storage requires privacy review.

### Live Facilitation Copilot

- The system should support quick educator-facing suggestions during class in a later release.
- The system should generate short backup activities, discussion prompts, transitions, and debrief questions.
- The system must not be positioned as an unsupervised student-facing agent for MVP.

## 11. Non-Functional Requirements

### Quality

- Generated lesson plans should be understandable to educators without curriculum design training.
- Generated activities should be feasible for a class of four students.
- Outputs should use age-appropriate language for 13-year-old students.
- Generated plans should be editable and easy to scan.
- Lesson options should be chunked so educators can compare approaches without excessive scrolling.

### Safety And Trust

- Educators must remain in control of what is taught.
- Student-facing materials must be reviewed before use.
- The product must handle religious content respectfully.
- The product must avoid unsupported claims about Buddhist doctrine.
- The product must avoid direct unsupervised interactions with minors in MVP.
- Reflection data may mention students, so production storage must consider consent, privacy, and retention.

### Accessibility

- Voice planning should support educators who prefer speaking to typing.
- Typing should remain available for quiet environments or educators who prefer written planning.
- Primary controls should meet minimum touch target size.
- Transcript text should be readable and scannable.
- Printable materials should use clear text and classroom-friendly layouts.
- Visual outputs should avoid clutter and should be legible when printed.

### Performance

- A standard lesson brief should be generated in under 2 minutes.
- A complete lesson plan plus visual material suggestions should be generated in under 5 minutes.
- The educator should be able to reach a usable lesson draft in under 10 minutes.
- Prompt caching should be used where appropriate for stable system instructions and schemas.

## 12. AI Capability Mapping

Lesson Planner Q should make clear to educators and builders which parts are model-generated and which parts are application logic. The product is not a fully autonomous lesson designer; it is a structured planning workflow that asks LLMs to draft specific artifacts inside app-defined boundaries.

The agentic direction is a bounded loop: draft, critique, revise once, show the educator the draft plus review notes, rehearse, and carry classroom evidence into the next plan. The deterministic product shell should continue to own navigation, state, validation, review gates, storage, and the educator-facing boundary.

### LLM-Generated Capabilities

LLMs should generate draft content where open-ended judgment, language, examples, and classroom adaptation are needed:

- lesson option drafts
- pedagogy critic and tradition reviewer notes for lesson options
- one-pass lesson option revisions when the critic requests concrete changes
- lesson brief drafts and brief revisions
- full lesson plan drafts
- pedagogy critic and tradition reviewer notes for full lesson plans
- one-pass full lesson plan revisions when the critic requests concrete changes
- visual material pack drafts and image prompts
- rehearsal scenarios, likely student questions, simpler wording, and coaching notes
- educator-facing voice planning and rehearsal conversation
- generated lesson images, when the educator requests image rendering

All LLM-generated content must remain educator-reviewed draft material. The product should avoid implying that generated content is doctrinally authoritative, classroom-ready without review, or a substitute for the educator's judgment.

### Rules-Based And App-Controlled Capabilities

Rules-based logic should define the product structure around the LLM outputs:

- planning workflow order and navigation
- typed form fields, defaults, and request payload assembly
- selected lesson option state and whether a brief, plan, visual pack, or rehearsal can be requested
- local reflection creation, editing, deletion, display, and browser storage
- limits on how many recent reflections are sent as planning memory
- API route boundaries, health checks, environment-driven model selection, error handling, and prompt-cache configuration
- JSON schema contracts for generated text artifacts
- deterministic local eval graders for schema shape and product guardrails

Rules and schemas constrain the model's output shape and product flow, but they do not verify religious accuracy, cultural appropriateness, or classroom fit by themselves. Those still require educator review.

### Agentic Planning Loop

The target loop is:

1. Educator talks or types.
2. Interview agent extracts structured planning context.
3. Option agent creates three approaches.
4. Pedagogy critic and tradition reviewer inspect the options.
5. Option agent revises weak options before showing them.
6. Educator selects one.
7. Brief/plan agent drafts.
8. Critic reviews the full plan.
9. Plan agent revises once.
10. Educator sees the draft plus review notes.
11. Rehearsal agent helps the educator practice.
12. After class, reflection agent summarizes classroom evidence into memory.
13. Next planning session starts with that memory.

The implemented first build slices cover option review/revision and full-plan review/revision, with local eval coverage for schema shape, pedagogy signals, tradition-review signals, and adversarial guardrails. Structured interview extraction, brief critique, rehearsal attempt critique, and reflection memory synthesis remain roadmap work after this validated review-loop foundation.

### GPT Realtime 2

GPT Realtime 2 should power educator-facing voice experiences:

- voice lesson planning interview
- readable transcript window during planning
- educator rehearsal coach
- future educator-facing live facilitation copilot
- future voice-based post-class debrief

Realtime voice is most valuable where the educator is thinking aloud, practicing, or responding to classroom conditions.

### GPT Image 2

GPT Image 2 should power classroom material generation when the lesson plan calls for it:

- lesson visual packs
- story cards
- scene illustrations
- reflection worksheets
- classroom posters
- play-based game assets
- Buddhist storyboards

Image generation is most valuable where the educator would otherwise need design time, illustration skill, or printable material preparation.

### Prompt Caching

Prompt caching should be used for stable instruction layers, including product scope, safety constraints, pedagogy guidance, schema instructions, and tradition handling. Dynamic lesson inputs, educator feedback, and lesson memory should remain outside the stable cached prefix where possible.

## 13. Content And Pedagogy Requirements

### Tradition Focus

The MVP must focus on Chinese Mahayana folk Buddhism. It should acknowledge that Buddhism has many forms and avoid generalizing across traditions.

### Age Appropriateness

Lessons should be designed for 13-year-old students. Content should avoid overly abstract, moralizing, or adult-oriented framing. It should connect teachings to daily life.

### Lesson Length

The default lesson length should be 90 minutes. Generated lessons should include enough variety to sustain attention across the full session, including opening, teaching anchor, play-based activity, scaffolded self-directed task, discussion, reflection, and close.

### Teaching Style

The product should support:

- play-based learning
- guided discussion
- role play
- scenario-based learning
- reflection
- scaffolded self-directed learning

### Self-Directed Learning Framework

The MVP should use gradual release of responsibility:

- I do: educator introduces the teaching or models a reflection.
- We do: class explores a scenario together.
- You do: students apply the teaching independently, in pairs, or through a small-group activity.

### Pedagogy Reference Layer

The product should use established education references as lesson-design guardrails, not as long citations pasted into every lesson. The product should generate from a small curated pedagogy library, then adapt those principles to the educator's topic, class context, student needs, lesson length, and prior lesson memory.

This layer should support three jobs:

- Generation rubric: evaluate whether the lesson is age-appropriate, active, reflective, scaffolded, and feasible for a small 90-minute class.
- Prompt/RAG layer: provide compact reference guidance to the model when generating lesson options, briefs, rehearsal prompts, visual recommendations, and full lesson plans.
- Educator-visible rationale: briefly explain why a lesson design fits the class, such as "uses gradual release because students need structure before self-directed practice" or "uses role-play because this class responds well to movement."

The rationale should be short and practical. It should help the educator trust and improve the plan without turning the lesson output into an academic literature review.

Recommended reference families:

- CASEL social and emotional learning competencies.
- Character education frameworks, such as the Jubilee Centre's practical wisdom and virtue language.
- Self-determination theory for autonomy, competence, and relatedness.
- Self-regulated learning for goal setting, monitoring, reflection, and adjustment.
- Project Zero thinking routines for visible thinking and discussion.
- Learning-through-play principles: meaningful, joyful, socially interactive, actively engaging, and iterative.
- Making Caring Common-style moral development guidance for empathy, care, and community responsibility.

The product should translate these references into practical lesson structures, prompts, and review rubrics. It should not require the educator to understand each framework before using the product. Citations or framework labels may be available in an optional "why this works" view, but they should not clutter the main lesson plan or student-facing materials.

## 14. Example Generated Lesson Output

### Lesson Topic

Compassion in daily life.

### Lesson Length

90 minutes.

### Teaching Anchor

Guanyin Bodhisattva as a symbol of noticing suffering and responding with care.

### Student Application

How to respond when a classmate is excluded, teased, or upset.

### Activities

- Opening check-in: students choose from scenario cards showing everyday conflicts.
- I do: educator models how to notice suffering, name the need, and choose one kind action.
- We do: the class discusses one school-life scenario together.
- You do: students role-play a school conflict and test different responses.
- Reflection: students answer, "What suffering did I notice? What helpful response could I choose?"
- Optional visual material: four comic-style panels showing a student choosing compassion during a school conflict.

## 15. Success Metrics

### Activation Metrics

- Percentage of educators who start a voice planning session.
- Percentage of educators who generate lesson options.
- Percentage of educators who select an option.
- Percentage of educators who generate a lesson brief.
- Percentage of educators who generate a full lesson plan.
- Percentage of educators who log at least one lesson reflection.

### Engagement Metrics

- Number of lesson plans generated per educator per month.
- Number of lesson plans reused or adapted.
- Number of reflections saved per educator per month.
- Frequency of rehearsal coach usage before class.
- Percentage of lesson plans influenced by prior lesson memory.
- Number of visual packs generated when recommended.

### Outcome Metrics

- Educators can create a usable lesson plan in under 10 minutes.
- Weekly preparation time is reduced by at least 50%.
- Educators rate generated lessons as useful or very useful.
- Educators report that generated 90-minute plans are easier to facilitate than generic AI-generated lesson plans.
- Educators report increased confidence using self-directed learning.
- Students can explain how a Buddhist teaching applies to daily life.

### Quality Metrics

- Percentage of generated lessons approved by educators without major rewrite.
- Percentage of generated activities rated feasible for a class of four.
- Percentage of generated visuals rated culturally appropriate by educators.
- Number of content accuracy or sensitivity issues reported.
- Percentage of generated plans that explicitly use relevant prior reflections when available.

## 16. Risks And Mitigations

### Risk: Doctrinal Inaccuracy Or Oversimplification

Mitigation: Use curated source material, tradition labels, educator review, and cautious language when source confidence is limited.

### Risk: Treating Buddhism As One Uniform Tradition

Mitigation: Default to Chinese Mahayana folk Buddhism and explicitly label content by tradition.

### Risk: Overreliance On AI In A Religious Education Setting

Mitigation: Position the product as educator support. Require educator review and keep the educator as facilitator.

### Risk: Unsupervised Student Interaction

Mitigation: Keep realtime features educator-facing in MVP. Defer student-facing AI until there are stronger safety, consent, and supervision models.

### Risk: Culturally Inappropriate Images

Mitigation: Use respectful visual style presets, provide restricted image categories for sacred figures and rituals, and require educator review.

### Risk: Self-Directed Learning Without Enough Scaffolding

Mitigation: Use a clear framework, include checkpoints, provide educator facilitation notes, and adapt tasks for small classes.

### Risk: 90-Minute Lessons Feel Too Long Or Repetitive

Mitigation: Structure lessons with varied modes: short teaching, discussion, game, self-directed task, sharing, reflection, and optional extension activities.

### Risk: Lesson Memory Contains Sensitive Student Information

Mitigation: Keep the MVP educator-facing, avoid prompting for student full names, and define privacy, consent, retention, and deletion requirements before production storage.

## 17. Rollout Plan

### Phase 1: Preparation MVP

- Voice-first lesson planning interview.
- Typed brief fallback.
- Lesson option generation and review.
- Structured lesson brief generation.
- Editable lesson output.
- Full 90-minute lesson plan generation.
- Play-based activity generation.
- Scaffolded self-directed learning activities.
- Educator rehearsal coach.
- Visual pack generation when recommended.
- Lesson memory through post-class reflection logging.

### Phase 2: Quality And Source Layer

- Curated Chinese Mahayana folk Buddhism content library.
- Source-aware lesson generation.
- Pedagogy reference rubric in generation and review.
- Festival-based lesson packs.
- Reusable lesson templates.
- Educator ratings and feedback loop.

### Phase 3: Class Memory And Live Support

- Voice-based post-class reflection debriefs.
- Multi-week class memory.
- Educator-facing live facilitation copilot.
- Multi-week curriculum planning.
- Exportable lesson history.

### Phase 4: Expansion

- Additional Buddhist traditions.
- Other subjects such as values education, culture, history, language learning, and character education.
- Organization-level curriculum management.

## 18. Open Questions

- Which Chinese Mahayana folk Buddhist sources should be included in the first curated library?
- Should the first version support English only, or English plus Chinese terms and explanations?
- What level of source citation is expected by educators or temple leaders?
- How much control should educators have over image style presets?
- Should visual generation avoid sacred figures in MVP, or support them with stricter review?
- What consent and privacy requirements apply if educator voice notes or class debriefs mention students?
- What is the minimum viable export format: Markdown, PDF, Google Docs, printable worksheet, or slide deck?
- Should the product be designed first for individual educators or temple education coordinators?
- How much flexibility is needed for lessons shorter or longer than 90 minutes?
- Which pedagogy references should be visible to educators, and which should remain behind the scenes as generation quality guidance?

## 19. Launch Criteria

- Educators can start with voice and generate lesson options.
- Educators can compare options and select one without excessive scrolling.
- Educators can generate and edit a full lesson plan in under 10 minutes.
- Generated lesson plans default to a complete 90-minute structure.
- Generated lessons consistently include play-based and scaffolded self-directed learning components.
- Rehearsal coach produces realistic student questions and helpful simplifications.
- Educators can log post-class reflection and see it influence future planning.
- Content is clearly labeled as focused on Chinese Mahayana folk Buddhism.
- Educator review is built into the workflow before classroom use.
- No direct unsupervised student-agent interaction is available in MVP.
