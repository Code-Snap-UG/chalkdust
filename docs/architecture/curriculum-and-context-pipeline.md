# Curriculum & Context Pipeline

> **Status:** built
> **Created:** 2026-02-26
> **Updated:** 2026-03-05

This document describes how an uploaded curriculum document is processed, stored, and ultimately used to inform AI-generated lesson plans.

---

## Overview

The pipeline has two distinct, decoupled phases:

1. **Extraction** — a one-time, upload-time step that converts the raw curriculum PDF into a structured topic list.
2. **Context assembly** — a per-request step that composes a lean, focused prompt context from the stored topic list (never from the raw file).

---

## Phase 1: Curriculum Extraction (upload-time)

**Route:** `POST /api/curriculum/upload`  
**Source:** `src/app/api/curriculum/upload/route.ts`

### Steps

1. **File ingestion** — The uploaded PDF is saved to `public/uploads/curricula/` and its text is extracted using `pdf-parse`.

2. **Truncation** — The raw extracted text is capped at **30,000 characters** before being sent to the model. This guards against token limits on very large documents.

3. **AI extraction** — The truncated text is passed to the high-tier model (`gpt-4o` / `claude-sonnet`) with `curriculumExtractionPrompt` as the system prompt. The model is instructed to identify all teaching topics and return them as structured data via `generateObject`.

   The extraction schema (`curriculumTopicExtractionSchema`) expects each topic to have:
   - `title` — a short, descriptive name
   - `description` — what students are meant to learn
   - `competencyArea` — the overarching area (e.g. "Zahlen und Operationen")

4. **Persistence** — `saveCurriculum()` in `src/lib/actions/curriculum.ts` writes two things to the database:
   - The **full raw text** (`parsedContent`) is stored in the `curricula` row — for reference only; it is never read back into prompts.
   - The **extracted topic list** is stored both as a JSON blob (`topicIndex` on `curricula`) and as individual rows in the `curriculumTopics` table, with an explicit `sortOrder`.

### Why extract rather than store raw?

- The raw document can be dozens of pages. Injecting that into every lesson-plan prompt would be expensive and noisy.
- The extraction step compresses the curriculum into a dense, machine-readable list of topics ordered by the logical flow of the school year.
- Individual topics can later be selected by the teacher in the UI, enabling fine-grained context windowing (see Phase 2).

---

## Phase 2: Context Assembly (per lesson-plan request)

**Function:** `assembleContext(classGroupId, selectedTopicId?)`  
**Source:** `src/lib/ai/context.ts`

This function builds the full context string that is prepended to every lesson-plan generation prompt. It queries the database and concatenates several sections, separated by `---`.

### Curriculum section

The behaviour depends on whether the teacher has selected a specific topic:

**With a selected topic (`selectedTopicId` provided):**  
A window of **3 topics** is sliced from the ordered `curriculumTopics` list — the topic immediately before, the selected topic itself, and the topic immediately after. Only these three are included.

```
## Kerncurriculum (relevanter Ausschnitt)

- **[prev topic title]**: [description] (Kompetenzbereich: [area])
- **[selected topic title]**: [description] (Kompetenzbereich: [area])
- **[next topic title]**: [description] (Kompetenzbereich: [area])
```

**Without a selected topic:**  
All extracted topics are included as a flat list (title + description only, no competency area).

```
## Kerncurriculum (Themenübersicht)

- **[topic title]**: [description]
- ...
```

### Other context sections

In addition to the curriculum excerpt, `assembleContext` appends:

- **Recent diary entries** — the last 10 diary entries for the class, providing a record of what was actually taught and at what pace.
- **Predecessor transition summary** — if the class group has a predecessor (previous year's class), any documented strengths, weaknesses, and transition summary are included.

### How context flows into the prompt

In `src/app/api/lesson-plans/generate/route.ts`, the assembled context is combined with the teacher's own inputs (topic free-text, learning goals, duration, notes) and wrapped into the final user prompt:

```
Erstelle einen Unterrichtsplan basierend auf folgendem Kontext:

[assembled context]

---

## Lehrerangaben
- Stundenlänge: ...
- Gewünschtes Thema: ...
- ...
```

This full prompt is then sent to the high-tier model with `planGenerationSystemPrompt` as the system prompt.

---

## Data flow summary

```
PDF upload
  │
  ├─ pdf-parse → raw text (stored as parsedContent, never re-used in prompts)
  │
  └─ AI extraction (high model, 30k char cap)
       │
       └─ structured topics → curriculumTopics table (title, description, competencyArea, sortOrder)
                                         │
                              assembleContext() (per lesson-plan request)
                                         │
                                         ├─ topic selected  → 3-topic window
                                         └─ no topic        → full topic list
                                                   │
                                         + recent diary entries (last 10)
                                         + predecessor transition info
                                                   │
                                         final user prompt → high model → lesson plan
```

---

## Key files

| File | Role |
|------|------|
| `src/app/api/curriculum/upload/route.ts` | Upload handler: PDF parsing, AI extraction, returns topics |
| `src/lib/actions/curriculum.ts` | DB persistence: saves `curricula` row + `curriculumTopics` rows |
| `src/lib/ai/prompts/curriculum-extraction.ts` | System prompt for the extraction call |
| `src/lib/ai/schemas.ts` | Zod schemas for both extracted topics and lesson plans |
| `src/lib/ai/context.ts` | Assembles the per-request prompt context from stored topics + diary |
| `src/app/api/lesson-plans/generate/route.ts` | Lesson plan generation: calls `assembleContext`, builds prompt, calls model |
| `src/lib/db/schema.ts` | DB tables: `curricula`, `curriculumTopics`, `lessonPlans`, `diaryEntries` |
