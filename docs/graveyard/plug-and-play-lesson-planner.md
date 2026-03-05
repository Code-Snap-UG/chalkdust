# Feature: Plug-and-Play Snippets in the Lesson Planner

> **Status:** will-not-implement
> **Source:** [`planning/phase-0-1/phase-0-and-phase-1.md`](../planning/phase-0-1/phase-0-and-phase-1.md) — Phase 1, Work Stream 2
> **Graveyarded:** 2026-03-05
> **Reason:** The UX complexity (two interaction modes, pinning state, prompt injection) is not justified until teachers have built a meaningful snippet library and demonstrated demand for direct reuse in planning.

## Why this was set aside

The feature is well-specified and technically sound, but it assumes a workflow habit — saving snippets and then deliberately pulling them back into new plans — that most teachers will not have yet. Building a rich pre-generation pinning UX and post-generation insert flow before that habit exists adds significant UI surface area for a workflow that may never be used. Revisit when snippet library adoption data shows teachers regularly saving and re-browsing their library.

---

## Original design

### Work Stream 2: Plug-and-Play in the Lesson Planner

**Estimated scope:** Medium — new panel component in the planner, prompt changes, two interaction modes (pre-generation pin vs. post-generation insert).

**Dependency:** Work Stream 1 (class favorites) should be complete first so class favorites are available in the panel.

#### What it is

A "From your snippets" panel embedded in the lesson planning interface (`/classes/:id/plan`). The teacher can browse snippets, filter them, and either pin them before generation (the AI builds the plan around the fixed block) or insert them into an already-generated plan.

#### UI Layout

The existing planning page has:
- Left panel: structured form (date, duration, topic, notes, "Generate" button)
- Right panel: plan view + chat

The snippets panel fits below the structured form on the left side as a collapsible section: **"Use a saved snippet"**. Default state: collapsed. When expanded, it shows:

- Phase filter tabs: `All` | `Einstieg` | `Erarbeitung` | `Sicherung` | `Abschluss`
- A "Class favorites only" toggle (defaults ON when in class context)
- Compact snippet cards: title, phase badge, duration pill, method label
- An "Add to plan" button on each card

Snippet panel is approximately 300px tall, scrollable. If no snippets match the current filters, show: "No snippets saved yet. Go to the snippet library to create some."

#### Interaction Mode A: Pre-Generation Pinning

Before the teacher has generated a plan (form filled but "Generate" not yet clicked), clicking "Add to plan" on a snippet moves it to a "Pinned Snippets" list that appears between the form and the "Generate" button:

```
[ Date, Topic, Duration, Notes fields ]

Pinned snippets:
  ┌──────────────────────────────────────────┐
  │ [Einstieg] Würfelspiel — 10 min          │  [✕ Remove]
  └──────────────────────────────────────────┘

[ Generate Lesson Plan ]
```

Multiple snippets can be pinned (one per phase type maximum — if the teacher pins two Einstieg snippets, show a warning and replace the previous one).

When "Generate" is clicked with pinned snippets, include them in the generation prompt as fixed constraints:

```
## Vorgegebene Phasen (unverändert übernehmen)

Die folgenden Phasen wurden vom Lehrer aus seiner Snippets-Bibliothek ausgewählt
und müssen unverändert in den Stundenablauf übernommen werden.
Baue den Rest der Stunde um diese Phasen herum auf:

- [Einstieg, 10 min] "Würfelspiel": Schüler würfeln in Paaren. Jede Zahl entspricht
  einer Frage zum Thema der letzten Stunde. Wer richtig antwortet, behält den Würfel.
  Methode: Partnerarbeit
```

The AI generates all non-pinned phases freely and slots the pinned phases in at the appropriate position in the timeline. Post-generation, pinned phases appear visually distinct in the plan view (e.g., a small "📌 From your library" label).

#### Interaction Mode B: Post-Generation Insert

After a plan has been generated, clicking "Add to plan" on a snippet opens a small inline dialog:

```
Insert "Würfelspiel" as which phase?

○ Replace Einstieg (currently: 5 min warm-up)
○ Insert before Einstieg
○ Insert after Einstieg
○ Insert before Erarbeitung
○ Insert after Erarbeitung
...

[ Cancel ]  [ Insert ]
```

On confirm, call the existing `add_timeline_phase` tool (or `update_timeline_phase` if replacing) with the snippet's content pre-filled as the phase data. The chat log shows the insertion as an AI action: "Einstieg replaced with 'Würfelspiel' from your library."

#### Server-Side Changes

In the plan generation API route (or wherever `generateObject` is called for initial generation):

- Accept an optional `pinnedSnippets: { snippetId: string, phase: string, durationMinutes: number, description: string, method: string }[]` in the request body
- When present, inject the "Vorgegebene Phasen" section into the system prompt before calling the LLM
- After generation, validate that the returned plan actually contains the pinned phases (same phase type, similar duration); if not, retry with a correction prompt

Optionally: store which `snippetId`s were used in a plan by adding an optional `sourceSnippetId` field to each object in the `timeline` JSONB array. This requires no schema migration (JSONB is flexible) but enables future analytics ("how often do teachers use their own snippets?").

#### Success Criteria (original)

- [ ] "From your snippets" collapsible panel is present in the lesson planner
- [ ] Panel respects phase filter tabs and class favorites toggle
- [ ] Teacher can pin one or more snippets before generating a plan
- [ ] Generated plan contains the pinned snippet(s) as fixed phases
- [ ] Pinned phases are visually labeled in the plan view
- [ ] Teacher can insert a snippet into an already-generated plan via a phase picker
- [ ] Post-insert plan reflects the change immediately (optimistic or tool-confirmed)
