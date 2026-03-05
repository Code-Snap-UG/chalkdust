# Planning Backlog

This directory is the implementation backlog for Chalkdust — the bridge between the north-star vision ([`../VISION.md`](../VISION.md)) and actual code. Each file is a standalone technical plan for a phase or feature set, detailed enough to start implementation from and written to be updated as reality diverges from the plan.

---

## Active plans

| File | Covers | Status |
|---|---|---|
| [`phase-0-1/phase-0-and-phase-1.md`](./phase-0-1/phase-0-and-phase-1.md) | Foundation audit + complete snippet loop | Active |

---

## How to use this

- **Before starting a phase** — Read the relevant plan end to end. The dependency graph and sequence recommendations matter.
- **While building** — Update the success criteria checkboxes as work completes. Add notes under each section if the approach changed.
- **After completing a phase** — Follow the lifecycle below.
- **Adding new plans** — Create a new file per phase or major feature. Follow the same structure: goal summary → work streams → cross-cutting concerns → success criteria.

---

## Plan lifecycle

```
active → done → CHANGELOG entry added
```

When a plan is complete:

1. Mark the plan file's `Status` field as `Complete` and add the completion date.
2. Add an entry to [`../CHANGELOG.md`](../CHANGELOG.md) summarising what was shipped. Link back to the plan file.
3. Update the status in the table above.
4. If there are carry-forward items, either add them as a section at the bottom of the completed plan file or create a new plan file for the next phase.

---

## Relationship to other docs

- [`../VISION.md`](../VISION.md) — the north star. Feature specs, data models, and implementation phase overview. Update implementation status fields there when things get built.
- [`../features/`](../features/) — per-feature architecture deep-dives. These are the source of truth for domain models, API contracts, and design decisions. Update them as features are built or extended.
- [`../architecture/`](../architecture/) — cross-cutting technical architecture (context pipeline, data flow, etc.).
- [`../CHANGELOG.md`](../CHANGELOG.md) — the completion timeline. Every closed plan produces one entry here.
