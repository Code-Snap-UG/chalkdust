# End-of-Year Transition — Feature Architecture Document

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

Entry point: an **"Schuljahr abschließen"** button on the class detail page (`/classes/:id`). The button is only rendered when `isArchived` is false. The entire flow runs inside a single modal dialog (`Dialog` from shadcn/ui) with no page navigations until the final step.

### State machine

```
idle
  └─(click button)─► generating
                        └─(AI returns)─► editing
                        └─(AI fails)──► editing  (with error banner, empty form)

editing
  └─(all fields filled, click "Klasse archivieren")─► confirming
  └─(cancel / close)────────────────────────────────► idle

confirming
  └─(click "Ja, archivieren")─► saving
  └─(click "Zurück")──────────► editing

saving
  └─(success)─► done
  └─(error)───► editing  (with error banner)

done
  └─(close / "Zur Klassenliste")─► navigates to /classes
  └─("Nachfolgeklasse anlegen")──► navigates to /classes/new?...
```

### Step rendering

Each state renders a different view inside the same `DialogContent`:

| State | What the teacher sees |
|---|---|
| `generating` | Centered spinner with "KI erstellt Übergangsdokumentation…" |
| `editing` | Three-field form (Jahresrückschau, Stärken, Förderbedarf) with AI draft pre-filled; error banner shown if generation failed |
| `confirming` | Compact confirmation screen; "Zurück" returns to `editing` |
| `saving` | Centered spinner with "Klasse wird archiviert…" |
| `done` | Success screen with two actions: go to class list or create successor class |

### Graceful degradation on AI failure

If the transition generation API call fails, the dialog does not close. Instead, the state advances to `editing` with an amber warning banner explaining the failure, and all three text areas are left empty so the teacher can write the documentation manually. The archive action remains fully available — the AI draft is a convenience, not a requirement.

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

## 5. API Route

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

## 6. Server Actions

### `saveTransitionSummary(classGroupId, { summary, strengths, weaknesses })`

Updates the three transition fields on the `class_groups` row and revalidates the class detail and class list paths. Called from the client component before `archiveClassGroup`.

### `archiveClassGroup(id)`

Guards that `transitionSummary` is non-empty before proceeding — the archive action can only complete if a summary has been saved. Sets `status: "archived"` on the row and revalidates the class list path.

Both actions are Next.js Server Actions (`"use server"`), called directly from the `CloseYearButton` client component.

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
| `src/app/(dashboard)/classes/[id]/close-year-button.tsx` | Client component — entire dialog state machine and UI |
| `src/app/(dashboard)/classes/[id]/page.tsx` | Renders `CloseYearButton` with class metadata props |
| `src/app/api/classes/[id]/transition/route.ts` | `POST` — AI transition generation endpoint |
| `src/lib/actions/class-groups.ts` | `saveTransitionSummary`, `archiveClassGroup` server actions |
| `src/lib/ai/context.ts` | Predecessor transition context injection (layer 7) |
| `src/lib/ai/prompts/transition-summary.ts` | System prompt and user prompt builder |
| `src/lib/ai/schemas.ts` | `transitionSummarySchema` Zod schema |
| `src/app/(dashboard)/classes/new/page.tsx` | New class wizard — reads URL params to pre-fill successor |
