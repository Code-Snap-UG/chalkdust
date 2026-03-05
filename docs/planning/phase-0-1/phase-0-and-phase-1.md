# Phase 0 & Phase 1 — Technical Implementation Plan

**Status:** Active  
**Last updated:** March 2026  
**Source of truth:** [`../VISION.md`](../VISION.md) §12

---

## Overview

This plan covers two phases:

- **Phase 0 — Foundation** — Auditing and completing the current build. Most of Phase 0 is already done; this plan documents what's built, what the remaining gaps are, and the acceptance criteria before we consider Phase 0 closed.
- **Phase 1 — Complete the Snippet Loop** — Three work streams that turn the snippet system from a "save and browse" library into a genuinely integrated "save → organize → plug back in" workflow.

Phase 1 cannot fully benefit from clean context unless Phase 0's remaining gaps are closed. The end-of-year transition flow (the one significant unbuilt piece of Phase 0) feeds into the same context assembly that snippet matching relies on.

---

## Phase 0 — Foundation

### Goal

Confirm that every feature already described as "built" in VISION.md is actually production-quality and consistent, and close the two remaining gaps that are scoped to this phase.

---

### What's Already Built

The following is an itemized audit based on implementation status fields in VISION.md and the feature architecture docs.

#### Classes & Curriculum (Feature 1)

| Item | Status | Notes |
|---|---|---|
| ClassGroup CRUD | Built | `/classes`, `/classes/new`, `/classes/:id` |
| Curriculum PDF upload + AI extraction | Built | `pdf-parse` → LLM structured extraction |
| Curriculum topic review UI | Built | Teacher can edit, reorder, confirm extracted topics |
| Class detail hub (`/classes/:id`) | Built | Progress bar, stats, lesson timeline, upcoming plans |
| Predecessor linking schema | Built | `predecessorId` FK exists on `class_groups` |
| End-of-year "Close School Year" flow | Built | `CloseYearButton` dialog state machine; `POST /api/classes/[id]/transition` |
| Transition summary in AI context | Built | Layer 7 in `src/lib/ai/context.ts` |

#### AI Lesson Planning (Feature 2)

| Item | Status | Notes |
|---|---|---|
| Planning UI (form + plan view + chat) | Built | Split-panel interface on `/classes/:id/plan` |
| Structured output with Zod schema | Built | `generateObject` via Vercel AI SDK |
| Tool-use refinement | Built | `streamText` with 9 plan-editing tools |
| Context assembly (curriculum + diary + predecessor) | Built | `src/lib/ai/context.ts` — see architecture doc |
| Diary auto-creation on plan approval | Built | `progressStatus: "planned"` entry created |
| File upload to diary entries | Built | Materials with `source: "uploaded"` |
| AI observability traces | Built | `ai_traces` table |
| End-of-year transition context injection | Built | Predecessor summary injected in `assembleContext` |

#### Snippets (Feature 3, partial)

| Item | Status | Notes |
|---|---|---|
| DB tables (`lesson_snippets`, `snippet_class_favorites`) | Built | Schema already includes the favorites join table |
| Server actions (`createSnippet`, `getSnippets`, `getSnippet`) | Built | `src/lib/actions/snippets.ts` |
| API routes (`GET/POST /api/snippets`) | Built | `src/app/api/snippets/route.ts` |
| Save-from-plan dialog (`SaveSnippetDialog`) | Built | Bookmark icon on each timeline phase |
| Snippet library UI (`/snippets`) | Built | Grid view, tag filter, preview modal |
| Class favorites endpoints and UI | **NOT BUILT** | Phase 1, Work Stream 1 |
| Plug-and-play in lesson planner | **NOT BUILT** | Phase 1, Work Stream 2 |
| AI-suggested snippet matching | **NOT BUILT** | Phase 1, Work Stream 3 |

---

### Phase 0 Gap 1: End-of-Year Transition Flow — BUILT

**Status:** Complete. See [`docs/features/end-of-year-transition.md`](../features/end-of-year-transition.md) for the full architecture doc.

#### What was built

