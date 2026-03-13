# Lesson Plan Lifecycle

> **Status:** partial
> **Created:** 2026-03-12
> **Updated:** 2026-03-12

## Overview

This document maps the current lifecycle of a lesson plan — from creation to post-lesson reflection — across the three entities that carry state: `LessonPlan`, `DiaryEntry`, and `ClassGroup`. It is intentionally descriptive rather than prescriptive: the goal is to make the current mechanics visible so they can be critiqued and improved.

---

## State machines

### LessonPlan.status

```mermaid
stateDiagram-v2
    [*] --> draft : created (AI-generated or blank)
    draft --> approved : teacher clicks "Speichern / Approve"\n→ DiaryEntry auto-created (progressStatus: planned)
    draft --> draft : teacher edits content\n(inline blocks, AI chat refinement)
```

**Values:** `draft` · `approved`

The `draft` state is the only active editing state. Both AI-assisted and manually created plans start here. A plan remains `draft` indefinitely until the teacher explicitly approves it. There is no status that represents "being taught" or "already taught" — that information is carried entirely by the linked `DiaryEntry`.

---

### DiaryEntry.progressStatus

```mermaid
stateDiagram-v2
    [*] --> planned : auto-created when LessonPlan is approved
    planned --> completed : teacher marks lesson as taught
    planned --> partial : teacher marks lesson as partially completed
    planned --> deviated : teacher marks lesson as significantly changed
    completed --> [*]
    partial --> [*]
    deviated --> [*]
```

**Values:** `planned` · `completed` · `partial` · `deviated`

A `DiaryEntry` is created automatically when a `LessonPlan` is approved. At this point the `plannedSummary` is serialised from the plan's topic and timeline. The teacher later updates the entry after the lesson, setting `actualSummary`, `teacherNotes`, and the final `progressStatus`.

---

### ClassGroup.status

```mermaid
stateDiagram-v2
    [*] --> active : teacher creates a class group
    active --> archived : teacher closes the school year\n(optional: LLM writes transition summary first)
    archived --> [*]
```

**Values:** `active` · `archived`

Archived groups are read-only. They remain fully accessible for reference and for feeding predecessor context into a successor class group.

---

## Combined flow

The diagram below shows how the three state machines interact across the full lifecycle of a single lesson.

```mermaid
flowchart TD
    subgraph Creation
        A1["Teacher opens /classes/:id/plan\n(AI-assisted)"] --> B1["LLM generates plan\nLessonPlan: draft"]
        A2["Teacher opens /classes/:id/plan/blank\n(manual)"] --> B1
    end

    subgraph Editing["Editing (can loop)"]
        B1 --> C1["Teacher refines via chat or\nedits blocks directly"]
        C1 --> B1
    end

    subgraph Commit
        C1 --> D1["Teacher approves plan\nLessonPlan: draft → approved"]
        D1 --> D2["DiaryEntry auto-created\nprogressStatus: planned\nplannedSummary: serialised from plan"]
    end

    subgraph PostLesson["Post-Lesson (after lesson date)"]
        D2 --> E1["Teacher annotates diary entry"]
        E1 --> E2["completed"]
        E1 --> E3["partial"]
        E1 --> E4["deviated"]
    end

    subgraph EndOfYear
        E2 & E3 & E4 --> F1["All lessons concluded\nTeacher closes school year"]
        F1 --> F2["(optional) LLM generates\ntransition summary"]
        F2 --> F3["ClassGroup: active → archived"]
    end
```

---

## Problems with the current lifecycle

### 1. `draft` / `approved` is a thin and misleading split

"Approved" does not mean the lesson was taught or even scheduled — it just means the teacher saved the plan and committed to using it. In practice, a plan stays `draft` while the teacher tinkers in AI chat, then flips to `approved` when they are done. The word "approved" has connotations of a formal sign-off that do not match the teacher's mental model ("I'm done editing this, move on").

### 2. No status for "taught"

The `LessonPlan` entity has no way to express that the associated lesson has been delivered. That information lives only in `DiaryEntry.progressStatus`. This means:

- A lesson plan and its diary entry are in separate state machines that must be cross-referenced to understand the true state of a lesson.
- Queries like "show me all lessons I have already taught" require a JOIN and filter on `DiaryEntry.progressStatus`, not on `LessonPlan.status`.

### 3. `draft` plans without a diary entry are invisible in the diary

A `draft` plan has no diary entry. If the teacher creates a plan, leaves it in `draft`, and the lesson date passes, the lesson simply does not appear in the diary. There is no warning, no orphan indicator.

### 4. The approval → diary-creation coupling is a side effect

Creating a `DiaryEntry` is a hidden side effect of calling `approveLessonPlan()`. This is opaque to the teacher — there is no moment where the diary entry creation is confirmed or visible before it happens.

### 5. No "cancelled" or "skipped" state

If the teacher decides not to teach a planned lesson (school closed, topic dropped), there is no way to mark it as cancelled. The plan stays `approved` and the diary entry stays `planned` forever, polluting the diary with ghost entries.

---

## Observations for redesign

These are open questions — not decisions. The purpose of this document is to surface the tensions, not resolve them.

- Should `LessonPlan` status track the editorial lifecycle (draft → ready) and `DiaryEntry` track the delivery lifecycle (upcoming → taught)? Or should one entity own both?
- Should approval be renamed to something that reflects teacher intent rather than a formal gate (e.g., "committed", "ready", "filed")?
- Should a `cancelled` / `skipped` terminal state exist on the diary entry?
- Should `draft` plans show up in the diary as "unconfirmed" entries to prevent silent gaps?
- Is `DiaryEntry` the right place to track post-lesson state, or should it be folded back into `LessonPlan` (with lesson plan owning the full lifecycle from creation to reflection)?
