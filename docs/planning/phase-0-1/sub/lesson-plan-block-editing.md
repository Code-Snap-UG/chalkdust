# Lesson Plan Block Editing — Implementation Plan

**Status:** Ready for implementation  
**Last updated:** March 2026  
**Related docs:**  
- [`../features/lesson-planning.md`](../features/lesson-planning.md) — lesson planning architecture  
- [`../features/snippets.md`](../features/snippets.md) — snippets north star and roadmap  
- [`phase-0-and-phase-1.md`](phase-0-and-phase-1.md) — broader roadmap context  

---

## Overview

Currently, teachers can only modify a lesson plan through the AI chat refinement loop. This plan describes how to give teachers direct, manual editing of every block in the plan — without leaving the plan view and without losing context of the surrounding content.

The design is governed by three principles that emerged from the brainstorm:

1. **No dialogs for content editing.** Lesson plan blocks are interdependent; losing sight of the surrounding plan while editing one block leads to incoherence. All editing happens inline, within the card, in full context of the rest of the plan.
2. **One block in edit mode at a time.** Keeps the editing surface unambiguous and prevents multi-dirty-state conflicts.
3. **The editing surface and future blank-plan creation are the same thing.** The components built here should work identically whether the plan was AI-generated or manually assembled from scratch. Empty arrays and null fields should render sensible empty states, not errors.

---

## Architecture Before / After

### Before

`LessonPlanDetailClient` renders the full plan as a static read-only view. All modifications go through the AI chat endpoint (`/api/chat`), which calls `streamText` with 9 plan-editing tools and re-fetches the plan when the stream finishes.

### After

Each block section becomes its own stateful component that:
- Renders a read-only view by default
- Switches to an inline edit form when the teacher activates it
- Saves directly via `PATCH /api/lesson-plans/[id]` (no AI involved)
- Updates local plan state optimistically on success

The AI chat loop is unchanged. Both paths co-exist: the chat is "tell the AI what to improve," the direct edit is "I know exactly what I want."

---

## Phase 1 — Inline Editing Foundation

### Goal

All five sections of the plan are directly editable. The teacher can click a pencil icon, edit content in-place, and save — all without leaving the plan view and without going through AI.

---

### 1.1 New API Endpoint: `PATCH /api/lesson-plans/[id]`

Create `src/app/api/lesson-plans/[id]/route.ts` (alongside the existing `GET` at the same path).

**Method:** `PATCH`  
**Auth:** Same session check as existing routes  
**Body:** A partial object — only the fields being updated are sent. At least one field must be present.

```typescript
// Request body shape (all fields optional, at least one required)
{
  objectives?:      Array<{ text: string; curriculumTopicId?: string }>,
  timeline?:        Array<{ phase: string; durationMinutes: number; description: string; method: string }>,
  differentiation?: { weaker: string; stronger: string },
  materials?:       Array<{ title: string; type: string; description: string }>,
  homework?:        string | null,
}
```

**Validation:** Parse the body with a Zod partial of the existing `lessonPlanSchema` from `src/lib/ai/schemas.ts`. Reject with 400 if the body is empty or fails validation.

**DB update:** Use Drizzle's `update().set({ ...validatedFields }).where(eq(lessonPlans.id, id))`. Only the fields present in the body are written — do not overwrite other fields.

**Response:** `200 OK` with the full updated plan record (same shape as `GET /api/lesson-plans/[id]`).

```typescript
// src/app/api/lesson-plans/[id]/route.ts (add alongside existing GET)

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const patchSchema = lessonPlanSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided" }
  );

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(lessonPlans)
    .set(parsed.data)
    .where(eq(lessonPlans.id, params.id))
    .returning();

  if (!updated) {
    return Response.json({ error: "Plan not found" }, { status: 404 });
  }

  return Response.json(updated);
}
```

---

### 1.2 State Architecture in `LessonPlanDetailClient`

The parent component (`src/app/(dashboard)/lesson-plans/[id]/lesson-plan-detail-client.tsx`) owns the `plan` state. It gains a `handleBlockSave` function that:

1. Calls `PATCH /api/lesson-plans/[id]` with the updated field
2. On success, updates the local `plan` state directly (no full re-fetch needed — we know exactly what changed)
3. On error, leaves the section in its error state and surfaces the error