- **`CloseYearButton`** (`src/app/(dashboard)/classes/[id]/close-year-button.tsx`) — dialog-based state machine with six steps: `generating → editing → confirming → saving → done`. Gracefully degrades to an empty form if AI generation fails so the teacher can write manually.
- **`POST /api/classes/[id]/transition`** — fetches all taught diary entries, falls back to plan summaries for vague entries, calls the high-capability model via `tracedGenerateObject`, returns `{ summary, strengths, weaknesses }`.
- **`saveTransitionSummary` / `archiveClassGroup`** in `src/lib/actions/class-groups.ts` — saves transition fields and sets `status: "archived"`. Archive is guarded: refuses if `transitionSummary` is empty.
- **Successor pre-fill** — the "done" screen computes bumped grade, name, and school year and navigates to `/classes/new?name=...&grade=...&schoolYear=...&predecessorId=...`. The new class wizard reads these params as initial state.
- **Context injection** — layer 7 in `src/lib/ai/context.ts`: if `classGroup.predecessorId` is set, the predecessor's transition fields are appended as `## Vorjahr – Übergangsinformationen`.

#### Acceptance Criteria

- [x] "Close School Year" button is visible on active class detail pages
- [x] Clicking it triggers LLM generation and shows a loading state
- [x] The draft populates a three-section editable form (Jahresrückschau, Stärken, Förderbedarf)
- [x] Teacher can edit all three fields freely
- [x] Confirming archives the class (status = "archived"), preserving all data read-only
- [x] When a new class has a `predecessorId` set, the transition summary is included in lesson planning context
- [x] The context injection does not break planning for classes without a predecessor

---

### Phase 0 Gap 2: Known Limitations Accepted for Now

These are not gaps to close in Phase 0. They are documented here so the constraints are explicit.

**Hardcoded teacher ID**: All queries use a hardcoded teacher ID. This is intentional until Phase 2 (Authentication). No workarounds or partial auth should be added in Phase 0 or Phase 1 — a partial auth state is worse than a clean hardcode because it creates false security assumptions. The hardcoded ID should be the single obvious constant in one place (`src/lib/constants.ts` or similar), not scattered across query files.

**Local file storage**: Uploaded materials (curriculum PDFs, diary attachments) are stored on the local filesystem. This is fine for development and early testing. Not production-safe. Deferred to Phase 2 or Phase 3 when a deployment target is chosen (Vercel + R2 is the likely path).

---

### Phase 0 Success Criteria

Phase 0 is complete when:

- [x] End-of-year transition flow works end-to-end (generate → review → archive)
- [x] Transition summary feeds into lesson planning context for linked classes
- [ ] All existing features remain stable (no regressions)
- [ ] Hardcoded teacher ID is isolated to a single, clearly labeled constant
- [ ] No linter errors or TypeScript errors in the current codebase

---

## Phase 1 — Complete the Snippet Loop

### Goal

Phase 1 has one mission: turn snippets from a "save and browse" library into a "save → organize by class → plug directly into lesson planning → get AI-surfaced matches" workflow. Three independent but complementary work streams.

---

### Work Stream 1: Class-Specific Favorites

**Estimated scope:** Small — backend is one table (already exists), three new actions, one API route, UI additions to the snippet library and class detail pages.

#### What it is

The ability to mark a snippet as a favorite for a specific class. Not a copy — a lightweight pointer in `snippet_class_favorites`. A snippet can be a favorite for multiple classes at once. The class-specific view shows only the favorited snippets for that class.

#### Database

No migrations needed. The `snippet_class_favorites` table already exists:

```sql
-- Already in schema:
snippet_class_favorites (
  snippet_id      UUID NOT NULL REFERENCES lesson_snippets(id) ON DELETE CASCADE,
  class_group_id  UUID NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (snippet_id, class_group_id)
)
```

#### Server Actions

Add to `src/lib/actions/snippets.ts`:

```typescript
addClassFavorite(snippetId: string, classGroupId: string): Promise<void>
// INSERT INTO snippet_class_favorites (snippet_id, class_group_id)
// ON CONFLICT DO NOTHING — idempotent

removeClassFavorite(snippetId: string, classGroupId: string): Promise<void>
// DELETE FROM snippet_class_favorites
// WHERE snippet_id = $1 AND class_group_id = $2

getClassFavorites(classGroupId: string): Promise<LessonSnippet[]>
// SELECT lesson_snippets.* FROM lesson_snippets
// JOIN snippet_class_favorites ON lesson_snippets.id = snippet_id
// WHERE class_group_id = $1
// ORDER BY snippet_class_favorites.created_at DESC
```

Update `getSnippets(teacherId, filters?)`:
- Add `classGroupId?: string` to the filters object
- When `classGroupId` is provided, JOIN with `snippet_class_favorites` and filter to only favorited snippets for that class

#### API Routes

New route file `src/app/api/snippets/[id]/favorites/route.ts`:

```
POST   /api/snippets/:id/favorites
       Body: { classGroupId: string }
       → addClassFavorite(id, classGroupId)
       → 201 Created

DELETE /api/snippets/:id/favorites/:classGroupId
       → removeClassFavorite(id, classGroupId)
       → 204 No Content
```

Update `GET /api/snippets`:
- Add `?classGroupId=` query param support
- Delegates to `getSnippets(teacherId, { classGroupId })` when present

#### UI Changes

**Snippet library page (`/snippets`)**:

Each snippet card needs a "favorite for class" control:
- A star (⭐) icon in the top-right corner of each card
- When navigating from a class context (e.g. via `/classes/:id → Snippets`), the star is a filled/unfilled toggle showing whether the snippet is already favorited for that class
- When no class context is present, clicking the star opens a small popover: "Add to class favorites" with a dropdown of the teacher's active classes
- Star toggle calls `POST` or `DELETE /api/snippets/:id/favorites` with optimistic UI (instant toggle, revert on error)

Add a filter control to the library header:
- When a `classGroupId` is in context (URL param or navigation state), show a "Class Favorites" / "All Snippets" toggle
- Default to "Class Favorites" when arriving from a class context, default to "All Snippets" otherwise

**Class detail page (`/classes/:id`)**:
- Add a "Snippets" section or tab (alongside Diary, Curriculum, Planner)
- Shows a compact grid of class-favorited snippets (max 6, with "View all →" link to the filtered `/snippets?classGroupId=:id` view)
- "Browse snippet library →" link for adding new favorites
- Empty state: "No snippets saved for this class yet. Go to the snippet library to star some."

#### Data Flow

```
User clicks ★ on snippet card (in class context for class "5a")
  → Optimistic: star icon fills immediately
  → POST /api/snippets/:snippetId/favorites { classGroupId: "5a-uuid" }
  → addClassFavorite server action
  → INSERT INTO snippet_class_favorites
  → On success: confirm optimistic state
  → On error: revert star, show toast error
```

---

### Work Stream 2: Plug-and-Play in the Lesson Planner

**Estimated scope:** Medium — new panel component in the planner, prompt changes, two interaction modes (pre-generation pin vs. post-generation insert).

**Dependency:** Work Stream 1 should be complete first so class favorites are available in the panel.

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

---

### Work Stream 3: AI-Suggested Snippet Matching

**Estimated scope:** Medium — new API endpoint, lightweight secondary LLM call, UI suggestion chips in the plan view.

**Dependency:** Independent of Work Streams 1 and 2. Can be built in parallel.

#### What it is

After the AI generates a lesson plan, a secondary lightweight check compares the generated phases against the teacher's snippet library. If any generated phase closely matches a saved snippet (same phase type, similar method, similar topic), it surfaces a suggestion inline: "Your Einstieg looks similar to 'Würfelspiel'. Want to use it?"

This gradually shifts the teacher's workflow from "AI generates everything from scratch" toward "AI generates, I replace with my proven building blocks."

#### Implementation Approach

Three options considered:

| Option | Method | Latency impact | Semantic quality |
|---|---|---|---|
| A | Include snippets in initial prompt, ask LLM to self-match | +300-500ms, higher token cost | High |
| B | Deterministic rule matching on phase + method | 0ms | Low (misses paraphrasing) |
| C | Async post-generation fast-model check | ~0ms perceived (non-blocking) | High |

