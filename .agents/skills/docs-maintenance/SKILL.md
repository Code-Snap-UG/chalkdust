---
name: docs-maintenance
description: Maintain and update the Chalkdust project documentation. Use when the user asks to update docs, add a feature doc, write a planning phase, log a completion, document architecture, or asks "how do I document X" for the Chalkdust project.
---

# Chalkdust Docs Maintenance

## Structure

```
docs/
├── README.md          — master index + conventions reference
├── VISION.md          — north star (append-only, never shrink)
├── CHANGELOG.md       — completion timeline (append-only, newest-first)
├── architecture/      — cross-cutting technical systems
├── features/          — current state of every built feature
└── planning/          — forward-looking backlog (phase plans)
```

## Decision: which directory?

| What you're documenting | Where it goes |
|---|---|
| Product vision, future feature ideas | `VISION.md` |
| A completed phase or milestone | `CHANGELOG.md` entry |
| A data pipeline, infra pattern, cross-feature system | `architecture/` |
| A built or partially-built feature (current state) | `features/` |
| A new phase plan / backlog item | `planning/` |

## Front-matter (required on all feature + architecture docs)

Add this block directly below the H1 title:

```md
> **Status:** built | partial | planned
> **Created:** YYYY-MM-DD
> **Updated:** YYYY-MM-DD
```

- `built` — fully implemented, no outstanding roadmap items in current phase
- `partial` — core built; has a `### Roadmap` section with planned extensions
- `planned` — documented but not yet implemented

Always update the `Updated` date when editing a doc.

## Adding a feature doc

1. Create `docs/features/<feature-name>.md`
2. Add front-matter header
3. Structure: Feature Summary → Domain Model → UX Flow → API/Server Action contracts → `### Roadmap` (anything not yet built)
4. Add a row to `docs/features/README.md` status table

## Adding an architecture doc

1. Create `docs/architecture/<system-name>.md`
2. Add front-matter header
3. Add a row to `docs/architecture/README.md`

## Adding a planning doc

1. Create `docs/planning/<phase-name>/` directory with a plan file inside
2. Structure: goal summary → work streams → cross-cutting concerns → success criteria (checkboxes)
3. Add a row to `docs/planning/README.md` active plans table with status `Active`

## CHANGELOG entry format

```md
## YYYY-MM-DD — Phase or Feature Name
Brief description of what was completed. Link to the relevant planning doc or feature doc.
```

Add entries at the top of the list (newest-first). Write one entry per completed phase or significant shipped feature.

## Closing a planning phase

When a phase is done:
1. Mark the plan file's `Status` as `Complete` with the completion date
2. Add a CHANGELOG entry linking to the plan file
3. Update status in `docs/planning/README.md` table
4. Update the relevant feature doc(s): bump `Updated` date, change `Status` if appropriate
5. Update implementation status fields in `VISION.md` for anything newly shipped

## Updating an existing feature doc

- Update the `Updated` date in the front-matter
- Keep past decisions intact — do not delete existing sections
- Add new sections below existing ones; label anything not yet built with `### Roadmap`
- If status changes (e.g. partial → built), update the front-matter and the `docs/features/README.md` table
