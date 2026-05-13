# Product Requirements Document: AI Lesson Planner

## 1. Overview

### Product Name

AI Lesson Planner

### Product Summary

AI Lesson Planner is a lesson preparation tool for Buddhist educators. It helps educators generate weekly lesson plans, play-based activities, scaffolded self-directed learning tasks, visual classroom materials, and rehearsal support for classes of 13-year-old students.

The first version focuses on Chinese Mahayana folk Buddhism and small classes of around four students. The product helps educators translate scattered Buddhist teachings, stories, practices, and values into classroom-ready lessons that students can relate to and apply in daily life.

### Product Vision

Help community and volunteer educators walk into class prepared, confident, and able to make Buddhist teachings feel relevant to students' lives.

Over time, the product can become a broader curriculum assistant for values education, culture, history, language learning, and other subjects.

## 2. Problem Statement

Educators teaching Buddhist classes face a recurring weekly preparation burden. They often need to create fresh lessons from scratch, while Buddhist teachings and stories are spread across multiple sources rather than organized into a single classroom-ready curriculum.

For Chinese Mahayana folk Buddhism, relevant teaching material may come from sutras, commentaries, temple practices, festivals, stories, devotional figures, oral traditions, and community customs. Educators then need to turn those materials into age-appropriate activities for 13-year-old students.

Many educators also want to use play-based learning and self-directed learning, but feel ill-equipped. This concern is valid: self-directed learning requires upfront scaffolding, clear instructions, reflection prompts, resources, checkpoints, and facilitation guidance.

The result is that educators may spend too much time preparing, repeat familiar lessons, rely on lecture-style teaching, or avoid more engaging learning methods because they feel difficult to run.

## 3. Goals And Non-Goals

### Goals

- Reduce weekly lesson preparation time for Buddhist educators.
- Generate age-appropriate weekly lesson plans grounded in Chinese Mahayana folk Buddhism.
- Help students connect Buddhist teachings to daily life, including friendship, anger, family expectations, school stress, compassion, gratitude, and social media behavior.
- Support play-based learning and scaffolded self-directed learning.
- Give educators facilitation notes that make lessons easier to run.
- Provide educator-facing voice planning and rehearsal support.
- Generate printable visual materials and reflection worksheets.
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
- Learning goal: see the relevance of Buddhist teachings and apply them in everyday life.
- Preferred lesson style: play-based learning and scaffolded self-directed learning.

## 5. User Needs

### Educator Needs

- I need a fresh lesson plan every week without starting from a blank page.
- I need Buddhist source material translated into age-appropriate teaching content.
- I need confidence that the lesson is respectful and aligned with Chinese Mahayana folk Buddhism.
- I need activities that work for a small class.
- I need help using self-directed learning without leaving students unsupported.
- I need ways to make abstract teachings feel practical.
- I need printable or display-ready materials without designing them myself.
- I need to rehearse how to answer difficult student questions.
- I need to capture what happened after class so next week's lesson can build on it.

### Student Needs

- I need lessons that feel connected to my actual life.
- I need activities that let me discuss, play, reflect, and apply ideas.
- I need Buddhist teachings explained in language I can understand.
- I need room to ask questions without feeling judged.

## 6. Core Use Cases

### Use Case 1: Generate A Weekly Lesson Plan

The educator enters a topic, age, class size, lesson duration, teaching style, and desired outcome. The product generates a complete lesson plan with objectives, activities, discussion prompts, facilitation notes, and reflection tasks.

Example topic: compassion in daily life.

### Use Case 2: Plan A Lesson By Voice

The educator speaks naturally:

> "Next week I want to teach compassion, but my students are restless and I want an activity."

The product asks follow-up questions, clarifies constraints, and generates a lesson plan. This supports educators who think through lessons aloud more naturally than they complete forms.

### Use Case 3: Generate Play-Based Learning Materials

The educator asks for printable or classroom-ready materials. The product generates items such as scenario cards, value cards, role-play character cards, board-game tiles, and matching cards for Buddhist concepts and daily actions.

### Use Case 4: Generate Lesson Visual Packs

The educator asks for visual aids such as story cards, scene illustrations, reflection prompts, classroom posters, and activity sheets.

Example:

> "Create four comic-style panels showing a student choosing compassion during a school conflict."

### Use Case 5: Generate Buddhist Storyboards

The product turns a Buddhist story into a visual sequence students can arrange, discuss, or reinterpret. For a class of four students, each student can take one panel, role, or scene.

### Use Case 6: Create Student Reflection Worksheets

The product generates illustrated worksheets that feel like guided reflection rather than exams.

Example prompt:

> "When I felt angry, what did I notice? What choice did I make?"

### Use Case 7: Rehearse Before Class