**Chosen: Option C** — async non-blocking post-generation check. The plan is returned to the teacher immediately; the snippet match check fires in parallel as a background task. Results are pushed to the UI via a state update (or polling) within ~1-2 seconds. This keeps plan generation latency completely unaffected.

#### API Route

New route `POST /api/snippets/match`:

```typescript
// Request body
{
  planPhases: {
    index: number,
    phase: string,         // "Einstieg" | "Erarbeitung" | etc.
    durationMinutes: number,
    description: string,
    method: string
  }[],
  teacherId: string
}

// Response
{
  matches: {
    planPhaseIndex: number,
    snippetId: string,
    snippetTitle: string,
    confidence: "high" | "medium",
    reasoning: string      // short explanation, e.g. "Same phase type and method, similar activity"
  }[]
}
```

The endpoint:

1. Fetches the teacher's snippets from the DB via `getSnippets(teacherId)`
2. If the teacher has fewer than 3 snippets, return `{ matches: [] }` immediately — not enough library to match against
3. Calls the fast LLM model with a structured matching prompt:

```
You are checking whether any of a teacher's saved lesson snippets match
phases in a newly generated lesson plan. Return ONLY high-confidence matches —
cases where a snippet is essentially the same activity as a generated phase.

Generated phases:
[...serialized phase list...]

Teacher's snippet library:
[...serialized snippet list, title + phase + method + description excerpt...]

Return a JSON array of matches. Only include matches with high or medium confidence.
An empty array is correct if nothing matches well.
```

4. Validates the response against a Zod schema
5. Returns the matches array

Only return matches where `confidence === "high" | "medium"`. Discard low-confidence matches entirely — false positives are more annoying than false negatives.

#### UI Changes