```typescript
async function handleBlockSave(field: keyof DisplayPlan, value: unknown) {
  const res = await fetch(`/api/lesson-plans/${initialPlan.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [field]: value }),
  });
  if (!res.ok) throw new Error("Speichern fehlgeschlagen");
  const updated = await res.json();
  setPlan(toDisplayPlan(updated));
}
```

Each section component receives the relevant slice of `plan` and an `onSave` callback. The parent does not manage the in-progress draft state of any section — that lives inside the section component.

**One-at-a-time rule:** The parent tracks `activeEditSection: string | null` (e.g. `"timeline-2"`, `"objectives-0"`, `"differentiation"`). Each section component receives `isActive` and an `onActivate` / `onDeactivate` pair. When `onActivate` is called, the parent sets the new `activeEditSection`. If the previous active section had unsaved changes, the section component is responsible for showing an inline "Unsaved changes — discard?" prompt before yielding.

---

### 1.3 Component: `TimelineSection`

**File:** `src/app/(dashboard)/lesson-plans/[id]/timeline-section.tsx`

This is the most complex section. It renders the list of timeline phases and manages which phase (if any) is currently being edited.

**Props:**
```typescript
type TimelineSectionProps = {
  phases: TimelinePhase[];
  lessonDurationMinutes: number;  // for duration validation
  lessonPlanId: string;           // passed to SaveSnippetDialog
  onSave: (updatedPhases: TimelinePhase[]) => Promise<void>;
};
```

**Duration indicator** in the card header (right-aligned, next to the title):
- Compute `totalMinutes = phases.reduce((sum, p) => sum + p.durationMinutes, 0)`
- If `totalMinutes === lessonDurationMinutes`: render `"45/45 Min."` in green (`text-emerald-600`)
- If `totalMinutes < lessonDurationMinutes`: render `"43/45 Min."` in amber (`text-amber-500`) with a subtle `⚠` prefix
- If `totalMinutes > lessonDurationMinutes`: render `"48/45 Min."` in red (`text-destructive`) with a `⚠` prefix
- This updates in real time as the teacher types in any phase's duration field (the draft duration is fed up to the section via a callback before saving)

**Phase ordering:** Phases render in array order. In Phase 1, reordering is not supported — the drag handle `⠿` icon is rendered as an inert `GripVertical` icon with `cursor-default` so the slot is visually present but non-functional.

**Add a phase:** A `"+ Phase hinzufügen"` button at the bottom of the phase list. Clicking it appends a new blank phase `{ phase: "Neue Phase", durationMinutes: 5, description: "", method: "Unterrichtsgespräch" }` to the local phases array and immediately puts that new phase into edit mode.

---

### 1.4 Component: `TimelinePhaseRow`

**File:** `src/app/(dashboard)/lesson-plans/[id]/timeline-phase-row.tsx`

The most important new component. Each phase renders as a self-contained row that can switch between view and edit mode.

**Props:**
```typescript
type TimelinePhaseRowProps = {
  phase: TimelinePhase;
  index: number;
  isEditing: boolean;
  lessonPlanId: string;
  // Duration feedback before save (real-time validation)
  onDraftDurationChange: (index: number, minutes: number) => void;
  onEdit: (index: number) => void;       // request to enter edit mode
  onCancel: (index: number) => void;     // discard draft
  onSave: (index: number, updated: TimelinePhase) => Promise<void>;
  onDelete: (index: number) => void;
  // Phase 2 — drag handle (inert in Phase 1)
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
};
```

**Internal state:**
```typescript
const [draft, setDraft] = useState<TimelinePhase>(phase);
const [isSaving, setIsSaving] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

**View mode rendering:**
```
⠿  [phase name]   [method badge]   [duration] Min.   [🔖]  [✏️]
   [description text, muted]
```
- `⠿` → `<GripVertical className="size-4 text-muted-foreground/30 cursor-default" />` (inert in Phase 1)
- `[🔖]` → existing `<SaveSnippetDialog>` component, unchanged
- `[✏️]` → `<Button variant="ghost" size="icon">` with `<Pencil className="size-3.5" />`, calls `onEdit(index)`

**Edit mode rendering (inline expand):**

The row expands below its header row to show a form. The rest of the phase list above and below remains fully visible.