The educator practices with a voice-based rehearsal coach.

Example:

> "Pretend you are a skeptical 13-year-old. Ask me hard questions about karma."

The product simulates student responses, helps the educator practice explanations, and suggests simpler language.

### Use Case 8: Get Live Facilitation Support

During class, the educator quietly asks:

> "Give me a 5-minute backup activity because the students finished early."

The product suggests an educator-facing activity. This should remain educator-facing and should not allow unsupervised student-agent interaction in the MVP.

### Use Case 9: Capture Post-Class Reflection

After class, the educator records a short debrief:

> "Students understood compassion but struggled with applying it at school."

The product converts this into class memory, planning context, and suggested follow-up for the next lesson.

## 7. MVP Scope

### Included In MVP

- Topic-based weekly lesson plan generation.
- Chinese Mahayana folk Buddhism as the initial tradition focus.
- Student age and class size customization.
- Lesson duration customization.
- Play-based activity generation.
- Scaffolded self-directed learning generation using an established structure such as gradual release of responsibility: "I do, we do, you do."
- Educator facilitation notes.
- Discussion prompts and reflection questions.
- Real-life application exercises.
- Editable lesson output.
- Voice-based lesson planning interview.
- Educator rehearsal coach for practicing explanations and student questions.
- Printable lesson visual packs.
- Play-based learning material generation.
- Illustrated student reflection worksheets.
- Educator review before finalizing generated materials.

### Deferred From MVP

- Live facilitation copilot, unless implemented as a limited educator-only beta.
- Reflection circle assistant and persistent class memory.
- Multi-week curriculum planning.
- Full curated source library.
- Support for multiple Buddhist traditions.
- Direct student-facing AI tutor.
- Multi-subject expansion.

## 8. Functional Requirements

### Lesson Plan Generator

- The system must allow educators to input lesson topic, student age, class size, lesson duration, teaching style, and learning goal.
- The system must generate a complete weekly lesson plan.
- The lesson plan must include learning objectives, opening activity, main activity, discussion prompts, reflection questions, facilitation notes, materials, and optional take-home activity.
- The system must support play-based and self-directed lesson formats.
- The system must allow the educator to edit generated content.
- The system should clearly label generated content as draft material requiring educator review.

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

### Voice-Based Lesson Planning

- The system should allow educators to speak a lesson planning request.
- The system should ask clarifying questions when important details are missing.
- The system should convert the voice conversation into structured lesson inputs.
- The system should generate a lesson plan from the structured inputs.
- The system should allow educators to review and edit the resulting plan.

### Educator Rehearsal Coach

- The system should allow educators to rehearse explanations before class.
- The system should simulate realistic 13-year-old student questions.
- The system should help the educator simplify abstract Buddhist concepts.
- The system should provide constructive feedback on clarity, tone, and age appropriateness.
- The system should avoid judging the educator's personal faith or practice.

### Visual Material Generator

- The system should generate age-appropriate visual aids.
- The system should generate printable story cards, scenario cards, value cards, role-play cards, board-game tiles, matching cards, classroom posters, activity sheets, and reflection worksheets.
- The system should support comic-style panels for everyday moral scenarios.
- The system should support Buddhist storyboards for arrange-discuss-reflect activities.
- The system must require educator review before generated visuals are used in class.

### Live Facilitation Copilot

- The system should support quick educator-facing suggestions during class in a later release.
- The system should generate short backup activities, discussion prompts, transitions, and debrief questions.
- The system must not be positioned as an unsupervised student-facing agent for MVP.

### Reflection Circle Assistant

- The system should support post-class voice debriefs in a later release.
- The system should extract what worked, what students struggled with, and what to follow up on.
- The system should convert debriefs into planning context for future lessons.

## 9. Non-Functional Requirements

### Quality

- Generated lesson plans should be understandable to educators without curriculum design training.
- Generated activities should be feasible for a class of four students.
- Outputs should use age-appropriate language for 13-year-old students.
- Generated plans should be editable and easy to scan.

### Safety And Trust

- Educators must remain in control of what is taught.
- Student-facing materials must be reviewed before use.
- The product must handle religious content respectfully.
- The product must avoid unsupported claims about Buddhist doctrine.
- The product must avoid direct unsupervised interactions with minors in MVP.

### Accessibility

- Voice planning should support educators who prefer speaking to typing.
- Printable materials should use clear text and classroom-friendly layouts.
- Visual outputs should avoid clutter and should be legible when printed.

### Performance

- A standard lesson plan should be generated in under 2 minutes.
- A complete lesson plan plus visual material suggestions should be generated in under 5 minutes.
- The educator should be able to reach a usable lesson draft in under 10 minutes.

