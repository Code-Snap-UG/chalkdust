# End-of-Year Transition — Feature Architecture Document

> **Status:** built
> **Created:** 2026-03-04
> **Updated:** 2026-03-05

## 1. Feature Summary

When a school year ends, a teacher closes their class in Chalkdust through a structured **Close School Year** flow. The AI analyses the full class diary and generates a transition summary draft covering the year's overall progress, the class's documented strengths, and areas that will need reinforcement in the next year. The teacher reviews and edits the draft, then archives the class.

The archived class becomes read-only but remains permanently accessible. When the teacher creates the following year's class and links it to the archived predecessor, the transition summary feeds directly into AI lesson planning context — giving the AI a standing brief on who this class is and where they left off.

---

## 2. Domain Model

All transition data lives on the existing `class_groups` table. No new tables are required.

```
ClassGroup
  status               — "active" | "archived"
  predecessorId        — nullable FK → class_groups (self-referential)
  transitionSummary    — teacher-edited overall year assessment
  transitionStrengths  — documented class strengths
  transitionWeaknesses — areas needing reinforcement next year
```

The `predecessorId` link is what connects two school years together. It is set when the new class is created (either manually via the class creation wizard, or automatically via the "Nachfolgeklasse anlegen" shortcut in the archive flow).

---

## 3. UI Flow

WhenEntry point: an **"Schuljahr abschließen"** button on the class detail page (`/classes/:id`). The button is only rendered when `isArchived` is false. Clicking it navigates to a dedicated full-page split view at `/classes/:id/transition` — no modal dialog.

### Split-view layout

The transition page uses a full-height two-column layout that fills the entire area below the dashboard header:

- **Left panel** (`flex-1`, independently scrollable): Read-only accordion list of all taught diary entries for the class — dates, status badges, and expandable content (planned summary, actual summary, teacher notes). Gives the teacher reference material while they write the documentation. Filters out `planned` entries since they haven't been taught yet.
- **Right panel** (`480px` fixed width, independently scrollable): The wizard state machine. Sticky header shows class metadata (name, grade, subject, school year) and a "← Zurück zur Klasse" back link on all steps except `done`.

This design solves the core problem of the modal approach: the teacher can scroll through diary entries on the left and fill in the transition fields on the right simultaneously, without switching screens.

### State machine

```
generating  (fires automatically on page load via useEffect)
  └─(AI returns)─► editing
  └─(AI fails)──► editing  (with amber error banner, empty form)

editing
  └─(all fields filled, click "Klasse archivieren")─► confirming
  └─(cancel / back link)────────────────────────────► navigates to /classes/:id

confirming
  └─(click "Ja, archivieren")─► saving
  └─(click "Zurück")──────────► editing

saving
  └─(success)─► done
  └─(error)───► editing  (with error banner)

done
  └─("Zur Klassenliste")────► navigates to /classes
  └─("Nachfolgeklasse anlegen")─► navigates to /classes/new?...
```

There is no `idle` state — unlike the old modal flow, the transition page always starts generating immediately on mount because the teacher intentionally navigated there. While the AI generates, the left panel is already visible and scrollable.

### Step rendering

Each state renders inline inside the right panel:

| State | What the teacher sees |
|---|---|
| `generating` | Centered spinner with "KI erstellt Übergangsdokumentation…" and a note that diary entries are visible on the left |
| `editing` | Three-field form (Jahresrückschau, Stärken, Förderbedarf) with AI draft pre-filled; amber error banner if generation failed |
| `confirming` | Compact confirmation screen; "Zurück" returns to `editing` |
| `saving` | Centered spinner with "Klasse wird archiviert…" |
| `done` | Success screen with two stacked actions: go to class list or create successor class |

### Graceful degradation on AI failure

If the transition generation API call fails, the wizard advances to `editing` with an amber warning banner explaining the failure. All three text areas are left empty so the teacher can write the documentation manually. The diary entries remain fully visible in the left panel throughout — the teacher has all the context they need to write the documentation from scratch. The archive action is fully available regardless of whether AI generation succeeded.

---

## 4. Successor Class Pre-fill

The "done" screen computes suggested values for the successor class and encodes them as URL search parameters on the `/classes/new` link:

| Parameter | Derived from |
|---|---|
| `name` | Grade number in the name incremented by 1 (e.g. `5a` → `6a`) |
| `grade` | Grade number incremented by 1 |
| `subject` | Unchanged from archived class |
| `schoolYear` | Both years incremented (e.g. `2024/2025` → `2025/2026`) |
| `predecessorId` | ID of the archived class |

The three helper functions that compute these:

```typescript
bumpGrade(grade)          // "5" → "6", non-numeric grades unchanged
bumpName(name, old, new)  // "5a" → "6a" (replaces leading grade prefix)
bumpSchoolYear(year)      // "2024/2025" → "2025/2026"
```

The new class wizard (`/classes/new`) reads these params via `useSearchParams()` and uses them as initial state for the Step 1 form fields. The teacher sees a pre-filled form — they can edit any value before proceeding.

---

## 5. API Routes

Both routes live at `src/app/api/classes/[id]/transition/route.ts`.

### `POST /api/classes/[id]/transition`

Generates the transition summary draft using the high-capability LLM model.