```
⠿  [phase name]   [method badge]   [duration] Min.   [🔖]  [✏️ active]
┌──────────────────────────────────────────────────────────────────────┐
│  Phase:    [Input: phase name        ▼]   Methode: [Select ▼      ] │
│  Dauer:    [Input: number] Min.                                      │
│                                                                       │
│  Beschreibung:                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ [Textarea — description                                        ]│ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  [🗑 Löschen]  →  [Wirklich löschen? [Ja, löschen] [Abbrechen]]     │
│                                     [Abbrechen]  [Speichern]         │
└──────────────────────────────────────────────────────────────────────┘
```

Field details:
- **Phase name:** `<Input>` — free text, but a `<datalist>` provides suggestions: `Einstieg`, `Erarbeitung`, `Sicherung`, `Abschluss`
- **Methode:** `<Select>` with options: `Unterrichtsgespräch`, `Gruppenarbeit`, `Einzelarbeit`, `Partnerarbeit`, `Lehrervortrag`, `Sonstiges`
- **Dauer:** `<Input type="number" min={1} max={180}>` — calls `onDraftDurationChange(index, value)` on every `onChange` for real-time duration sum feedback
- **Beschreibung:** `<Textarea rows={3}>`

**Delete flow inside edit mode:**
- First click on `[🗑 Löschen]`: sets `showDeleteConfirm = true`, renders inline `"Wirklich löschen?"` with `[Ja, löschen]` (destructive) and `[Abbrechen]` buttons
- `[Ja, löschen]` calls `onDelete(index)` — parent removes the phase from the array and saves via PATCH
- No separate modal/dialog

**Save flow:**
- `[Speichern]` → `setIsSaving(true)` → call `onSave(index, draft)` → parent updates array and PATCHes → on success component collapses back to view mode → on error show inline error message, stay in edit mode

**Cancel flow:**
- `[Abbrechen]` → reset `draft` to the original `phase` prop, call `onCancel(index)`

---

### 1.5 Component: `ObjectivesSection`

**File:** `src/app/(dashboard)/lesson-plans/[id]/objectives-section.tsx`

Objectives are simpler — each one is just a text string. The interaction is lighter than phases.

**Props:**
```typescript
type ObjectivesSectionProps = {
  objectives: Objective[];
  onSave: (updated: Objective[]) => Promise<void>;
};
```

**View mode:** Bulleted list. Each item has a small `[✏️]` icon on hover and a `[×]` delete button.

**Edit mode per item:** Clicking `[✏️]` on item `i` replaces the bullet text with a single `<Textarea rows={2}>` and `[Abbrechen]` / `[Speichern]` buttons inline. Saving calls `onSave` with the full updated array.

**Add:** A `"+ Lernziel hinzufügen"` button at the bottom appends a blank objective and puts it immediately in edit mode.

**Delete:** The `[×]` on each item is direct — no confirm needed (objectives are short, easily re-typed). Clicking `[×]` removes the item from the array and calls `onSave` immediately.

---

### 1.6 Component: `MaterialsSection`

**File:** `src/app/(dashboard)/lesson-plans/[id]/materials-section.tsx`

Same pattern as `TimelineSection` but with simpler fields: `title`, `type`, `description`.

**Edit mode per item (inline expand):**
```
┌──────────────────────────────────────────────────────┐
│  Titel:  [Input: title                             ] │
│  Typ:    [Select: worksheet / physical / digital / textbook / other] │
│  Beschreibung: [Textarea rows={2}]                   │
│                                                       │
│  [🗑 Löschen]      [Abbrechen]  [Speichern]          │
└──────────────────────────────────────────────────────┘
```

Delete: same inline confirm as timeline phases.

**Add:** `"+ Material hinzufügen"` button at the bottom.

---

### 1.7 Component: `DifferentiationSection`

**File:** `src/app/(dashboard)/lesson-plans/[id]/differentiation-section.tsx`

This is a single object (no array management). The entire card toggles between view and edit mode.

**View mode:** Two labeled paragraphs (Schwächere Schüler / Stärkere Schüler).

**Edit mode:** A `[✏️]` icon in the `CardHeader` triggers edit mode for the whole card. The two paragraphs become two `<Textarea>` fields, with `[Abbrechen]` / `[Speichern]` at the bottom of the card.

```
[CardHeader]  Differenzierung  ─────────────────────── [✏️]
[CardContent]
  Schwächere Schüler:
  [Textarea rows={3} value={draft.weaker}]

  Stärkere Schüler:
  [Textarea rows={3} value={draft.stronger}]

  [Abbrechen]  [Speichern]
```

