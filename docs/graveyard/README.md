# Feature Graveyard

Features that were designed, documented, and then decided against — at least for now. Nothing here is deleted; it is preserved so the thinking is not lost and the decision can be revisited.

---

## What belongs here

A feature lands in the graveyard when:

- It was designed and documented but a deliberate decision was made not to build it.
- It may be revisited in a future phase; it is not necessarily rejected forever.
- Building it now would add complexity that is not worth the current benefit.

Features that are simply not yet started live in `planning/` as part of an active plan. Features move here only when a positive decision is made to defer or drop them.

---

## Graveyard index

| File | Feature | Source | Reason | Date |
|---|---|---|---|---|
| [`plug-and-play-lesson-planner.md`](./plug-and-play-lesson-planner.md) | Plug-and-play snippets in lesson planner | Phase 1, Work Stream 2 | Complexity not justified at current scale | 2026-03-05 |
| [`ai-snippet-matching.md`](./ai-snippet-matching.md) | AI-suggested snippet matching | Phase 1, Work Stream 3 | Premature optimisation; requires a large snippet library to be useful | 2026-03-05 |

---

## How to add an entry

1. Create `docs/graveyard/<feature-name>.md` using the template below.
2. Add a row to the table above.
3. In the source planning doc, replace the feature's section with a short note pointing here and mark it `WILL NOT IMPLEMENT` in any status table.

### Template

```md
# Feature: <name>

> **Status:** will-not-implement
> **Source:** <planning doc + section>
> **Graveyarded:** YYYY-MM-DD
> **Reason:** <one sentence>

## Why this was set aside

<2–4 sentences on the reasoning.>

## Original design

<Paste the full original design here, unchanged.>
```
