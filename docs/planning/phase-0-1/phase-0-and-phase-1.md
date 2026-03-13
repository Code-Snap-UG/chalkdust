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
| Context assembly (Lehrplan + diary + predecessor) | Built | `src/lib/ai/context.ts` — see architecture doc |
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
| Class favorites endpoints and UI | Built | Work Stream 1 complete — star toggle, class picker popover, class detail section |
| Plug-and-play in lesson planner | **WILL NOT IMPLEMENT** | Moved to [graveyard](../../graveyard/plug-and-play-lesson-planner.md) |
| AI-suggested snippet matching | **WILL NOT IMPLEMENT** | Moved to [graveyard](../../graveyard/ai-snippet-matching.md) |

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

**Local file storage**: Uploaded materials (Lehrplan PDFs, diary attachments) are stored on the local filesystem. This is fine for development and early testing. Not production-safe. Deferred to Phase 2 or Phase 3 when a deployment target is chosen (Vercel + R2 is the likely path).

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

> **WILL NOT IMPLEMENT** — Moved to the [feature graveyard](../../graveyard/plug-and-play-lesson-planner.md). The UX complexity is not justified until teachers have built a meaningful snippet library. Full design is preserved in the graveyard doc.

---

### Work Stream 3: AI-Suggested Snippet Matching

> **WILL NOT IMPLEMENT** — Moved to the [feature graveyard](../../graveyard/ai-snippet-matching.md). Requires a large snippet library to be useful; premature at current scale. Full design is preserved in the graveyard doc.

---

## Cross-Cutting Concerns

### Dependency Graph

```
Phase 0: End-of-year transition flow
  └── No dependencies (standalone)

Phase 1, Work Stream 1: Class favorites
  └── No dependencies (table already exists)

Phase 1, Work Stream 2: Plug-and-play
  └── WILL NOT IMPLEMENT — see graveyard

Phase 1, Work Stream 3: AI snippet matching
  └── WILL NOT IMPLEMENT — see graveyard
```

### Recommended Build Sequence

1. **Phase 0 gap closure first** — close the end-of-year transition flow. This is the only unbuilt piece that touches the context assembly pipeline that everything else builds on. It also unblocks the full "plan → teach → reflect → transition → reuse" loop that the product is built around.

2. **Work Stream 1 (class favorites) — backend first** — the database is ready; adding the three server actions and API routes is low-risk and unblocks the UI work.

3. ~~**Work Stream 3 (AI matching) in parallel**~~ — will not implement; moved to graveyard.

4. **Work Stream 1 UI** — snippet library star controls, class detail snippets section.

5. ~~**Work Stream 2 (plug-and-play)**~~ — will not implement; moved to graveyard.

### Error Handling

**Transition summary generation**: LLM calls can fail. The flow should degrade gracefully — if generation fails, show the empty form and let the teacher write the summary manually. Do not block the archive action on a successful LLM call.

**Favorite toggle**: Optimistic UI updates should revert on API error with a toast notification. The underlying action is simple enough that failures should be rare.

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
- [x] Teacher can star a snippet for a specific class from the snippet library
- [x] Starring a snippet from no class context opens a class picker popover (lazy-loads current state, checkbox per class)
- [x] Star icon reflects the current favorite status for the active class context
- [x] Class detail page (`/classes/:id`) shows a "Snippets" section with class-favorited snippets
- [x] Snippet library can be filtered to show only class-favorited snippets via `?classGroupId=`
- [x] Removing a favorite removes only the class pointer — the snippet remains in the global library

**Work Stream 2 — Plug-and-Play:** WILL NOT IMPLEMENT — see [graveyard](../../graveyard/plug-and-play-lesson-planner.md).

**Work Stream 3 — AI Suggestions:** WILL NOT IMPLEMENT — see [graveyard](../../graveyard/ai-snippet-matching.md).