---

### 1.8 Component: `HomeworkSection`

**File:** `src/app/(dashboard)/lesson-plans/[id]/homework-section.tsx`

Single nullable text field. Same in-card toggle pattern as Differenzierung.

**View mode:** `<p className="text-sm">{plan.homework}</p>`, or a muted `"Noch keine Hausaufgaben geplant."` if null. Card is always visible regardless (do not conditionally hide the card — the teacher may want to add homework even if the AI left it empty).

**Edit mode:** `[✏️]` in the header → `<Textarea rows={2}>` fills the card content, with `[Abbrechen]` / `[Speichern]`. Saving with an empty textarea sets `homework` to `null`.

---

### 1.9 Refactoring `LessonPlanDetailClient`

`src/app/(dashboard)/lesson-plans/[id]/lesson-plan-detail-client.tsx` currently renders all plan content inline. After this phase it becomes an orchestrator that:

1. Owns the `plan` state and `activeEditSection` state
2. Renders the five section components with their props/callbacks
3. Contains the `handleBlockSave` function
4. Keeps the chat panel and approve button untouched

The existing `SaveSnippetDialog` on each phase row is preserved as-is — it receives `phase` and `lessonPlanId` exactly as before.

---

### 1.10 Phase 1 Acceptance Criteria

- [ ] `PATCH /api/lesson-plans/[id]` updates any combination of fields and returns the updated record
- [ ] Clicking ✏️ on a timeline phase expands an inline edit form; the rest of the plan remains visible
- [ ] Only one block can be in edit mode at a time; activating a second one collapses the first (or prompts if unsaved)
- [ ] The duration indicator in the Stundenablauf header updates in real time as the teacher edits phase durations — green when balanced, amber/red otherwise
- [ ] Saving a phase closes the edit form and updates the plan in the UI without a full page reload
- [ ] Cancel discards changes and collapses the form
- [ ] Deleting a timeline phase requires an inline two-step confirm; deleting an objective is immediate
- [ ] Adding a new phase or objective opens it immediately in edit mode
- [ ] Differenzierung and Hausaufgaben have in-card edit toggles
- [ ] The Hausaufgaben card is always visible, even when `homework` is null
- [ ] All existing features (chat refinement, SaveSnippetDialog, approve button) continue to work
- [ ] TypeScript: no type errors; all new components are fully typed
- [ ] `plan.tsx` (the other planning page at `/classes/[id]/plan`) is NOT changed in this phase

---

## Phase 2 — Drag-to-Reorder + Snippet Drawer

### Goal

Give teachers the ability to reorder timeline phases by dragging, and to insert saved snippets directly into the timeline from a side drawer — without leaving the plan.

**Dependency:** Phase 1 must be complete. The `TimelinePhaseRow` component's drag handle slot must be in place (it is, from Phase 1).

---

### 2.1 Install `@dnd-kit`

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Packages used:
- `@dnd-kit/core` — `DndContext`, `DragOverlay`, sensors
- `@dnd-kit/sortable` — `SortableContext`, `useSortable`, `arrayMove`
- `@dnd-kit/utilities` — `CSS.Transform.toString` for style transforms

---

### 2.2 Making `TimelineSection` Sortable

Wrap the phase list in `DndContext` and `SortableContext` inside `TimelineSection`:

```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

// Each phase needs a stable ID for dnd-kit. Use index-based IDs for now
// since phases don't have UUIDs. A string like `phase-0`, `phase-1` works.
```

`onDragEnd` handler in `TimelineSection`:
```typescript
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = phases.findIndex((_, i) => `phase-${i}` === active.id);
  const newIndex = phases.findIndex((_, i) => `phase-${i}` === over.id);
  const reordered = arrayMove(phases, oldIndex, newIndex);

  // Optimistic local update, then persist
  onSave(reordered);
}
```

---

### 2.3 Making `TimelinePhaseRow` a Sortable Item

`TimelinePhaseRow` receives an `id` prop (e.g. `"phase-0"`) and calls `useSortable`:

```typescript
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id });

const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
};
```

The `dragHandleProps` slot from Phase 1 now receives `{ ...attributes, ...listeners }`. The `GripVertical` icon gets `cursor-grab active:cursor-grabbing` and the props applied.

