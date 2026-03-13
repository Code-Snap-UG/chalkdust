# Features

This directory documents the **current state of every built feature** in Chalkdust. Each file describes what exists in the codebase right now: the domain model, UX flow, API contracts, and key design decisions. Sections labeled `### Roadmap` describe planned extensions that are not yet built.

For the full product vision and future feature ideas, see [`../VISION.md`](../VISION.md). For active implementation plans, see [`../planning/`](../planning/).

---

## Feature status

| Feature | Status | Doc |
|---|---|---|
| AI-Assisted Lesson Planning | partial | [`lesson-planning.md`](./lesson-planning.md) |
| Lesson Series (Reihenplanung) | partial | [`lesson-series.md`](./lesson-series.md) |
| Lesson Snippets | partial | [`snippets.md`](./snippets.md) |
| End-of-Year Transition | built | [`end-of-year-transition.md`](./end-of-year-transition.md) |
| Lesson Plan Lifecycle | partial | [`lesson-plan-lifecycle.md`](./lesson-plan-lifecycle.md) |

**Status key:**
- **built** — fully implemented; no significant roadmap items outstanding in the current phase.
- **partial** — core is implemented and working; roadmap sections document planned extensions.
- **planned** — documented but not yet implemented.

---

## Adding a new feature doc

1. Create a file named after the feature (e.g. `exam-generator.md`).
2. Add the front-matter metadata block below the H1 title:
   ```md
   > **Status:** built | partial | planned
   > **Created:** YYYY-MM-DD
   > **Updated:** YYYY-MM-DD
   ```
3. Add a row to the status table above.
4. Structure the doc with at minimum: a feature summary, the domain model, the UX flow, and API/server action contracts. Add a `### Roadmap` section for anything not yet built.