## 10. AI Capability Mapping

### GPT Realtime 2

GPT Realtime 2 should power voice-based educator experiences:

- voice lesson planning interview
- educator rehearsal coach
- educator-facing live facilitation copilot
- post-class reflection debrief

Realtime voice is most valuable where the educator is thinking aloud, practicing, or responding to classroom conditions.

### GPT Image 2

GPT Image 2 should power classroom material generation:

- lesson visual packs
- story cards
- scene illustrations
- reflection worksheets
- classroom posters
- play-based game assets
- Buddhist storyboards

Image generation is most valuable where the educator would otherwise need design time, illustration skill, or printable material preparation.

## 11. Content And Pedagogy Requirements

### Tradition Focus

The MVP must focus on Chinese Mahayana folk Buddhism. It should acknowledge that Buddhism has many forms and avoid generalizing across traditions.

### Age Appropriateness

Lessons should be designed for 13-year-old students. Content should avoid overly abstract, moralizing, or adult-oriented framing. It should connect teachings to daily life.

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

## 12. Example Generated Lesson Output

### Lesson Topic

Compassion in daily life.

### Teaching Anchor

Guanyin Bodhisattva as a symbol of noticing suffering and responding with care.

### Student Application

How to respond when a classmate is excluded, teased, or upset.

### Activities

- Opening check-in: students choose from scenario cards showing everyday conflicts.
- Main activity: students role-play a school conflict and test different responses.
- Self-directed task: each student creates a "compassion mission" for the week.
- Reflection: students answer, "What suffering did I notice? What helpful response could I choose?"
- Visual material: four comic-style panels showing a student choosing compassion during a school conflict.

## 13. Success Metrics

### Activation Metrics

- Percentage of educators who generate their first lesson plan.
- Percentage of educators who edit and save a generated lesson.
- Percentage of educators who generate a visual material pack.
- Percentage of educators who use voice planning or rehearsal.

### Engagement Metrics

- Number of lesson plans generated per educator per month.
- Number of lesson plans reused or adapted.
- Number of visual materials generated per lesson.
- Frequency of rehearsal coach usage before class.

### Outcome Metrics

- Educators can create a usable lesson plan in under 10 minutes.
- Weekly preparation time is reduced by at least 50%.
- Educators rate generated lessons as useful or very useful.
- Educators report increased confidence using self-directed learning.
- Students can explain how a Buddhist teaching applies to daily life.

### Quality Metrics

- Percentage of generated lessons approved by educators without major rewrite.
- Percentage of generated activities rated feasible for a class of four.
- Percentage of generated visuals rated culturally appropriate by educators.
- Number of content accuracy or sensitivity issues reported.

## 14. Risks And Mitigations

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

## 15. Rollout Plan

### Phase 1: Preparation MVP

- Weekly lesson plan generator.
- Editable lesson output.
- Play-based activity generator.
- Scaffolded self-directed learning activities.
- Voice-based lesson planning interview.
- Educator rehearsal coach.
- Printable visual material generation.
- Illustrated reflection worksheets.

### Phase 2: Source And Quality Layer

- Curated Chinese Mahayana folk Buddhism content library.
- Source-aware lesson generation.
- Festival-based lesson packs.
- Reusable lesson templates.
- Educator ratings and feedback loop.

### Phase 3: Class Memory And Live Support

- Post-class voice debriefs.
- Reflection circle assistant.
- Multi-week class memory.
- Educator-facing live facilitation copilot.
- Multi-week curriculum planning.

### Phase 4: Expansion

- Additional Buddhist traditions.
- Other subjects such as values education, culture, history, language learning, and character education.
- Organization-level curriculum management.

## 16. Open Questions

- Which Chinese Mahayana folk Buddhist sources should be included in the first curated library?
- Should the first version support English only, or English plus Chinese terms and explanations?
- What level of source citation is expected by educators or temple leaders?
- How much control should educators have over image style presets?
- Should visual generation avoid sacred figures in MVP, or support them with stricter review?
- What consent and privacy requirements apply if educator voice notes or class debriefs mention students?
- What is the minimum viable export format: Markdown, PDF, Google Docs, printable worksheet, or slide deck?
- Should the product be designed first for individual educators or temple education coordinators?

## 17. Launch Criteria

- Educators can generate and edit a full lesson plan in under 10 minutes.
- Generated lessons consistently include play-based and scaffolded self-directed learning components.
- Educators can generate at least one useful visual or printable material per lesson.
- Rehearsal coach produces realistic student questions and helpful simplifications.
- Content is clearly labeled as focused on Chinese Mahayana folk Buddhism.
- Educator review is built into the workflow before classroom use.
- No direct unsupervised student-agent interaction is available in MVP.
