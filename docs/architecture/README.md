# Architecture

This directory documents the **cross-cutting technical architecture** of Chalkdust — the systems, pipelines, and infrastructure decisions that span multiple features. It is not the right place for feature-specific domain models or UX flows; those live in [`../features/`](../features/).

---

## Scope

An architecture doc belongs here if it describes:

- A data pipeline shared by multiple features (e.g. context assembly fed into AI lesson planning, snippet matching, and end-of-year transition)
- A foundational infrastructure decision (e.g. how structured LLM output is validated, how PDF extraction works)
- A pattern used consistently across the codebase (e.g. server action conventions, error handling strategy)

If a design decision is isolated to a single feature, document it in that feature's file under `features/`.

---

## Documents

| File | Covers |
|---|---|
| [`authentication.md`](./authentication.md) | Complete Clerk auth workflow: middleware route protection, `getCurrentTeacherId()` with all edge cases (fast path, provision path, email-match backfill, concurrent insert race, Clerk 404 on fresh sign-up), webhook teacher provisioning, and error surface. |
| [`curriculum-and-context-pipeline.md`](./curriculum-and-context-pipeline.md) | Two-phase pipeline: PDF → curriculum topic extraction at upload time, and `assembleContext()` composing topic window + diary entries + transition summary per request. |

---

## Adding a new architecture doc

1. Create a file named after the system or pattern (e.g. `server-action-conventions.md`).
2. Add the front-matter metadata block below the H1 title:
   ```md
   > **Status:** built | partial | planned
   > **Created:** YYYY-MM-DD
   > **Updated:** YYYY-MM-DD
   ```
3. Add a row to the table above.
