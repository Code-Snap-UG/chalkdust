# Chalkdust — Documentation

This directory is the single source of truth for everything about how Chalkdust is designed, what it does, and where it is going. It is structured so that both humans and AI agents can navigate it quickly and keep it up to date.

---

## Directories

| Path | Purpose |
|---|---|
| [`VISION.md`](./VISION.md) | North star — the full product vision, feature specs, data model, and implementation phase map. Append-only; never shrink it. |
| [`CHANGELOG.md`](./CHANGELOG.md) | Append-only timeline of completed phases and significant milestones. One entry per phase or major feature shipped. |
| [`architecture/`](./architecture/) | Cross-cutting technical architecture: data flows, pipelines, infrastructure decisions. Not feature-specific. |
| [`features/`](./features/) | Current state of every built feature — domain model, UX flow, API contracts, design decisions. Future sections are clearly labeled `### Roadmap`. |
| [`planning/`](./planning/) | Forward-looking backlog. Each file is a phase plan with checkboxes. When a phase completes, it gets a `CHANGELOG.md` entry. |

---

## Conventions

### Front-matter on feature and architecture docs

Every file in `features/` and `architecture/` carries a metadata block directly below the H1 title:

```md
> **Status:** built | partial | planned
> **Created:** YYYY-MM-DD
> **Updated:** YYYY-MM-DD
```

- **built** — fully implemented and in production.
- **partial** — core is built; roadmap sections remain.
- **planned** — documented but not yet implemented.

When making changes to a feature doc, update the `Updated` date.

### CHANGELOG entries

```md
## YYYY-MM-DD — Phase or Feature Name
Brief description of what was completed. Link to the relevant planning doc.
```

Entries are listed newest-first.

### Planning lifecycle

```
active → done → CHANGELOG entry added
```

See [`planning/README.md`](./planning/README.md) for full lifecycle conventions.

---

## Who maintains this

These docs are maintained jointly by the author and AI agents working in this repository. The conventions above exist specifically so that an AI agent can read any file, understand its status, and update it without ambiguity.
