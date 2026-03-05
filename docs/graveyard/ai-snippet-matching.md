# Feature: AI-Suggested Snippet Matching

> **Status:** will-not-implement
> **Source:** [`planning/phase-0-1/phase-0-and-phase-1.md`](../planning/phase-0-1/phase-0-and-phase-1.md) — Phase 1, Work Stream 3
> **Graveyarded:** 2026-03-05
> **Reason:** Premature optimisation; the matching value is negligible until a teacher has saved enough snippets to form a real library worth matching against.

## Why this was set aside

The feature requires a teacher to have accumulated a meaningful snippet library before it provides any value — the spec even hard-codes a minimum of 3 snippets before firing the check. In early usage, most teachers will have very few snippets, so the feature would almost never trigger. Building the async post-generation pipeline, the LLM matching call, and the suggestion UI at this stage adds infrastructure cost and UI complexity for near-zero return. Revisit after usage data shows teachers regularly building libraries of 20+ snippets.

---

## Original design

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

#### Token Budget

```
Snippet library (up to 50 snippets × ~50 tokens each): ~2500 tokens
Generated plan phases (4-6 phases × ~100 tokens each): ~500 tokens
System prompt: ~300 tokens
Total per match check: ~3300 tokens (input) + ~200 tokens (output)
```

At fast-model pricing this is negligible per call. If a teacher has a very large snippet library (200+ snippets), add a pre-filter: only send snippets whose `phase` field matches one of the plan's phase types. This reduces the candidate set to 20–50 snippets in practice.

#### Success Criteria (original)

- [ ] Snippet match check fires asynchronously after every plan generation
- [ ] If matches exist, suggestion strip appears in the plan view within ~2 seconds
- [ ] Clicking "Use it" replaces the phase with the snippet content
- [ ] Clicking "Dismiss" removes the suggestion without affecting the plan
- [ ] No visible loading state during the async match check (silent if no matches)
- [ ] A teacher with 0 snippets sees no suggestion UI at all