**Important:** Disable drag while a phase is in edit mode. When `isEditing` is true, do not pass `listeners` to the drag handle — pass an empty object instead. This prevents accidental drags while typing.

---

### 2.4 The Snippet Drawer

**File:** `src/app/(dashboard)/lesson-plans/[id]/snippet-drawer.tsx`

Uses shadcn `<Sheet side="right">`. It is an overlay — it does not displace the chat panel or change the two-column layout. The teacher can have both the chat and the snippet drawer open.

**Opening:** A `"Snippets"` button (with a `Library` icon from lucide) in the `TimelineSection` card header, next to the `"+ Phase hinzufügen"` button. Clicking it opens the drawer.

**Drawer layout:**
```
┌─────────────────────────────────────────┐
│  Snippets                           [×] │
│  ─────────────────────────────────────  │
│  🔍 [Search input]                      │
│  ─────────────────────────────────────  │
│  [All] [Einstieg] [Erarbeitung]         │
│  [Sicherung] [Abschluss]                │
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Würfelspiel                     │    │
│  │ [Einstieg] [Partnerarbeit] 10m  │    │
│  │ Schüler würfeln in Paaren...    │    │
│  │                    [Einfügen ↓] │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Gruppenrätsel                   │    │
│  │ [Erarbeitung] [Gruppenarbeit]   │    │
│  │ 20m                             │    │
│  │                    [Einfügen ↓] │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Data fetching:** On open, fetch `GET /api/snippets` (already exists). The drawer holds its own local `snippets` state + `searchQuery` + `phaseFilter`.

**Filtering:** Client-side, no new API calls needed for filtering.
- `searchQuery` filters by `title` and `description` (case-insensitive contains)
- `phaseFilter` filters by `snippet.phase`

**Snippet-to-phase conversion:**
```typescript
function snippetToPhase(snippet: LessonSnippet): TimelinePhase {
  return {
    phase: snippet.phase,
    durationMinutes: snippet.durationMinutes ?? 10,
    description: snippet.description,
    method: snippet.method ?? "Unterrichtsgespräch",
  };
}
```

**"Einfügen" click:** When the teacher clicks `[Einfügen ↓]` on a snippet card:
1. Convert the snippet to a `TimelinePhase` via `snippetToPhase`
2. Append it to the end of the `phases` array (inserting at the end is the simplest v1 behavior; between-row insertion is future)
3. Put the new phase immediately into edit mode so the teacher can review/adjust before saving
4. The drawer can stay open — the teacher may want to insert more

**No drag-from-drawer yet.** Cross-container drag-and-drop (from the Sheet overlay into the timeline) requires a `DragOverlay` and custom collision detection. This is deferred to a later iteration. Click-to-insert is sufficient for Phase 2.

---

### 2.5 Phase 2 Acceptance Criteria

- [ ] Timeline phases can be dragged to reorder; order persists via `PATCH /api/lesson-plans/[id]` with the updated `timeline` array
- [ ] Drag is disabled on a phase that is currently in edit mode
- [ ] The drag handle `⠿` shows `cursor-grab` when dragging is available
- [ ] A snippet drawer opens from a "Snippets" button in the Stundenablauf card header
- [ ] The drawer shows all teacher snippets, with search and phase filter
- [ ] Clicking "Einfügen" on a snippet appends a new phase pre-populated from the snippet, immediately in edit mode
- [ ] The drawer can remain open while editing the newly inserted phase
- [ ] All Phase 1 behavior is preserved

---

## Future — Global Edit Mode

**Status: Abandoned.** Global edit mode was originally scoped here but has been dropped from the roadmap. The per-block editing added in Phase 1 is sufficient — a separate "all blocks visible at once" mode adds complexity without clear UX benefit given that individual blocks are always one click away.

---

## Phase 3 — Manual (Blank) Plan Creation

**Status: Implemented March 2026.**

Teachers can now create a lesson plan entirely from scratch, without AI involvement. The blank creation flow reuses the existing `LessonPlanDetailClient` editing surface (with Phase 1 section components handling empty arrays as first-class state) — no new editing components were needed.

### Entry point

A **"Manuell erstellen"** button (outline style, `PencilLine` icon) was added to the class dashboard (`src/app/(dashboard)/classes/[id]/page.tsx`) in two places — the header action group alongside "Stunde planen", and as a sibling quick-link card. Both are guarded by `!isArchived`.

### Flow

```
Class Dashboard  →  /classes/[id]/plan/blank  →  /lesson-plans/[id]
(button click)      (mini setup form)             (existing inline editors)
```

1. Teacher clicks "Manuell erstellen"
2. A brief form collects: **topic** (required), **date** (optional), **duration** (select: 45 / 60 / 90 / 120 min, default 45)
3. On submit, `createBlankLessonPlan` server action inserts a draft record with empty arrays and null content fields
4. Teacher is redirected to `/lesson-plans/[id]` where all Phase 1 section components are available with their empty-state prompts

### New files

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/classes/[id]/plan/blank/page.tsx` | Server component — fetches class group (redirects if archived), renders `BlankPlanForm` |
| `src/app/(dashboard)/classes/[id]/plan/blank/blank-plan-form.tsx` | Client form — topic input, date picker, duration select, calls server action, redirects on success |