**Guards:**
- Returns 404 if the class group is not found
- Returns 400 if the class group is already archived

**Diary assembly:**

All diary entries for the class are fetched with their linked lesson plans. Entries with `progressStatus === "planned"` (future plans that haven't been taught yet) are excluded. Each taught entry is serialised as:

```
- {date}: [{status}] {actualSummary or plan summary} [Notiz: {teacherNotes}]
```

For vague summaries (e.g. "Alles wie geplant"), the entry falls back to a structured description built from the linked lesson plan (`buildPlanSummary`). This ensures the AI has substantive content to work with even for minimally annotated diary entries.

If the class has no taught diary entries, the prompt passes `"Keine Unterrichtseinträge vorhanden."` — the AI generates a placeholder that the teacher will need to replace manually.

**LLM call:**

```
Mode:   generateObject (via tracedGenerateObject)
Model:  high-capability
Schema: { summary: string, strengths: string, weaknesses: string }
System: transitionSummarySystemPrompt  (German, analytical, teacher-facing voice)
Prompt: buildTransitionSummaryPrompt(name, subject, grade, schoolYear, diaryText)
```

The call is wrapped in `tracedGenerateObject` so it is logged to `ai_traces` with `agentMode: "transition_summary"`.

**Response:** `{ summary, strengths, weaknesses }` — directly forwarded to the client.

---

### `PATCH /api/classes/[id]/transition`

Saves the three transition fields and archives the class in a single atomic DB update. This endpoint is called by the wizard instead of server actions — using a plain `fetch` avoids Next.js's automatic page re-render that server actions trigger, which would otherwise cause the transition page's `redirect()` guard to fire before the `done` step can render.

**Request body:** `{ summary: string, strengths: string, weaknesses: string }`

**Guards:**
- Returns 400 if any of the three fields is empty or whitespace-only
- Returns 404 if the class group is not found
- Returns 400 if the class group is already archived

**DB update:** Sets `transitionSummary`, `transitionStrengths`, `transitionWeaknesses`, and `status: "archived"` in a single `UPDATE` statement.

**Response:** `{ ok: true }` on success.

---

## 6. Server Actions

The following server actions still exist in `src/lib/actions/class-groups.ts` but are **not used by the transition wizard**. They are kept for potential use elsewhere (e.g. admin tooling).

### `saveTransitionSummary(classGroupId, { summary, strengths, weaknesses })`

Updates the three transition fields on the `class_groups` row and revalidates the class detail and class list paths.

### `archiveClassGroup(id)`

Guards that `transitionSummary` is non-empty before proceeding. Sets `status: "archived"` on the row and revalidates the class list path.

**Why the wizard no longer calls these directly:** Next.js automatically re-renders the current route after any server action completes. Since the transition page server component redirects when the class is archived (`if (classGroup.status === "archived") redirect(...)`), calling these server actions from the wizard would trigger that redirect before the `done` step could ever render. The `PATCH /api/classes/[id]/transition` endpoint handles the archive operation instead — plain fetch responses do not trigger re-renders.

---

## 7. Transition Context in Lesson Planning

The transition summary is injected into the AI context assembly (`src/lib/ai/context.ts`) when planning lessons for a class that has a predecessor link.

If `classGroup.predecessorId` is set, the context assembler fetches the predecessor row and, if it has transition data, appends a context section:

```
## Vorjahr – Übergangsinformationen

**Stärken:** {transitionStrengths}
**Schwächen:** {transitionWeaknesses}
**Zusammenfassung:** {transitionSummary}
```

This section is only included when at least one of `transitionStrengths` or `transitionWeaknesses` is present. If the predecessor exists but has no transition data, the section is silently omitted — planning for classes without a predecessor is entirely unaffected.

Token budget for this layer: approximately 500 tokens, consistent with the context window management spec.

---

## 8. File Map

| File | Role |
|---|---|
| `src/app/(dashboard)/classes/[id]/close-year-button.tsx` | Server component — link button that navigates to the transition page; no dialog or client state |
| `src/app/(dashboard)/classes/[id]/page.tsx` | Renders `CloseYearButton`; no longer passes class metadata props to it |
| `src/app/(dashboard)/classes/[id]/transition/page.tsx` | Server component — fetches class + diary entries, guards against archived classes, renders split-view layout |
| `src/app/(dashboard)/classes/[id]/transition/transition-wizard.tsx` | Client component — wizard state machine (`generating → editing → confirming → saving → done`); auto-fires AI generation on mount; uses `PATCH` fetch for archive |
| `src/app/(dashboard)/classes/[id]/transition/transition-diary-panel.tsx` | Client component — read-only accordion diary list for the left panel |
| `src/app/api/classes/[id]/transition/route.ts` | `POST` — AI generation; `PATCH` — save transition fields and archive |
| `src/lib/actions/class-groups.ts` | `saveTransitionSummary`, `archiveClassGroup` server actions (kept, not used by the wizard) |
| `src/lib/ai/context.ts` | Predecessor transition context injection (layer 7) |
| `src/lib/ai/prompts/transition-summary.ts` | System prompt and user prompt builder |
| `src/lib/ai/schemas.ts` | `transitionSummarySchema` Zod schema |
| `src/app/(dashboard)/classes/new/page.tsx` | New class wizard — reads URL params to pre-fill successor |
