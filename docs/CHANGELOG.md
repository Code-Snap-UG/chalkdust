# Changelog

An append-only timeline of completed phases and significant milestones. Entries are listed newest-first. When a planning phase is closed, add an entry here before archiving the plan file.

---

## 2026-03-05 — Class-Specific Snippet Favorites (Work Stream 1)

Teachers can now mark snippets as favorites for specific classes. The snippet library gains a star toggle on every card — a direct toggle when in class context (`?classGroupId=`), or a lazy-loading popover with per-class checkboxes in the global view. The class detail page shows a "Bausteine" section with the class's favorited snippets and a link to the filtered library. No DB migrations were needed; `snippet_class_favorites` was already in the schema. See [`features/snippets.md`](./features/snippets.md) and [`planning/phase-0-1/phase-0-and-phase-1.md`](./planning/phase-0-1/phase-0-and-phase-1.md).

---

## 2026-03-05 — Manual Lesson Plan Creation

Added the ability for teachers to create lesson plans from scratch without AI assistance. The class dashboard now offers explicit "Create with AI" and "Create manually" entry points. Blank plans use the same block structure as AI-generated ones.

---

## 2026-03-04 — Inline Block Editing & Drag-to-Reorder

Teachers can now edit individual lesson plan blocks inline without triggering a full AI regeneration. Drag-to-reorder allows resequencing timeline phases directly in the plan view. See [`planning/phase-0-1/sub/lesson-plan-block-editing.md`](./planning/phase-0-1/sub/lesson-plan-block-editing.md).

---

## 2026-03-04 — End-of-Year Transition Flow

Completed the full Close School Year flow: split-view transition page, AI-generated summary (Jahresrückschau, Stärken, Förderbedarf), atomic save-and-archive, and injection of the transition summary into AI lesson planning context for successor classes. See [`features/end-of-year-transition.md`](./features/end-of-year-transition.md).

---

## 2026-03-03 — Phase 0 Audit & Phase 1 Plan

Completed the Phase 0 foundation audit. All core features confirmed production-quality. Phase 1 plan (snippet loop) documented. See [`planning/phase-0-1/phase-0-and-phase-1.md`](./planning/phase-0-1/phase-0-and-phase-1.md).

---

## 2026-02-28 — Lesson Snippets (Phase 1 foundation)

Introduced the Lesson Snippets feature: full CRUD, server actions, API routes, and snippet drawer UI in the lesson planner. Teachers can save, browse, and insert reusable lesson phases. See [`features/snippets.md`](./features/snippets.md).

---

## 2026-02-26 — Curriculum Extraction & Context Pipeline

Implemented the two-phase curriculum and context pipeline: PDF upload → AI-structured extraction into `curriculumTopics`, and `assembleContext()` composing topic window + diary entries + predecessor transition summary into the lesson plan prompt. See [`architecture/curriculum-and-context-pipeline.md`](./architecture/curriculum-and-context-pipeline.md).

---

## 2026-02-26 — AI Lesson Planning (core)

Shipped the core AI-assisted lesson planning feature: structured output via Vercel AI SDK, tool-use refinement loop, 8-layer system prompt, class diary context assembly, and the full planning UI (setup form → plan view → chat refinement). See [`features/lesson-planning.md`](./features/lesson-planning.md).
