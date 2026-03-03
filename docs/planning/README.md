# Planning Backlog

This directory is the planning backlog for Chalkdust. Each file here is a standalone technical plan for a phase or feature set — detailed enough to start implementation from, but written to be updated as reality diverges from the plan.

Think of it as the space between the north-star vision (in [`../VISION.md`](../VISION.md)) and the actual code. The vision describes *what* we're building and *why*. Plans in this directory describe *how* and *in what order*.

---

## What lives here

| File | Covers | Status |
|---|---|---|
| [`phase-0-and-phase-1.md`](./phase-0-and-phase-1.md) | Foundation audit + complete snippet loop | Active |

---

## How to use this

- **Before starting a phase**: Read the relevant plan file end to end. The dependency graph and sequence recommendations matter.
- **While building**: Update the success criteria checkboxes as work completes. Add notes under each section if the approach changed.
- **After completing a phase**: Mark the file's status in the table above as `Complete`, note the completion date, and add any carry-forward items as a section at the bottom of the file.
- **Adding new plans**: Create a new file per phase or per major feature. Follow the same structure: goal summary → work streams → cross-cutting concerns → success criteria.

---

## Relationship to other docs

- [`../VISION.md`](../VISION.md) — the north star. Feature specs, data models, and implementation phase overview. Update implementation status fields there when things get built.
- [`../features/`](../features/) — per-feature architecture deep-dives. These are the source of truth for domain models, API contracts, and design decisions.
- [`../architecture/`](../architecture/) — cross-cutting technical architecture (context pipeline, data flow, etc.).