In the plan view, immediately after the plan is returned and rendered, fire the async match check. While the check is running, show nothing (no loading spinner — the teacher doesn't know this is happening yet).

When matches arrive, display a subtle suggestion strip between the plan header and the first phase:

```
┌─────────────────────────────────────────────────────────────┐
│ 💡 Matches from your library                                 │
│  [Einstieg] Würfelspiel Einstieg  →  Use it   Dismiss       │
│  [Sicherung] Kartenabfrage        →  Use it   Dismiss       │
└─────────────────────────────────────────────────────────────┘
```

Clicking "Use it":
- Fires the `update_timeline_phase` tool call with the snippet's content
- Removes the suggestion from the strip
- Shows a brief toast: "Phase replaced with 'Würfelspiel Einstieg' from your library"

Clicking "Dismiss":
- Removes just that suggestion from the strip
- Does not persist the dismissal (suggestions reappear if the plan is regenerated)

If all suggestions are dismissed or accepted, the strip disappears.

---

## Cross-Cutting Concerns

### Dependency Graph

```
Phase 0: End-of-year transition flow
  └── No dependencies (standalone)

Phase 1, Work Stream 1: Class favorites
  └── No dependencies (table already exists)

Phase 1, Work Stream 2: Plug-and-play
  └── Depends on: Work Stream 1 (class favorites data in panel)
  └── Depends on: Phase 0 transition flow being closed (not a hard dep, but clean context)

Phase 1, Work Stream 3: AI snippet matching
  └── No dependencies (parallel to Work Streams 1 and 2)
```

### Recommended Build Sequence

1. **Phase 0 gap closure first** — close the end-of-year transition flow. This is the only unbuilt piece that touches the context assembly pipeline that everything else builds on. It also unblocks the full "plan → teach → reflect → transition → reuse" loop that the product is built around.

2. **Work Stream 1 (class favorites) — backend first** — the database is ready; adding the three server actions and API routes is low-risk and unblocks the UI work.

3. **Work Stream 3 (AI matching) in parallel** — the matching endpoint is fully self-contained. While Work Stream 1's UI is being built, Work Stream 3 can be implemented and tested independently.

4. **Work Stream 1 UI** — snippet library star controls, class detail snippets section.

5. **Work Stream 2 (plug-and-play)** — requires Work Stream 1 to be complete (needs the class favorites data). The pre-generation pinning and post-generation insert are two separable sub-tasks that can ship sequentially.

### Error Handling

**Transition summary generation**: LLM calls can fail. The flow should degrade gracefully — if generation fails, show the empty form and let the teacher write the summary manually. Do not block the archive action on a successful LLM call.

**Snippet match check**: Non-blocking by design. If the endpoint times out or returns an error, the teacher sees no suggestions and no error message. Silent failure is correct here — the suggestion is a nice-to-have, not a core workflow.

**Favorite toggle**: Optimistic UI updates should revert on API error with a toast notification. The underlying action is simple enough that failures should be rare.

**Pinned snippets in generation**: If the AI fails to incorporate a pinned snippet (validation finds it missing), retry once with an explicit correction prompt. If the second attempt also fails, generate the plan without the pin and show a warning: "Couldn't incorporate 'Würfelspiel' — you can add it manually after generation."

### Token Budget Impact

Work Stream 3 adds a secondary LLM call with its own token cost. Estimated budget for the matching call:

```
Snippet library (up to 50 snippets × ~50 tokens each): ~2500 tokens
Generated plan phases (4-6 phases × ~100 tokens each): ~500 tokens
System prompt: ~300 tokens
Total per match check: ~3300 tokens (input) + ~200 tokens (output)
```

At fast-model pricing, this is negligible per call. If a teacher has a very large snippet library (200+ snippets), add a pre-filter: only send snippets whose `phase` field matches one of the plan's phase types. This reduces the candidate set to 20-50 snippets in practice.

---

## Phase 0 Success Criteria

Phase 0 is complete when all of the following are true:

- [x] "Close School Year" button appears on all active class detail pages
- [x] Clicking it triggers LLM generation with a visible loading state
- [x] The AI-generated draft populates a three-section editable form
- [x] Teacher can edit Summary, Strengths, and Weaknesses fields freely
- [x] Confirming archives the class: status becomes "archived", all data becomes read-only
- [ ] Archived classes appear in a "Previous Years" section on the class list
- [x] When a new class has a `predecessorId`, the predecessor's transition fields are included in lesson planning context (verify via AI traces)
- [x] Planning for classes without a predecessor is unaffected (no regression)
- [ ] Hardcoded teacher ID is isolated to a single, clearly labeled constant
- [ ] No TypeScript errors or linter errors in the codebase

---

## Phase 1 Success Criteria

Phase 1 is complete when all of the following are true:

**Work Stream 1 — Class Favorites:**
- [ ] Teacher can star a snippet for a specific class from the snippet library
- [ ] Starring a snippet from no class context opens a class picker
- [ ] Star icon reflects the current favorite status for the active class context
- [ ] Class detail page (`/classes/:id`) shows a "Snippets" section with class-favorited snippets
- [ ] Snippet library can be filtered to show only class-favorited snippets via `?classGroupId=`
- [ ] Removing a favorite unmarks it globally (not per-class duplication)

**Work Stream 2 — Plug-and-Play:**
- [ ] "From your snippets" collapsible panel is present in the lesson planner
- [ ] Panel respects phase filter tabs and class favorites toggle
- [ ] Teacher can pin one or more snippets before generating a plan
- [ ] Generated plan contains the pinned snippet(s) as fixed phases
- [ ] Pinned phases are visually labeled in the plan view
- [ ] Teacher can insert a snippet into an already-generated plan via a phase picker
- [ ] Post-insert plan reflects the change immediately (optimistic or tool-confirmed)

**Work Stream 3 — AI Suggestions:**
- [ ] Snippet match check fires asynchronously after every plan generation
- [ ] If matches exist, suggestion strip appears in the plan view within ~2 seconds
- [ ] Clicking "Use it" replaces the phase with the snippet content
- [ ] Clicking "Dismiss" removes the suggestion without affecting the plan
- [ ] No visible loading state during the async match check (silent if no matches)
- [ ] A teacher with 0 snippets sees no suggestion UI at all