### New server action

`createBlankLessonPlan` in `src/lib/actions/lesson-plans.ts`:

```typescript
export async function createBlankLessonPlan(
  classGroupId: string, topic: string,
  lessonDate?: string, durationMinutes?: number
) {
  const [created] = await db.insert(lessonPlans).values({
    classGroupId, topic,
    lessonDate: lessonDate || null,
    durationMinutes: durationMinutes || 45,
    status: "draft",
    objectives: [], timeline: [],
    differentiation: { weaker: "", stronger: "" },
    materials: [], homework: null,
  }).returning();
  revalidatePath(`/classes/${classGroupId}`);
  return created;
}
```

### Acceptance criteria

- [ ] "Manuell erstellen" button visible on class dashboard (header + quick-link card), hidden for archived classes
- [ ] Clicking navigates to `/classes/[id]/plan/blank`
- [ ] Form requires topic, date/duration are optional
- [ ] Submit creates a draft record and redirects to `/lesson-plans/[id]`
- [ ] Empty section components show add-item prompts (`+ Phase hinzufügen`, `+ Lernziel hinzufügen`, etc.)
- [ ] All Phase 1 and Phase 2 behaviour is preserved on the resulting plan

### Drag-from-Drawer into Timeline

Phase 2 implements click-to-insert. True drag-from-drawer-to-timeline requires:
- A `DragOverlay` component that renders a floating clone of the dragged snippet card
- The `DndContext` must wrap both the timeline and the snippet drawer
- A `droppable` zone between each pair of phase rows (on-hover insert indicator)
- Custom `collisionDetection` to handle the coordinate space of the Sheet overlay

This is a non-trivial UX and engineering effort and is explicitly deferred until the click-to-insert path has been validated with real teacher usage.

### AI-Suggested Snippet Matching

When the AI generates a plan, for each timeline phase it checks the teacher's snippet library for a semantic match. If one is found above a confidence threshold, the phase row shows a subtle indicator: `"Ähnlich: Würfelspiel (dein Snippet)"` with a `[Verwenden]` button that replaces the AI-generated phase with the saved snippet. This closes the loop described in the snippets roadmap as Phase 6.

---

## Component File Map

```
src/app/(dashboard)/lesson-plans/[id]/
  lesson-plan-detail-client.tsx       ← refactored orchestrator (Phase 1)
  timeline-section.tsx                ← Phase 1
  timeline-phase-row.tsx              ← Phase 1
  objectives-section.tsx              ← Phase 1
  materials-section.tsx               ← Phase 1
  differentiation-section.tsx         ← Phase 1
  homework-section.tsx                ← Phase 1
  snippet-drawer.tsx                  ← Phase 2

src/app/(dashboard)/classes/[id]/
  page.tsx                            ← MODIFIED: Phase 3 (added buttons + card)
  plan/blank/
    page.tsx                          ← NEW: Phase 3
    blank-plan-form.tsx               ← NEW: Phase 3

src/app/api/lesson-plans/[id]/
  route.ts                            ← PATCH handler added (Phase 1)

src/lib/actions/lesson-plans.ts       ← createBlankLessonPlan added (Phase 3)
```

No changes to:
- `src/app/(dashboard)/classes/[id]/plan/page.tsx` — AI generation page, unchanged
- `src/components/snippets/save-snippet-dialog.tsx` — bookmark dialog, unchanged
- `src/app/api/chat/route.ts` — AI chat, unchanged
- `src/lib/ai/schemas.ts` — Zod schemas, unchanged
